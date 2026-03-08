/**
 * $max - maximum character length (String) or item count (List, Set).
 */
export default function max (value, param) {
  if (typeof value === 'string' && value.length > param)
    return { code: 'max_invalid', message: `expected String length <= ${param}, got ${value.length}` }

  if (Array.isArray(value) && value.length > param)
    return { code: 'max_invalid', message: `expected at most ${param} items, got ${value.length}` }

  return null
}
