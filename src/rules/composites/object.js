import { joinPath } from '../../validator/errors.js'
import { getRule } from '../scalars/index.js'

export default function object (value, node, path, validateNode, emit) {
  for (const key of (node.rules ?? [])) {
    const result = getRule(key)(value, node[key], path)
    if (result) emit({ path, ...result })
  }

  if (!node.fields) return

  const { fields, strict } = node

  for (const [key, fieldNode] of Object.entries(fields)) {
    const fieldPath = joinPath(path, key)
    const fieldValue = value[key]

    if (fieldValue === undefined) {
      if (fieldNode.required) emit({ path: fieldPath, code: 'required', message: `Missing required property \`${fieldPath}\`` })
      continue
    }
    validateNode(fieldValue, fieldNode, fieldPath, emit)
  }

  if (node.dependencies != null) {
    for (const [trigger, deps] of Object.entries(node.dependencies)) {
      if (value[trigger] === undefined) continue
      const missing = deps.filter(dep => value[dep] === undefined)
      if (missing.length > 0) emit({ path, code: 'dependencies', message: 'Value does not match all conditions', data: { trigger, missing } })
    }
  }

  if (strict) {
    for (const key of Object.keys(value)) {
      if (!(key in fields)) {
        const p = joinPath(path, key)
        emit({ path: p, code: 'strict', message: `Unexpected property \`${p}\`` })
      }
    }
  }
}
