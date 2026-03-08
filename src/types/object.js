export default {
  name: 'Object',
  rules: ['required'],
  validate(value) {
    if (typeof value !== 'object' || value === null || Array.isArray(value))
      return `expected Object, got ${Array.isArray(value) ? 'array' : typeof value}`
    return null
  }
}
