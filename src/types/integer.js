export default {
  name: 'Integer',
  rules: ['min', 'max', 'enum', 'optional'],
  validate(value) {
    if (!Number.isInteger(value))
      return `expected Integer, got ${typeof value}`
    return null
  }
}