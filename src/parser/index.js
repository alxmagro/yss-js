/**
 * Converts a raw parsed YAML object into a normalized YSS AST.
 *
 * Every node in the AST has an explicit `type`. The types are:
 *   string, integer, number, boolean, null, any
 *   object, array
 *   any_of  - union node, has `items` and shared `fields`
 *
 * Key behaviors:
 *   - $any_of on a node promotes it to type: 'any_of', spreading shared fields into each item
 *   - any / $type: any becomes type: 'any'
 *   - strict is resolved in the parser via cascade — no runtime inheritance needed
 *   - Fields are optional by default; $required: [...] marks required fields
 */

import { parseValue } from './inline.js'
import { registerPatterns, checkFormat } from '../aliases.js'
import { loadImports, resolveRefs } from './imports.js'

const RESERVED_ROOT = new Set(['$anchors', '$patterns', '$imports'])
const VALID_LEAF_TYPES = new Set(['any', 'null', 'boolean', 'integer', 'number', 'string', 'array', 'object'])
const VALID_NODE_TYPES = new Set([...VALID_LEAF_TYPES, 'any_of', 'one_of', 'all_of'])

/**
 * Build a schema node from a raw YAML value.
 * @param {*}       raw             - raw value from js-yaml
 * @param {boolean} inheritedStrict - strict value cascaded from parent
 */
export function buildNode (raw, inheritedStrict = false) {
  if (raw === null || raw === 'null') {
    return { type: 'null', required: false }
  }

  if (typeof raw === 'string') {
    return parseValue(raw)
  }

  if (Array.isArray(raw)) {
    throw new Error('Array field definitions are not supported. Use "$type: [a, b]" for union types or "$any_of" for composite validation.')
  }

  if (typeof raw === 'object') {
    return buildObjectNode(raw, inheritedStrict)
  }

  throw new Error(`Unexpected schema value: ${JSON.stringify(raw)}`)
}

/**
 * Build a node from an object — rune block or object schema.
 */
