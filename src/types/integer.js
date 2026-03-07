export default {
  name: 'Integer',
  rules: ['min', 'max', 'values', 'optional'],
  validate(value) {
    if (!Number.isInteger(value))
      return `expected Integer, got ${typeof value}`
    return null
  }
}
