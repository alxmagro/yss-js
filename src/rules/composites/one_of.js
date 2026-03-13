export default function oneOf (value, node, path, validateNode) {
  let matchCount = 0

  for (const branch of node.items) {
    if (validateNode(value, branch, path).length === 0) {
      matchCount++
      if (matchCount > 1) break
    }
  }

  if (matchCount === 0)
    return [{ path, code: 'oneof_invalid',   message: 'Value does not match any condition' }]

  if (matchCount > 1)
    return [{ path, code: 'oneof_multiple',  message: 'Value matches more than one condition' }]

  return []
}
