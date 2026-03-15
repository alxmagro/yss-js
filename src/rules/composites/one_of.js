export default function oneOf (value, node, path, validateNode) {
  let matchCount = 0
  let firstMatch = -1
  let secondMatch = -1

  for (let i = 0; i < node.items.length; i++) {
    if (validateNode(value, node.items[i], path).length === 0) {
      matchCount++
      if (matchCount === 1) firstMatch = i
      else { secondMatch = i; break }
    }
  }

  if (matchCount === 0) { return [{ path, code: 'one_of', message: 'Value does not match any condition' }] }

  if (matchCount > 1) { return [{ path, code: 'one_of_multiple', message: 'Value matches more than one condition', data: { matches_at: [firstMatch, secondMatch] } }] }

  return []
}
