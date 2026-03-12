/**
 * $format - validates a string against a named alias or raw regex.
 */
import { aliases, runMatch } from '../../aliases.js'

export default function format (value, schemaParam) {
  if (typeof value !== 'string') return null

  let ok
  if (schemaParam.startsWith('/')) {
    try {
      ok = new RegExp(schemaParam.slice(1, schemaParam.lastIndexOf('/'))).test(value)
    } catch {
      ok = false
    }
  } else {
    ok = schemaParam in aliases ? runMatch(value, schemaParam) : false
  }

  if (!ok) {
    return {
      code:    'format_invalid',
      message: 'Value does not match required format',
      data:    { value, format: schemaParam },
    }
  }

  return null
}
