/**
 * Converts a raw parsed YAML object into a normalized YSS AST.
 *
 * Every node in the AST has an explicit `type`. The types are:
 *   String, Integer, Float, Boolean, null, Any
 *   Object, List, Set, Tuple
 *   AnyOf  - union node, has `items` and shared `fields`
 *
 * Key behaviors:
 *   - $any_of on a node promotes it to type: 'AnyOf', spreading shared fields into each item
 *   - any / $type: any becomes type: 'Any'
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
    const node = parseValue(raw)
    if (node.type === 'any') node.type = 'Any'
    return node
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
  const node = { type: null, required: false, strict }

  if (hasRunes) {
    if (raw.$type !== undefined) {
      if (Array.isArray(raw.$type)) {
        node.type = raw.$type.map(t => t === null ? 'null' : String(t))
      } else {
        const t = String(raw.$type)
        node.type = t === 'any' ? 'Any' : t
      }
    }

    if (raw.$const  !== undefined) node.const  = raw.$const
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
  }

  // ── Build fields ───────────────────────────────────────────────────────────
  if (hasFields) {
    if (!node.type) node.type = 'Object'

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
        if (!branchNode.type) branchNode.type = 'Object'
      }

      return branchNode
    })

    return {
      type:     'AnyOf',
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
