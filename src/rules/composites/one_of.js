export default function oneOf (value, node, path, validateNode, emit) {
  let matchCount = 0
  let firstMatch = -1
  let secondMatch = -1

  for (let i = 0; i < node.items.length; i++) {
    if (matchCount === 2) break
    let failed = false
    validateNode(value, node.items[i], path, () => { failed = true })
    if (!failed) {
      matchCount++
      if (matchCount === 1) firstMatch = i
      else secondMatch = i
    }
  }

  if (matchCount === 0) { emit({ path, code: 'one_of', message: 'Value does not match any condition' }); return }

  if (matchCount > 1) { emit({ path, code: 'one_of_multiple', message: 'Value matches more than one condition', data: { matches_at: [firstMatch, secondMatch] } }) }
}
