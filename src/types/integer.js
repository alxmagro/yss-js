export default {
  name: 'Integer',
  rules: ['gt', 'gte', 'lt', 'lte', 'enum', 'const', 'required'],

  validate (value) {
    if (!Number.isInteger(value))
      return `expected Integer, got ${typeof value}`
    return null
  }
}
