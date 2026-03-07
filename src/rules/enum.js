/**
 * $enum / [val1, val2] - the value must be one of the listed options.
 */
export default function enumRule (value, param, path) {
  if (!param.includes(value)) {
    return {
      code:    'enum_invalid',
      message: `expected one of ${param.map(v => JSON.stringify(v)).join('|')}, got ${JSON.stringify(value)}`,
    }
  }
  return null
}