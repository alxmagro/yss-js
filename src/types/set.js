export default {
  name: 'Set',
  rules: ['min', 'max', 'item', 'optional'],
  validate(value) {
    if (!Array.isArray(value))
      return `expected Set, got ${typeof value}`
    return null
  }
}
