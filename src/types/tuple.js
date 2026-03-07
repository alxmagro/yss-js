export default {
  name: 'Tuple',
  rules: ['at', 'optional'],
  validate(value) {
    if (!Array.isArray(value))
      return `expected Tuple, got ${typeof value}`
    return null
  }
}
