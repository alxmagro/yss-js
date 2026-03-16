/**
 * $gt - value must be strictly greater than schemaParam (exclusive minimum).
 */
export default function gt (value, schemaParam) {
  if (typeof value !== 'number') return null
  if (value <= schemaParam) {
    return {
      code: 'gt',
      message: `Value must be greater than \`${schemaParam}\``,
      data: { gt: schemaParam }
    }
  }
  return null
}
