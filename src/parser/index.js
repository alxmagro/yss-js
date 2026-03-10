/**
 * Converts a raw parsed YAML object into a normalized YSS schema tree.
 *
 * Each node in the tree is one of:
 *   { type, min, max, enum, optional, format, item, at, anyOf, fields, strict }
 *
 * strict values:
 *   null  - not declared, inherits from parent (default: open)
 *   true  - strict, cascades to children unless overridden
 *   false - open, cascades to children unless overridden
 *
 * optional:
 *   Fields are optional by default.
 *   $required: [field1, field2] on an object declares which fields are required.
 */

import { parseValue, parseInline }  from './inline.js'
import { registerPatterns }         from '../aliases.js'
import { loadImports, resolveRefs } from './imports.js'

const RESERVED_ROOT = new Set(['$anchors', '$patterns', '$imports'])

/**
 * Build a schema node from a raw YAML node.
 * @param {*} raw - raw value from js-yaml parse
 * @returns {object} normalized schema node
 */
export function buildNode (raw) {
  if (raw === null || raw === 'null') {
    return { type: 'null' }
  }

  if (typeof raw === 'string') {
    return parseValue(raw)
  }

  if (Array.isArray(raw)) {
    return parseValue(raw)
  }

  if (typeof raw === 'object') {
    return buildObjectNode(raw)
  }

  throw new Error(`Unexpected schema value: ${JSON.stringify(raw)}`)
}

/**
 * Build a node from an object - either a rune block or an object schema.
 */
function buildObjectNode (raw) {
  const keys = Object.keys(raw)

  const hasRunes  = keys.some(k => k.startsWith('$'))
  const hasFields = keys.some(k => !k.startsWith('$'))

  // $ref - reference to an imported schema, resolved later by resolveRefs
  if (raw.$ref !== undefined) {
    return { $ref: raw.$ref, required: false }
  }

  const node = {
    const:    null,
    type:     null,
    required: false,
    strict:   null,
    min:      null,
    max:      null,
    gt:       null,
    gte:      null,
    lt:       null,
    lte:      null,
    format:    null,
    enum:     null,
    item:     null,
    at:       null,
    anyOf:    null,
    fields:   null,
  }

  if (hasRunes) {
    if (raw.$type !== undefined) {
      if (Array.isArray(raw.$type)) {
        node.type = raw.$type.map(t => t === null ? 'null' : String(t))
      } else {
        node.type = String(raw.$type)
      }
    }

    if (raw.$const   !== undefined) node.const  = raw.$const
    if (raw.$strict !== undefined) node.strict = raw.$strict
    if (raw.$min    !== undefined) node.min    = raw.$min
    if (raw.$max    !== undefined) node.max    = raw.$max
    if (raw.$gt     !== undefined) node.gt     = raw.$gt
    if (raw.$gte    !== undefined) node.gte    = raw.$gte
    if (raw.$lt     !== undefined) node.lt     = raw.$lt
    if (raw.$lte    !== undefined) node.lte    = raw.$lte
    if (raw.$format  !== undefined) node.format = raw.$format
    if (raw.$enum   !== undefined) node.enum   = raw.$enum


    if (raw.$item !== undefined) {
      node.item = buildNode(raw.$item)
    }

    if (raw.$at !== undefined) {
      node.at = {}
      for (const [pos, val] of Object.entries(raw.$at)) {
        node.at[Number(pos)] = buildNode(val)
      }
    }

    if (raw.$any_of !== undefined) {
      node.anyOf = raw.$any_of.map(branch => buildNode(branch))
    }
  }

  if (hasFields) {
    if (!node.type) node.type = 'Object'
    node.fields = {}

    // $required declares which fields are required — all others are optional
    const required = new Set(
      Array.isArray(raw.$required) ? raw.$required : []
    )

    for (const [key, val] of Object.entries(raw)) {
      if (key.startsWith('$')) continue
      const fieldNode = buildNode(val)
      // Mark as required if listed in $required
      if (required.has(key)) fieldNode.required = true
      node.fields[key] = fieldNode
    }
  }

  return node
}

/**
 * Build the full schema tree from a raw YAML root object.
 * The root is always treated as an Object schema.
 *
 * @param {object} raw     - raw YAML object
 * @param {string} baseDir - directory of the file being parsed (for resolving imports)
 */
export function buildTree (raw, baseDir = process.cwd()) {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('YSS schema root must be an object')
  }

  if (raw.$patterns && typeof raw.$patterns === 'object') {
    registerPatterns(raw.$patterns)
  }

  const stripped = Object.fromEntries(
    Object.entries(raw).filter(([k]) => !RESERVED_ROOT.has(k))
  )

  let tree = buildObjectNode(stripped)

  if (raw.$imports && typeof raw.$imports === 'object') {
    const importedTrees = loadImports(raw.$imports, baseDir, buildTree)
    tree = resolveRefs(tree, importedTrees)
  }

  return tree
}
