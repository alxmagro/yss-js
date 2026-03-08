/**
 * $gte - value must be greater than or equal to param (inclusive minimum).
 */
export default function gte (value, param) {
  if (value < param)
    return { code: 'gte_invalid', message: `expected value >= ${param}, got ${value}` }
  return null
}
