export default {
  name: 'List',
  rules: ['min', 'max', 'item', 'at', 'required'],
  validate(value) {
    if (!Array.isArray(value))
      return `expected List, got ${typeof value}`
    return null
  }
}
