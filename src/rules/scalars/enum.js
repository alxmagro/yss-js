/**
 * $enum / [val1, val2] - the value must be one of the listed options.
 */
export default function enumRule (value, schemaParam) {
  if (!schemaParam.includes(value)) {
    return {
      code:    'enum_invalid',
      message: `Value \`${value}\` is not allowed`,
      data: {
        value,
        enum: schemaParam,
      },
    }
  }
  return null
}
