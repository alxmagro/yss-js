/**
 * $lt - value must be strictly less than schemaParam (exclusive maximum).
 */
export default function lt (value, schemaParam) {
  if (typeof value !== 'number') return null
  if (value >= schemaParam)
    return {
      code:    'lt',
      message: `Value must be less than \`${schemaParam}\``,
      data:    { value, lt: schemaParam },
    }
  return null
}
