/**
 * $const - value must be exactly the specified constant.
 */
export default function constRule (value, schemaParam) {
  if (value !== schemaParam) {
    return {
      code: 'const',
      message: `Value must be \`${schemaParam}\``,
      data: { const: schemaParam }
    }
  }
  return null
}
