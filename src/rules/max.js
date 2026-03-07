/**
 * $max - maximum value, length, or item count depending on type.
 */
export default function max(value, param, path) {
  if (typeof value === 'string' && value.length > param)
    return { code: 'max_invalid', message: `expected String length <= ${param}, got ${value.length}` }

  if (typeof value === 'number' && value > param)
    return { code: 'max_invalid', message: `expected value <= ${param}, got ${value}` }

  if (Array.isArray(value) && value.length > param)
    return { code: 'max_invalid', message: `expected at most ${param} items, got ${value.length}` }

  return null
}