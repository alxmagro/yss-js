export default function anyOf (value, node, path, validateNode) {
  const branchErrors = node.items.map(branch => validateNode(value, branch, path))
  const matched      = branchErrors.findIndex(e => e.length === 0)

  if (matched === -1)
    return [{
      path,
      code:    'anyof_invalid',
      message: 'Value does not match any condition',
    }]

  return []
}
