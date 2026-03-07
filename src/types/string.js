export default {
  name: 'String',
  rules: ['min', 'max', 'match', 'values', 'optional'],
  validate(value) {
    if (typeof value !== 'string')
      return `expected String, got ${typeof value}`
    return null
  }
}
