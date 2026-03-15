/**
 * $in / in [val1, val2] - the value must be one of the listed options.
 */
export default function inRule (value, schemaParam) {
  if (!schemaParam.includes(value)) {
    return {
      code:    'in',
      message: `Value \`${value}\` is not allowed`,
      data: {
        value,
        in: schemaParam,
      },
    }
  }
  return null
}
