/**
 * $gte - value must be greater than or equal to param (inclusive minimum).
 */
export default function gte (value, param) {
  if (typeof value !== 'number') return null
  if (value < param)
    return {
      code:    'gte_invalid',
      message: `Value must be greater than or equal to \`${param}\``,
      data:    { value, gte: param },
    }
  return null
}
