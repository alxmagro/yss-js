import { joinPath } from '../../validator/errors.js'
import { getRule }  from '../scalars/index.js'

export default function object (value, node, path, validateNode) {
  const errors = []

  for (const key of (node.rules ?? [])) {
    const rule = getRule(key)
    if (!rule) continue
    const result = rule(value, node[key], path)
    if (result) errors.push({ path, ...result })
  }

  if (!node.fields) return errors

  const { fields, strict } = node

  for (const [key, fieldNode] of Object.entries(fields)) {
    const fieldPath  = joinPath(path, key)
    const fieldValue = value[key]

    if (fieldValue === undefined) {
      if (fieldNode.required)
        errors.push({ path: fieldPath, code: 'prop_required', message: `Missing required property \`${fieldPath}\`` })
      continue
    }
    errors.push(...validateNode(fieldValue, fieldNode, fieldPath))
  }

  if (strict) {
    for (const key of Object.keys(value)) {
      if (!(key in fields)) {
        const p = joinPath(path, key)
        errors.push({ path: p, code: 'prop_unexpected', message: `Unexpected property \`${p}\`` })
      }
    }
  }

  return errors
}
