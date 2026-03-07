import { validateNode } from '../validator/index.js'
import { makeError, joinPath } from '../validator/errors.js'

/**
 * $at - validates specific positions of a Tuple or List.
 *
 * - Tuple: length must exactly match the number of positions defined.
 * - List:  only declared positions are validated, extra items are ignored.
 *
 * @param {Array}  value  - the array being validated
 * @param {object} param  - map of position -> schema node
 * @param {string} path   - current dot-path
 * @param {string} type   - 'Tuple' or 'List'
 */
export default function at(value, param, path, type = 'Tuple') {
  const errors = []
  const declaredLength = Object.keys(param).length

  // Tuple - size must match exactly
  if (type === 'Tuple' && value.length !== declaredLength) {
    return [makeError(path, 'tuple_length_invalid', `expected Tuple of length ${declaredLength}, got ${value.length}`)]
  }

  // Validate each declared position
  for (const [pos, posNode] of Object.entries(param)) {
    const index = Number(pos)
    if (index >= value.length) {
      errors.push(makeError(joinPath(path, index), 'list_position_missing', `position ${index} is required but list has only ${value.length} items`))
      continue
    }
    errors.push(...validateNode(value[index], posNode, joinPath(path, index)))
  }

  return errors
}