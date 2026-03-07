import { runMatch } from '../aliases.js'

/**
 * $match / =~ - validates a string against a named alias or raw regex.
 */
export default function match(value, param, path) {
  if (typeof value !== 'string') return null // type rule handles this

  if (!runMatch(value, param))
    return { code: 'match_invalid', message: `expected String =~ ${param}` }

  return null
}