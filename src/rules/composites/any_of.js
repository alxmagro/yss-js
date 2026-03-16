export default function anyOf (value, node, path, validateNode, emit) {
  const matched = node.items.some(branch => {
    let failed = false
    validateNode(value, branch, path, () => { failed = true })
    return !failed
  })

  if (!matched) emit({ path, code: 'any_of', message: 'Value does not match any condition' })
}
