/**
 * $format - validates a string against a named alias or raw regex.
 */
import { runMatch } from '../../aliases.js'

export default function format (value, schemaParam) {
  if (typeof value !== 'string') return null

  if (!runMatch(value, schemaParam)) {
    return {
      code: 'format',
      message: 'Value does not match required format',
      data: { value, format: schemaParam }
    }
  }

  return null
}
