/**
 * $lt - value must be strictly less than param (exclusive maximum).
 */
export default function lt (value, param) {
  if (value >= param)
    return { code: 'lt_invalid', message: `expected value < ${param}, got ${value}` }
  return null
}
