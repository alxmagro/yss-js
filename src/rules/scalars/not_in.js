/**
 * $not_in / not_in [val1, val2] - the value must not be one of the listed options.
 */
export default function notInRule (value, schemaParam) {
  if (schemaParam.includes(value)) {
    return {
      code: 'not_in',
      message: 'Value is not allowed',
      data: { not_in: schemaParam }
    }
  }
  return null
}
