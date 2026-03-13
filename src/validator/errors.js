/**
 * Error formatting for YSS validation.
 *
 * Each error is a plain object:
 *   { path: string, code: string, message: string }
 *
 * path uses dot notation for objects and bracket notation for arrays:
 *   "customer.email"
 *   "items[2].price"
 *
 * codes:
 *   type_mismatch         - value is the wrong type
 *   prop_required         - required property is missing
 *   prop_unexpected       - property not declared in strict object
 *   min_invalid           - value/length/count is below minimum
 *   max_invalid           - value/length/count is above maximum
 *   enum_invalid          - value is not in the allowed list
 *   format_invalid        - value does not match a format alias
 *   anyof_invalid         - value does not match any branch of AnyOf
 *   list_position_missing - declared List position is out of bounds
 */

export function makeError (path, code, message, data) {
  const err = { path, code, message }
  if (data !== undefined) err.data = data
  return err
}

export function joinPath (parent, key) {
  if (typeof key === 'number') return parent ? `${parent}[${key}]` : `[${key}]`
  if (!parent) return String(key)
  return `${parent}.${key}`
}
