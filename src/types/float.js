export default {
  name: 'Float',
  rules: ['min', 'max', 'enum', 'optional'],
  validate(value) {
    if (typeof value !== 'number' || isNaN(value))
      return `expected Float, got ${typeof value}`
    return null
  }
}