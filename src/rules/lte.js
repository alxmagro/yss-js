/**
 * $lte - value must be less than or equal to param (inclusive maximum).
 */
export default function lte (value, param) {
  if (value > param)
    return { code: 'lte_invalid', message: `expected value <= ${param}, got ${value}` }
  return null
}
