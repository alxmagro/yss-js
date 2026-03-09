/**
 * YSS core validator.
 * Uses the type and rule registries - each type and rule is an isolated module.
 */

import { getType }                 from '../types/index.js'
import { scalarRules, arrayRules, getRule } from '../rules/index.js'
import { makeError, joinPath }     from './errors.js'

/**
 * Validate a value against a schema node.
 * @param {*}      value       - the value being validated
 * @param {object} node        - normalized schema node from the parser
 * @param {string} path        - current dot-path for error messages
 * @param {boolean} inherited  - strict value cascaded from parent (default: false)
 * @returns {Array}            - array of { path, code, message } error objects
 */
export function validateNode (value, node, path = '', inherited = false) {
  const errors = []

  // Resolve effective strict: local declaration wins, otherwise inherit
  const strict = node.strict !== null ? node.strict : inherited

  // ── AnyOf ──────────────────────────────────────────────────────────────────
  if (node.anyOf) {
    return getRule('anyOf')(value, node.anyOf, path, strict)
  }

  // ── Type check ─────────────────────────────────────────────────────────────
  // node.type may be a string or an array of strings (e.g. ['String', 'null'])
  const types = Array.isArray(node.type) ? node.type : [node.type]

  const matchingType = types.find(t => {
    const def = getType(t)
    return def && !def.validate(value)
  })

  if (!matchingType) {
    errors.push(makeError(path, 'type_mismatch', 'Unexpected type', {
      value,
      expected: types.length === 1 ? types[0] : types,
    }))
    return errors
  }

  // Use the matched type for rule applicability checks
  const typeDef = getType(matchingType)

  if (matchingType === 'null') return errors

  // ── Scalar rules ───────────────────────────────────────────────────────────
  for (const [ruleName, ruleFn] of Object.entries(scalarRules)) {
    const param = node[ruleName] ?? node[`$${ruleName}`]
    if (param === null || param === undefined) continue
    if (!typeDef.rules.includes(ruleName)) continue

    const result = ruleFn(value, param, path)
    if (result) errors.push(makeError(path, result.code, result.message, result.data))
  }

  // ── Array rules ────────────────────────────────────────────────────────────
  for (const [ruleName, ruleFn] of Object.entries(arrayRules)) {
    const param = node[ruleName] ?? node[`$${ruleName}`]
    if (param === null || param === undefined) continue
    if (!typeDef.rules.includes(ruleName)) continue

    errors.push(...ruleFn(value, param, path, matchingType))
  }

  // ── Set uniqueness ─────────────────────────────────────────────────────────
  if (matchingType === 'Set') {
    const seen = new Set()
    for (let i = 0; i < value.length; i++) {
      const key = JSON.stringify(value[i])
      if (seen.has(key))
        errors.push(makeError(joinPath(path, i), 'set_duplicated', `duplicate value in Set`))
      seen.add(key)
    }
  }

  // ── Object fields ──────────────────────────────────────────────────────────
  if (matchingType === 'Object' && node.fields) {
    errors.push(...validateObject(value, node, path, strict))
  }

  return errors
}

/**
 * Validate an Object's declared fields, and enforce strict mode if active.
 * @param {boolean} strict - effective strict value for this object
 */
function validateObject (value, node, path, strict) {
  const errors = []
  const { fields } = node

  for (const [key, fieldNode] of Object.entries(fields)) {
    const fieldPath  = joinPath(path, key)
    const fieldValue = value[key]

    if (fieldValue === undefined) {
      if (fieldNode.required)
        errors.push(makeError(fieldPath, 'prop_required', `Missing required property \`${fieldPath}\``))
      continue
    }

    errors.push(...validateNode(fieldValue, fieldNode, fieldPath, strict))
  }

  if (strict) {
    for (const key of Object.keys(value)) {
      if (!(key in fields))
        errors.push(makeError(joinPath(path, key), 'prop_unexpected', `Unexpected property \`${joinPath(path, key)}\``))
    }
  }

  return errors
}
