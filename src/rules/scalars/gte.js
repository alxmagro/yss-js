/**
 * $gte - value must be greater than or equal to schemaParam (inclusive minimum).
 */
export default function gte (value, schemaParam) {
  if (typeof value !== 'number') return null
  if (value < schemaParam) {
    return {
      code: 'gte',
      message: `Value must be greater than or equal to \`${schemaParam}\``,
      data: { value, gte: schemaParam }
    }
  }
  return null
}
