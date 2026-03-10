export default {
  name: 'Float',
  rules: ['gt', 'gte', 'lt', 'lte', 'enum', 'const', 'required'],

  validate (value) {
    if (typeof value !== 'number' || isNaN(value))
      return `expected Float, got ${typeof value}`
    return null
  }
}
