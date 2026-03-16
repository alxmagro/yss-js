/**
 * $size - validates the length of a string, array, or number of properties of an object.
 *
 * schemaParam can be:
 *   - integer         → exact size, e.g. size: 5
 *   - [min, max]      → range, null means unbound, e.g. size: [2, 80] / [~, 5] / [4, ~]
 */
export default function size (value, schemaParam) {
  let length

  if (typeof value === 'string' || Array.isArray(value)) {
    length = value.length
  } else if (typeof value === 'object' && value !== null) {
    length = Object.keys(value).length
  } else {
    return null
  }

  if (typeof schemaParam === 'number') {
    if (length !== schemaParam) {
      return {
        code: 'size_exact',
        message: `Size must be exactly \`${schemaParam}\``,
        data: { expected: schemaParam }
      }
    }
    return null
  }

  const [min, max] = schemaParam

  if (min != null && length < min) {
    return {
      code: 'size_min',
      message: `Minimum size is \`${min}\``,
      data: { min }
    }
  }

  if (max != null && length > max) {
    return {
      code: 'size_max',
      message: `Maximum size is \`${max}\``,
      data: { max }
    }
  }

  return null
}
