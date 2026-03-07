export default {
  name: 'Boolean',
  rules: ['optional'],
  validate(value) {
    if (typeof value !== 'boolean')
      return `expected Boolean, got ${typeof value}`
    return null
  }
}
