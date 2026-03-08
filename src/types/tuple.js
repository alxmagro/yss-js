export default {
  name: 'Tuple',
  rules: ['at', 'required'],
  validate(value) {
    if (!Array.isArray(value))
      return `expected Tuple, got ${typeof value}`
    return null
  }
}
