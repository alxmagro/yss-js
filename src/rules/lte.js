/**
 * $lte - value must be less than or equal to param (inclusive maximum).
 */
export default function lte (value, param) {
  if (typeof value !== 'number') return null
  if (value > param)
    return {
      code:    'lte_invalid',
      message: `Value must be less than or equal to \`${param}\``,
      data:    { value, lte: param },
    }
  return null
}
