export default {
  name: 'null',
  rules: [],
  validate(value) {
    if (value !== null)
      return `expected null, got ${typeof value}`
    return null
  }
}
