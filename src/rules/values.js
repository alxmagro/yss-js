/**
 * $values / (VAL1|VAL2) - the value must be one of the listed options.
 */
export default function values(value, param, path) {
  const allowed = param.map(String)
  if (!allowed.includes(String(value)))
    return { code: 'enum_invalid', message: `expected one of (${param.join('|')}), got ${JSON.stringify(value)}` }

  return null
}