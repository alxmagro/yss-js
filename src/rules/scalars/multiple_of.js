/**
 * $multiple_of / % n - value must be divisible by n.
 * Uses quotient rounding to handle floating point precision.
 */
export default function multipleOf (value, schemaParam) {
  const quotient = value / schemaParam
  if (Math.abs(Math.round(quotient) - quotient) > 1e-10) {
    return {
      code:    'multiple_of',
      message: `Value must be a multiple of \`${schemaParam}\``,
      data: { value, multiple_of: schemaParam },
    }
  }
  return null
}
