import { joinPath } from '../../validator/errors.js'
import { getRule }  from '../scalars/index.js'

export default function array (value, node, path, validateNode) {
  const errors = []

  for (const key of (node.rules ?? [])) {
    const rule = getRule(key)
    if (!rule) continue
    const result = rule(value, node[key], path)
    if (result) errors.push({ path, ...result })
  }

  if (node.item != null) {
    for (let i = 0; i < value.length; i++)
      errors.push(...validateNode(value[i], node.item, joinPath(path, i)))
  }

  if (node.at != null) {
    for (const [pos, posNode] of Object.entries(node.at)) {
      const index = Number(pos)
      if (index >= value.length) continue
      errors.push(...validateNode(value[index], posNode, joinPath(path, index)))
    }
  }

  return errors
}
