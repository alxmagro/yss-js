/**
 * Parses YSS inline type syntax:
 *
 *   Type? (match) [val1, val2] {min, max}
 *
 * Canonical order:
 *   1. Type  - the base type
 *   2. ?     - optional, immediately after the type
 *   3. ()    - named match alias
 *   4. []    - allowed values
 *   5. {}    - range (min, max)
 *
 * Examples:
 *   String
 *   String?
 *   String (email)
 *   String? (uuid)
 *   String [active, inactive]
 *   String? [active, inactive]
 *   String {2, 80}
 *   String? {2, 80}
 *   String? (slug) [urgent, low, medium] {1, 20}
 *   Integer {1, 100}
 *   List<String>
 *   [String, Integer]             -> AnyOf
 *   [String (date-time), null]    -> AnyOf with match
 */

/**
 * Parse a single inline type token.
 * Returns a normalized schema node.
 */
export function parseInline(token) {
  if (typeof token !== 'string') return null

  token = token.trim()

  const result = {
    type:     null,
    min:      null,
    max:      null,
    values:   null,
    optional: false,
    match:    null,
    item:     null,  // for List<Type>
  }

  // 1. Extract range: {n} = exactly n, {n,m} = between, {n,} = min only, {,m} = max only
  const rangeMatch = token.match(/^(.*)\{([^}]+)\}$/)
  if (rangeMatch) {
    const raw   = rangeMatch[2]
    const parts = raw.split(',').map(v => v.trim())
    if (parts.length === 1) {
      const exact = Number(parts[0])
      result.min  = exact
      result.max  = exact
    } else {
      result.min = parts[0] !== '' ? Number(parts[0]) : null
      result.max = parts[1] !== '' ? Number(parts[1]) : null
    }
    token = rangeMatch[1].trim()
  }

  // 2. Extract values [val1, val2] - last [] group
  const valuesMatch = token.match(/^(.*)\[([^\]]+)\]$/)
  if (valuesMatch) {
    result.values = valuesMatch[2].split(',').map(v => v.trim())
    token = valuesMatch[1].trim()
  }

  // 3. Extract named match (alias) - last () group
  const matchMatch = token.match(/^(.*)\(([^)]+)\)$/)
  if (matchMatch) {
    result.match = matchMatch[2].trim()
    token = matchMatch[1].trim()
  }

  // 4. Extract optional ? - immediately after the type name
  if (token.endsWith('?')) {
    result.optional = true
    token = token.slice(0, -1).trim()
  }

  // 5. Extract List<Type> / Set<Type> generic
  const genericMatch = token.match(/^(\w+)<(\w+)>$/)
  if (genericMatch) {
    result.type = genericMatch[1]
    result.item = parseInline(genericMatch[2])
    return result
  }

  result.type = token

  return result
}

/**
 * Parse a YAML scalar value - either an inline token or an AnyOf array.
 * @param {string|string[]} value - raw YAML value
 * @returns {object} normalized schema node
 */
export function parseValue(value) {
  // AnyOf - YAML array ["String", "null"] or ["String", "Integer"]
  if (Array.isArray(value)) {
    return {
      anyOf: value.map(v =>
        v === null || v === 'null' ? { type: 'null' } : parseInline(String(v))
      )
    }
  }

  return parseInline(String(value))
}