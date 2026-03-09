/**
 * $gt - value must be strictly greater than param (exclusive minimum).
 */
export default function gt (value, param) {
  if (typeof value !== 'number') return null
  if (value <= param)
    return {
      code:    'gt_invalid',
      message: `Value must be greater than \`${param}\``,
      data:    { value, gt: param },
    }
  return null
}
