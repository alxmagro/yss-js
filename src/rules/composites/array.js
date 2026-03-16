import { joinPath } from '../../validator/errors.js'
import { getRule } from '../scalars/index.js'

export default function array (value, node, path, validateNode, emit) {
  for (const key of (node.rules ?? [])) {
    const result = getRule(key)(value, node[key], path)
    if (result) emit({ path, ...result })
  }

  if (node.item != null) {
    for (let i = 0; i < value.length; i++) {
      validateNode(value[i], node.item, joinPath(path, i), emit)
    }
  }

  if (node.at != null) {
    for (const [pos, posNode] of Object.entries(node.at)) {
      const index = Number(pos)
      if (index >= value.length) continue
      validateNode(value[index], posNode, joinPath(path, index), emit)
    }
  }

  if (node.contains != null) {
    const { item, quantity } = node.contains
    const isExact = typeof quantity === 'number'
    const min = isExact ? null : quantity[0]
    const max = isExact ? null : quantity[1]
    let count = 0
    for (let i = 0; i < value.length; i++) {
      let failed = false
      validateNode(value[i], item, joinPath(path, i), () => { failed = true })
      if (!failed) {
        count++
        if (isExact ? count > quantity : (max != null ? count > max : (min != null && count >= min))) break
      }
    }

    if (isExact) {
      if (count !== quantity) {
        const message = quantity === 0
          ? 'Array must not contain any matching items'
          : `Array must contain exactly \`${quantity}\` matching items`
        emit({ path, code: 'contains_exact', message, data: { quantity } })
      }
    } else if (max != null && count > max) {
      emit({ path, code: 'contains_max', message: `Array must contain at most \`${max}\` matching items`, data: { quantity } })
    } else if (min != null && count < min) {
      const message = min === 1 ? 'Array must contain at least one matching item' : `Array must contain at least \`${min}\` matching items`
      emit({ path, code: 'contains_min', message, data: { quantity } })
    }
  }
}
