/**
 * $const - value must be exactly the specified constant.
 */
export default function constRule (value, schemaParam) {
  if (value !== schemaParam) {
    return {
      code:    'const_mismatch',
      message: `Value must be \`${schemaParam}\``,
      data:    { value, const: schemaParam },
    }
  }
  return null
}

