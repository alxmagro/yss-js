/**
 * $lte - value must be less than or equal to schemaParam (inclusive maximum).
 */
export default function lte (value, schemaParam) {
  if (typeof value !== 'number') return null
  if (value > schemaParam) {
    return {
      code: 'lte',
      message: `Value must be less than or equal to \`${schemaParam}\``,
      data: { lte: schemaParam }
    }
  }
  return null
}
