/**
 * $min - minimum character length (String) or item count (List, Set).
 */
export default function min (value, param) {
  if (typeof value === 'string' && value.length < param)
    return { code: 'min_invalid', message: `expected String length >= ${param}, got ${value.length}` }

  if (Array.isArray(value) && value.length < param)
    return { code: 'min_invalid', message: `expected at least ${param} items, got ${value.length}` }

  return null
}
