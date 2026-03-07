/**
 * Converts a raw parsed YAML object into a normalized YSS schema tree.
 *
 * Each node in the tree is one of:
 *   { type, min, max, values, optional, match, item, at, anyOf, fields, open }
 */

import { parseValue, parseInline } from './inline.js'

const RUNES = new Set([
  '$type', '$optional', '$min', '$max', '$match',
  '$values', '$item', '$at',
])

/**
 * Build a schema node from a raw YAML node.
 * @param {*} raw - raw value from js-yaml parse
 * @returns {object} normalized schema node
 */
export function buildNode(raw) {
  // null type shorthand
  if (raw === null || raw === 'null') {
    return { type: 'null' }
  }

  // Inline scalar - "String{2,80}(foo|bar)? =~ email"
  if (typeof raw === 'string') {
    return parseValue(raw)
  }

  // AnyOf - YAML array at field level ["String", "Integer"]
  if (Array.isArray(raw)) {
    return parseValue(raw)
  }

  // Object - either expanded rune block or object type with fields
  if (typeof raw === 'object') {
    return buildObjectNode(raw)
  }

  throw new Error(`Unexpected schema value: ${JSON.stringify(raw)}`)
}

/**
 * Build a node from an object - either a rune block or an object schema.
 */
function buildObjectNode(raw) {
  const keys = Object.keys(raw)

  // AnyOf array - each item is a rune block
  // [ { $type: 'String', $match: 'email' }, { $type: 'null' } ]
  // (not a YAML array - this is handled by buildNode above)

  const hasRunes = keys.some(k => k.startsWith('$'))
  const hasFields = keys.some(k => !k.startsWith('$') && k !== '...')

  const node = {
    type:     null,
    optional: false,
    min:      null,
    max:      null,
    match:    null,
    values:   null,
    item:     null,
    at:       null,
    anyOf:    null,
    fields:   null,
    open:     false,
  }

  // Read runes
  if (hasRunes) {
    // $type can be inline "String{2,80}" or array AnyOf
    if (raw.$type !== undefined) {
      if (Array.isArray(raw.$type)) {
        node.anyOf = raw.$type.map(t =>
          t === null || t === 'null' ? { type: 'null' } : parseInline(String(t))
        )
      } else {
        const parsed = parseInline(String(raw.$type))
        Object.assign(node, parsed)
      }
    }

    if (raw.$optional !== undefined) node.optional = raw.$optional
    if (raw.$min      !== undefined) node.min      = raw.$min
    if (raw.$max      !== undefined) node.max      = raw.$max
    if (raw.$match    !== undefined) node.match    = raw.$match
    if (raw.$values   !== undefined) node.values   = raw.$values

    // $item - inline or object
    if (raw.$item !== undefined) {
      node.item = buildNode(raw.$item)
    }

    // $at - tuple positions
    if (raw.$at !== undefined) {
      node.at = {}
      for (const [pos, val] of Object.entries(raw.$at)) {
        node.at[Number(pos)] = buildNode(val)
      }
    }
  }

  // Object fields (non-rune keys)
  if (hasFields) {
    if (!node.type) node.type = 'Object'
    node.fields = {}
    for (const [key, val] of Object.entries(raw)) {
      if (key.startsWith('$')) continue
      if (key === '...') {
        node.open = val === true
        continue
      }
      node.fields[key] = buildNode(val)
    }
  }

  // Bare object with only '...: true' and no fields
  if (!hasRunes && !hasFields && raw['...'] !== undefined) {
    node.type = 'Object'
    node.open = raw['...'] === true
  }

  return node
}

/**
 * Build the full schema tree from a raw YAML root object.
 * The root is always treated as an Object schema.
 */
export function buildTree(raw) {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('YSS schema root must be an object')
  }
  return buildObjectNode(raw)
}
