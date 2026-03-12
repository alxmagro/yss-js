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

import { parseValue }               from './inline.js'
import { registerPatterns }         from '../aliases.js'
import { loadImports, resolveRefs } from './imports.js'

const RESERVED_ROOT = new Set(['$anchors', '$patterns', '$imports'])

/**
 * Build a schema node from a raw YAML value.
 * @param {*}       raw             - raw value from js-yaml
 * @param {boolean} inheritedStrict - strict value cascaded from parent
 */
export function buildNode (raw, inheritedStrict = false) {
  if (raw === null || raw === 'null') {
    return { type: 'null', required: false }
  }

  if (typeof raw === 'string' || Array.isArray(raw)) {
    return parseValue(raw)
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
  const keys      = Object.keys(raw)
  const hasRunes  = keys.some(k => k.startsWith('$'))
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

    if (raw.$const  !== undefined) {
      node.const = raw.$const
      // Infer type from const value when $type is not declared
      if (raw.$type === undefined) {
        const v = raw.$const
        if (typeof v === 'string')       node.type = 'string'
        else if (Number.isInteger(v))    node.type = 'integer'
        else if (typeof v === 'number')  node.type = 'number'
        else if (typeof v === 'boolean') node.type = 'boolean'
      }
    }
    if (raw.$size   !== undefined) node.size   = raw.$size
    if (raw.$unique !== undefined) node.unique = raw.$unique
    if (raw.$min    !== undefined) node.min    = raw.$min
    if (raw.$max    !== undefined) node.max    = raw.$max
    if (raw.$gt     !== undefined) node.gt     = raw.$gt
    if (raw.$gte    !== undefined) node.gte    = raw.$gte
    if (raw.$lt     !== undefined) node.lt     = raw.$lt
    if (raw.$lte    !== undefined) node.lte    = raw.$lte
    if (raw.$format !== undefined) node.format = raw.$format
    if (raw.$enum   !== undefined) node.enum   = raw.$enum

    if (raw.$item !== undefined) {
      node.item = buildNode(raw.$item, strict)
    }

    if (raw.$at !== undefined) {
      node.at = {}
      for (const [pos, val] of Object.entries(raw.$at)) {
        node.at[Number(pos)] = buildNode(val, strict)
      }
    }

    const SCALAR_RUNE_KEYS = ['const', 'size', 'unique', 'min', 'max', 'gt', 'gte', 'lt', 'lte', 'format', 'enum']
    const rules = SCALAR_RUNE_KEYS.filter(k => k in node)
    if (rules.length) node.rules = rules
  }

  // ── Build fields ───────────────────────────────────────────────────────────
  if (hasFields) {
    if (!node.type) node.type = 'object'

    const required = new Set(Array.isArray(raw.$required) ? raw.$required : [])
    const fields   = {}

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
        const mergedFields = { ...sharedFields, ...(branchNode.fields ?? {}) }
        branchNode.fields  = mergedFields
        if (!branchNode.type) branchNode.type = 'object'
      }

      return branchNode
    })

    return {
      type:     'any_of',
      required: node.required,
      strict,
      items,
    }
  }

  return node
}

/**
 * Build the full schema tree from a raw YAML root object.
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

  let tree = buildObjectNode(stripped, false)

  if (raw.$imports && typeof raw.$imports === 'object') {
    const importedTrees = loadImports(raw.$imports, baseDir, buildTree)
    tree = resolveRefs(tree, importedTrees)
  }

  return tree
}
