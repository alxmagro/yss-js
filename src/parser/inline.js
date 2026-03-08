/**
 * Parses YSS inline type syntax:
 *
 *   Type? (match) [val1, val2] {range}
 *
 * Canonical order:
 *   1. Type  - the base type
 *   2. ?     - optional, immediately after the type
 *   3. ()    - named match alias
 *   4. []    - allowed values (enum)
 *   5. {}    - range:
 *              - String/List/Set: {n, m} inclusive min/max
 *              - Integer/Float:   {>= n, < m} operator-based bounds
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
 *   Integer {>= 18}
 *   Float {> 0, < 1000}
 *   Float {>= 0, <= 1}
 *   List<String>
 *   [String, Integer]             -> AnyOf
 *   [String (date-time), null]    -> AnyOf with match
 */

const NUMERIC_OPS = { '>=': 'gte', '>': 'gt', '<=': 'lte', '<': 'lt' }

/**
 * Parse a single range part like ">= 18" or "2" into { key, value }.
 * For numeric operators: key is 'gte'/'gt'/'lte'/'lt', value is a Number.
 * For plain numbers:     key is null, value is a Number.
 */
function parseRangePart (raw) {
  raw = raw.trim()
  if (raw === '') return null

  for (const [op, key] of Object.entries(NUMERIC_OPS)) {
    if (raw.startsWith(op + ' ')) {
      return { key, value: Number(raw.slice(op.length).trim()) }
    }
  }

  return { key: null, value: Number(raw) }
}

/**
 * Parse a single inline type token.
 * Returns a normalized schema node.
 */
export function parseInline (token) {
  if (typeof token !== 'string') return null

  token = token.trim()

  const result = {
    type:     null,
    min:      null,
    max:      null,
    gt:       null,
    gte:      null,
    lt:       null,
    lte:      null,
    enum:     null,
    optional: false,
    match:    null,
    item:     null,  // for List<Type>
  }

  // 1. Extract range: {n, m} or {>= n, < m} etc.
  const rangeMatch = token.match(/^(.*)\{([^}]+)\}$/)
  if (rangeMatch) {
    const raw   = rangeMatch[2]
    const parts = raw.split(',').map(v => v.trim())

    const isNumeric = parts.some(p => p !== '' && /^(>=|>|<=|<)\s/.test(p))

    if (isNumeric) {
      // Numeric operator bounds: each part is independent
      for (const part of parts) {
        if (part === '') continue
        const parsed = parseRangePart(part)
        if (parsed && parsed.key) result[parsed.key] = parsed.value
      }
    } else {
      // Plain min/max bounds
      if (parts.length === 1) {
        const exact = Number(parts[0])
        result.min  = exact
        result.max  = exact
      } else {
        result.min = parts[0] !== '' ? Number(parts[0]) : null
        result.max = parts[1] !== '' ? Number(parts[1]) : null
      }
    }

    token = rangeMatch[1].trim()
  }

  // 2. Extract enum [val1, val2] - last [] group
  const valuesMatch = token.match(/^(.*)\[([^\]]+)\]$/)
  if (valuesMatch) {
    result.enum = valuesMatch[2].split(',').map(v => v.trim())
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
export function parseValue (value) {
  if (Array.isArray(value)) {
    return {
      anyOf: value.map(v =>
        v === null || v === 'null' ? { type: 'null' } : parseInline(String(v))
      )
    }
  }

  return parseInline(String(value))
}
