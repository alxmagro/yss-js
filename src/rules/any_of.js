import { validateNode } from '../validator/index.js'

/**
 * $any_of - value must match at least one branch.
 *
 * @param {*}      value   - the value being validated
 * @param {Array}  param   - array of schema nodes (branches)
 * @param {string} path    - current dot-path
 * @param {boolean} strict - inherited strict value
 * @returns {Array}        - array of errors (empty if any branch matches)
 */
export default function anyOf (value, param, path, strict) {
  const branchErrors = param.map(branch => validateNode(value, branch, path, strict))
  const matchIndex   = branchErrors.findIndex(e => e.length === 0)

  if (matchIndex === -1) {
    return [{
      path,
      code:    'anyof_invalid',
      message: 'Value does not match any condition',
      data: {
        value,
        or: branchErrors,
      },
    }]
  }

  return []
}
