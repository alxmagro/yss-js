export default {
  name: 'Boolean',
  rules: ['const', 'required'],
  validate(value) {
    if (typeof value !== 'boolean')
      return `expected Boolean, got ${typeof value}`
    return null
  }
}