function buildObjectNode (raw, inheritedStrict) {
  const keys = Object.keys(raw)
  const hasRunes = keys.some(k => k.startsWith('$'))
  const hasFields = keys.some(k => !k.startsWith('$'))

  // $ref — resolved later by resolveRefs
  if (raw.$ref !== undefined) {
    return { $ref: raw.$ref, required: false }
  }

  // Resolve effective strict for this node
  const strict = raw.$strict !== undefined ? raw.$strict : inheritedStrict

  // ── Build base node ────────────────────────────────────────────────────────
  const node = { type: 'any', required: false, strict }

  if (hasRunes) {
    if (raw.$type !== undefined) {
      if (Array.isArray(raw.$type)) {
        node.type = raw.$type.map(String)
      } else {
        node.type = String(raw.$type)
      }
    }

    if (raw.$const !== undefined) {
      node.const = raw.$const
      // Infer type from const value when $type is not declared
      if (raw.$type === undefined) {
        const v = raw.$const
        if (typeof v === 'string') node.type = 'string'
        else if (Number.isInteger(v)) node.type = 'integer'
        else if (typeof v === 'number') node.type = 'number'
        else if (typeof v === 'boolean') node.type = 'boolean'
      }
    }
    if (raw.$size !== undefined) node.size = raw.$size
    if (raw.$unique !== undefined) node.unique = raw.$unique
    if (raw.$gt !== undefined) node.gt = raw.$gt
    if (raw.$gte !== undefined) node.gte = raw.$gte
    if (raw.$lt !== undefined) node.lt = raw.$lt
    if (raw.$lte !== undefined) node.lte = raw.$lte
    if (raw.$format !== undefined) node.format = raw.$format
    if (raw.$in !== undefined) node.in = raw.$in
    if (raw.$not_in !== undefined) node.not_in = raw.$not_in
    if (raw.$multiple_of !== undefined) node.multiple_of = raw.$multiple_of

    if (raw.$dependencies !== undefined) node.dependencies = raw.$dependencies

    if (raw.$item !== undefined) {
      node.item = buildNode(raw.$item, strict)
    }

    if (raw.$at !== undefined) {
      node.at = {}
      for (const [pos, val] of Object.entries(raw.$at)) {
        node.at[Number(pos)] = buildNode(val, strict)
      }
    }

    if (raw.$contains !== undefined) {
      const c = raw.$contains
      if (typeof c === 'object' && c !== null && !Array.isArray(c) && c.$item !== undefined) {
        node.contains = { item: buildNode(c.$item, strict), quantity: c.$quantity ?? [1, null] }
      } else {
        node.contains = { item: buildNode(c, strict), quantity: [1, null] }
      }
    }

    const SCALAR_RUNE_KEYS = ['const', 'size', 'unique', 'gt', 'gte', 'lt', 'lte', 'format', 'in', 'not_in', 'multiple_of']
    const rules = SCALAR_RUNE_KEYS.filter(k => k in node)
    if (rules.length) node.rules = rules
  }

  // ── Build fields ───────────────────────────────────────────────────────────
  if (hasFields) {
    const required = new Set(Array.isArray(raw.$required) ? raw.$required : [])
    const fields = {}

    for (const [key, val] of Object.entries(raw)) {
      if (key.startsWith('$')) continue
      const fieldNode = buildNode(val, strict)
      if (required.has(key)) fieldNode.required = true
      fields[key] = fieldNode
    }

    node.fields = fields
  }

  // ── Promote to AnyOf ───────────────────────────────────────────────────────
  if (raw.$any_of !== undefined) {
    const sharedFields = node.fields ?? {}

    const items = raw.$any_of.map(branch => {
      const branchNode = buildNode(branch, strict)

      if (Object.keys(sharedFields).length > 0) {
        branchNode.fields = { ...sharedFields, ...(branchNode.fields ?? {}) }
      }

      return branchNode
    })

    return {
      type: 'any_of',
      required: node.required,
      strict,
      items
    }
  }

  // ── Promote to AllOf ───────────────────────────────────────────────────────
  if (raw.$all_of !== undefined) {
    const baseType = node.type !== 'any' ? node.type : undefined
    const items = raw.$all_of.map(branch => buildNode(branch, strict))

    return {
      type: 'all_of',
      baseType,
      required: node.required,
      strict,
      items
    }
  }

  // ── Promote to OneOf ───────────────────────────────────────────────────────
  if (raw.$one_of !== undefined) {
    const sharedFields = node.fields ?? {}

    const items = raw.$one_of.map(branch => {
      const branchNode = buildNode(branch, strict)

      if (Object.keys(sharedFields).length > 0) {
        branchNode.fields = { ...sharedFields, ...(branchNode.fields ?? {}) }
      }

      return branchNode
    })

    return {
      type: 'one_of',
      required: node.required,
      strict,
      items
    }
  }

  return node
}

/**
 * Walk every node in a schema tree, calling fn(node) on each.
 */
export function walkAST (node, fn) {
  if (!node || typeof node !== 'object') return
  fn(node)
  if (node.fields) Object.values(node.fields).forEach(n => walkAST(n, fn))
  if (node.item) walkAST(node.item, fn)
  if (node.at) Object.values(node.at).forEach(n => walkAST(n, fn))
  if (node.items) node.items.forEach(n => walkAST(n, fn))
  if (node.contains?.item) walkAST(node.contains.item, fn)
}

/**
 * Assert schema tree integrity, throwing on invalid $type or $format values.
 */
export function assertIntegrity (tree) {
  walkAST(tree, node => {
    if (node.format) checkFormat(node.format)

    const rawTypes = Array.isArray(node.type) ? node.type : [node.type]
    for (const t of rawTypes) {
      if (t && !VALID_NODE_TYPES.has(t)) throw new Error(`Unknown $type: "${t}"`)
    }

    if (node.baseType !== undefined && !VALID_LEAF_TYPES.has(node.baseType)) {
      throw new Error(`Unknown $type: "${node.baseType}"`)
    }
  })
}

/**
 * Build the full schema tree from a raw YAML root object.
 */
export function buildAST (raw, baseDir = process.cwd()) {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('YSS schema root must be an object')
  }

  if (raw.$patterns && typeof raw.$patterns === 'object') {
    registerPatterns(raw.$patterns)
  }

  const stripped = Object.fromEntries(
    Object.entries(raw).filter(([k]) => !RESERVED_ROOT.has(k))
  )

  let tree = buildObjectNode(stripped, false)

  if (raw.$imports && typeof raw.$imports === 'object') {
    const importedTrees = loadImports(raw.$imports, baseDir, buildAST)
    tree = resolveRefs(tree, importedTrees)
  }

  return tree
}
