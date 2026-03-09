/**
 * $lt - value must be strictly less than param (exclusive maximum).
 */
export default function lt (value, param) {
  if (typeof value !== 'number') return null
  if (value >= param)
    return {
      code:    'lt_invalid',
      message: `Value must be less than \`${param}\``,
      data:    { value, lt: param },
    }
  return null
}
