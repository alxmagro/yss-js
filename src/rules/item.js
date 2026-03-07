import { validateNode } from '../validator/index.js'
import { joinPath }     from '../validator/errors.js'

/**
 * $item - validates each item in a List or Set against a sub-schema node.
 * Returns an array of errors (may be empty).
 */
export default function item(value, param, path) {
  const errors = []
  for (let i = 0; i < value.length; i++) {
    errors.push(...validateNode(value[i], param, joinPath(path, i)))
  }
  return errors
}
