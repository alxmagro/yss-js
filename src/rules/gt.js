/**
 * $gt - value must be strictly greater than param (exclusive minimum).
 */
export default function gt (value, param) {
  if (value <= param)
    return { code: 'gt_invalid', message: `expected value > ${param}, got ${value}` }
  return null
}
