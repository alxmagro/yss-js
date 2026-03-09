import { validateNode } from '../validator/index.js'
import { makeError, joinPath } from '../validator/errors.js'

/**
 * $at - validates specific positions of a Tuple or List.
 *
 * - Tuple: length must exactly match the number of positions defined.
 * - List:  declared positions must exist and be valid.
 *
 * @param {Array}  value  - the array being validated
 * @param {object} param  - map of position -> schema node
 * @param {string} path   - current dot-path
 * @param {string} type   - 'Tuple' or 'List'
 */
export default function at (value, param, path, type = 'Tuple') {
  const errors = []
  const declaredLength = Object.keys(param).length

  // Tuple - size must match exactly
  if (type === 'Tuple' && value.length !== declaredLength) {
    return [makeError(path, 'tuple_length_invalid', `Expected tuple of length \`${declaredLength}\`, got \`${value.length}\``, {
      value,
      size: value.length,
      expected: declaredLength,
    })]
  }

  // Validate each declared position
  for (const [pos, posNode] of Object.entries(param)) {
    const index = Number(pos)
    if (index >= value.length) {
      errors.push(makeError(joinPath(path, index), 'list_position_missing', `Position \`${index}\` is required but list has \`${value.length}\` items`, {
        value,
        size: value.length,
      }))
      continue
    }
    errors.push(...validateNode(value[index], posNode, joinPath(path, index)))
  }

  return errors
}
