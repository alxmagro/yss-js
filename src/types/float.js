export default {
  name: 'Float',
  rules: ['min', 'max', 'values', 'optional'],
  validate(value) {
    if (typeof value !== 'number' || isNaN(value))
      return `expected Float, got ${typeof value}`
    return null
  }
}