import testType from '../scalars/type.js'

export default function allOf (value, node, path, validateNode) {
  if (node.baseType != null) {
    const typeError = testType(value, node.baseType, path)
    if (typeError) return [{ path, ...typeError }]
  }

  for (let i = 0; i < node.items.length; i++) {
    if (validateNode(value, node.items[i], path).length > 0)
      return [{ path, code: 'all_of', message: 'Value does not match all conditions', data: { failed_at: i } }]
  }

  return []
}
