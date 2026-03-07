/**
 * YSS core validator.
 * Uses the type and rule registries - each type and rule is an isolated module.
 */

import { getType }                from '../types/index.js'
import { scalarRules, arrayRules } from '../rules/index.js'
import { makeError, joinPath }    from './errors.js'

/**
 * Validate a value against a schema node.
 * @param {*}      value  - the value being validated
 * @param {object} node   - normalized schema node from the parser
 * @param {string} path   - current dot-path for error messages
 * @returns {Array}       - array of { path, code, message } error objects
 */
export function validateNode(value, node, path = '') {
  const errors = []

  // ── AnyOf ──────────────────────────────────────────────────────────────────
  if (node.anyOf) {
    const branches = [...node.anyOf].sort((a, b) =>
      a.type === 'null' ? -1 : b.type === 'null' ? 1 : 0
    )

    const matchingBranch = branches.find(branch => validateNode(value, branch, path).length === 0)

    if (!matchingBranch) {
      const names = branches.map(b => b.type).join(' | ')
      errors.push(makeError(path, 'anyof_invalid', `expected ${names}, got ${typeof value}`))
      return errors
    }

    if (matchingBranch.type === 'Object') {
      const fieldsNode = matchingBranch.fields ? matchingBranch : node
      if (fieldsNode.fields) {
        errors.push(...validateObject(value, fieldsNode, path))
      }
    }

    return errors
  }

  // ── Type check ─────────────────────────────────────────────────────────────
  const typeDef = getType(node.type)

  if (!typeDef) {
    errors.push(makeError(path, 'type_mismatch', `unknown type: ${node.type}`))
    return errors
  }

  const typeError = typeDef.validate(value)
  if (typeError) {
    errors.push(makeError(path, 'type_mismatch', typeError))
    return errors
  }

  if (node.type === 'null') return errors

  // ── Scalar rules ───────────────────────────────────────────────────────────
  for (const [ruleName, ruleFn] of Object.entries(scalarRules)) {
    const param = node[ruleName] ?? node[`$${ruleName}`]
    if (param === null || param === undefined) continue
    if (!typeDef.rules.includes(ruleName)) continue

    const result = ruleFn(value, param, path)
    if (result) errors.push(makeError(path, result.code, result.message))
  }

  // ── Array rules ────────────────────────────────────────────────────────────
  for (const [ruleName, ruleFn] of Object.entries(arrayRules)) {
    const param = node[ruleName] ?? node[`$${ruleName}`]
    if (param === null || param === undefined) continue
    if (!typeDef.rules.includes(ruleName)) continue

    errors.push(...ruleFn(value, param, path, node.type))
  }

  // ── Set uniqueness ─────────────────────────────────────────────────────────
  if (node.type === 'Set') {
    const seen = new Set()
    for (let i = 0; i < value.length; i++) {
      const key = JSON.stringify(value[i])
      if (seen.has(key))
        errors.push(makeError(joinPath(path, i), 'set_duplicated', `duplicate value in Set`))
      seen.add(key)
    }
  }

  // ── Object fields ──────────────────────────────────────────────────────────
  if (node.type === 'Object' && node.fields) {
    errors.push(...validateObject(value, node, path))
  }

  return errors
}

/**
 * Validate an Object's declared fields, and enforce strict mode.
 */
function validateObject(value, node, path) {
  const errors = []
  const { fields, open } = node

  for (const [key, fieldNode] of Object.entries(fields)) {
    const fieldPath  = joinPath(path, key)
    const fieldValue = value[key]

    if (fieldValue === undefined) {
      if (!fieldNode.optional)
        errors.push(makeError(fieldPath, 'prop_required', `required field missing`))
      continue
    }

    errors.push(...validateNode(fieldValue, fieldNode, fieldPath))
  }

  if (!open) {
    for (const key of Object.keys(value)) {
      if (!(key in fields))
        errors.push(makeError(joinPath(path, key), 'prop_unexpected', `unexpected field`))
    }
  }

  return errors
}