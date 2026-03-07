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
 *   match_invalid         - value does not match regex or alias
 *   set_duplicated        - duplicate value in Set
 *   anyof_invalid         - value does not match any branch of AnyOf
 *   tuple_length_invalid  - array length does not match Tuple definition
 *   list_position_missing - declared List position is out of bounds
 */

export function makeError(path, code, message) {
  return { path, code, message }
}

export function joinPath(parent, key) {
  if (!parent) return String(key)
  if (typeof key === 'number') return `${parent}[${key}]`
  return `${parent}.${key}`
}