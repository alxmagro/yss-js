/**
 * $max - maximum character length (String) or item count (List, Set).
 */
export default function max (value, param) {
  const size = value.length

  if ((typeof value === 'string' || Array.isArray(value)) && size > param)
    return {
      code:    'max_invalid',
      message: `Maximum size is \`${param}\``,
      data:    { value, size, max: param },
    }

  return null
}
