import testType from '../scalars/type.js'

export default function allOf (value, node, path, validateNode, emit) {
  if (node.baseType != null) {
    const typeError = testType(value, node.baseType, path)
    if (typeError) { emit({ path, ...typeError }); return }
  }

  for (let i = 0; i < node.items.length; i++) {
    let failed = false
    validateNode(value, node.items[i], path, () => { failed = true })
    if (failed) {
      emit({ path, code: 'all_of', message: 'Value does not match all conditions', data: { failed_at: i } })
      return
    }
  }
}
