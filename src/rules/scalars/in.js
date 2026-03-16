/**
 * $in / in [val1, val2] - the value must be one of the listed options.
 */
export default function inRule (value, schemaParam) {
  if (!schemaParam.includes(value)) {
    return {
      code: 'in',
      message: 'Value is not allowed',
      data: { in: schemaParam }
    }
  }
  return null
}
