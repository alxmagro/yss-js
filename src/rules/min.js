/**
 * $min - minimum character length (String) or item count (List, Set).
 */
export default function min (value, param) {
  const size = typeof value === 'string' ? value.length : value.length

  if ((typeof value === 'string' || Array.isArray(value)) && size < param)
    return {
      code:    'min_invalid',
      message: `Minimum size is \`${param}\``,
      data:    { min: param, value, size },
    }

  return null
}
