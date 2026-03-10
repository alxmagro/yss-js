/**
 * $const - value must be exactly the specified constant.
 */
export default function constRule (value, param) {
  if (value !== param) {
    return {
      code:    'const_mismatch',
      message: `Value must be \`${param}\``,
      data:    { value, const: param },
    }
  }
  return null
}

