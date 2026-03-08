export default {
  name: 'String',
  rules: ['min', 'max', 'match', 'enum', 'required'],
  validate(value) {
    if (typeof value !== 'string')
      return `expected String, got ${typeof value}`
    return null
  }
}
