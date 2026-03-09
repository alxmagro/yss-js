/**
 * $format - validates a string against a named alias or raw regex.
 */
import { aliases, runMatch } from '../aliases.js'

export default function format (value, param, path) {
  if (typeof value !== 'string') return null

  let ok
  if (param.startsWith('/')) {
    try {
      ok = new RegExp(param.slice(1, param.lastIndexOf('/'))).test(value)
    } catch {
      ok = false
    }
  } else {
    ok = param in aliases ? runMatch(value, param) : false
  }

  if (!ok) {
    return {
      code:    'format_invalid',
      message: 'Value does not match required format',
      data:    { value, format: param },
    }
  }

  return null
}
