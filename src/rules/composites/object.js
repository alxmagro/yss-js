import { joinPath } from '../../validator/errors.js'
import { getRule } from '../scalars/index.js'

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
    const fieldPath = joinPath(path, key)
    const fieldValue = value[key]

    if (fieldValue === undefined) {
      if (fieldNode.required) { errors.push({ path: fieldPath, code: 'required', message: `Missing required property \`${fieldPath}\`` }) }
      continue
    }
    errors.push(...validateNode(fieldValue, fieldNode, fieldPath))
  }

  if (node.dependencies != null) {
    for (const [trigger, deps] of Object.entries(node.dependencies)) {
      if (value[trigger] === undefined) continue
      const missing = deps.filter(dep => value[dep] === undefined)
      if (missing.length > 0) { errors.push({ path, code: 'dependencies', message: 'Value does not match all conditions', data: { trigger, missing } }) }
    }
  }

  if (strict) {
    for (const key of Object.keys(value)) {
      if (!(key in fields)) {
        const p = joinPath(path, key)
        errors.push({ path: p, code: 'strict', message: `Unexpected property \`${p}\`` })
      }
    }
  }

  return errors
}
