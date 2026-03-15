export default function type (value, schemaParam) {
  if (schemaParam === 'any' || schemaParam === 'any_of') return null

  const allowed = Array.isArray(schemaParam) ? schemaParam : [schemaParam]

  let matches

  if (value === null) {
    matches = allowed.includes('null')
  } else if (typeof value === 'boolean') {
    matches = allowed.includes('boolean')
  } else if (Number.isInteger(value)) {
    matches = allowed.includes('integer') || allowed.includes('number')
  } else if (typeof value === 'number') {
    matches = allowed.includes('number')
  } else if (typeof value === 'string') {
    matches = allowed.includes('string')
  } else if (Array.isArray(value)) {
    matches = allowed.includes('array')
  } else if (typeof value === 'object') {
    matches = allowed.includes('object')
  } else {
    matches = false
  }

  if (!matches)
    return {
      code:    'type',
      message: 'Unexpected type',
      data:    { value, expected: schemaParam },
    }

  return null
}
