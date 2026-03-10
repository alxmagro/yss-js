export default {
  name: 'String',
  rules: ['min', 'max', 'format', 'enum', 'const', 'required'],
  validate(value) {
    if (typeof value !== 'string')
      return `expected String, got ${typeof value}`
    return null
  }
}
