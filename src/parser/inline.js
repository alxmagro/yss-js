/**
 * Parses YSS inline type syntax:
 *
 *   Type (| Type2 ...)? (match) [val1, val2] {range}
 *
 * Canonical order:
 *   1. Type(s) - one or more types separated by |
 *   2. ?       - nullable, immediately after the last type
 *   3. ()      - named match alias
 *   4. []      - allowed values (enum)
 *   5. {}      - range:
 *               - String/List/Set: {n, m} inclusive min/max
 *               - Integer/Float:   {>= n, < m} operator-based bounds
 *
 * Examples:
 *   String
 *   String | null
 *   String | Integer
 *   String (email)
 *   String | null (uuid)
 *   String [active, inactive]
 *   String {2, 80}
 *   String | null {2, 80}
 *   Integer {>= 18}
 *   Float {> 0, < 1000}
 *   List<String>
 */

const NUMERIC_OPS = { '>=': 'gte', '>': 'gt', '<=': 'lte', '<': 'lt' }

/**
 * Parse a single range part like ">= 18" or "2" into { key, value }.
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
    required: false,
    match:    null,
    item:     null,
  }

  // 1. Extract range: {n, m} or {>= n, < m} etc.
  const rangeMatch = token.match(/^(.*)\{([^}]+)\}$/)
  if (rangeMatch) {
    const raw   = rangeMatch[2]
    const parts = raw.split(',').map(v => v.trim())

    const isNumeric = parts.some(p => p !== '' && /^(>=|>|<=|<)\s/.test(p))

    if (isNumeric) {
      for (const part of parts) {
        if (part === '') continue
        const parsed = parseRangePart(part)
        if (parsed && parsed.key) result[parsed.key] = parsed.value
      }
    } else {
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

  // 4. Extract List<Type> / Set<Type> generic (before pipe split)
  const genericMatch = token.match(/^(\w+)<(\w+)>$/)
  if (genericMatch) {
    result.type = genericMatch[1]
    result.item = parseInline(genericMatch[2])
    return result
  }

  // 5. Split on | for multiple types
  const types = token.split('|').map(t => t.trim()).filter(Boolean)
  if (types.length > 1) {
    result.type = types
  } else {
    result.type = types[0] ?? token
  }

  return result
}

/**
 * Parse a YAML scalar value - either an inline token or an AnyOf array.
 * An array of simple types becomes type: [...].
 * An array with items that have extra rules becomes anyOf: [...].
 * @param {string|string[]} value - raw YAML value
 * @returns {object} normalized schema node
 */
export function parseValue (value) {
  if (Array.isArray(value)) {
    const nodes = value.map(v =>
      v === null || v === 'null' ? { type: 'null' } : parseInline(String(v))
    )

    // If all branches are simple types (no rules), collapse to type array
    const allSimple = nodes.every(n => {
      const { type, optional, item, ...rules } = n
      return Object.values(rules).every(v => v === null || v === false)
    })

    if (allSimple) {
      return { type: nodes.map(n => n.type) }
    }

    // Otherwise keep as anyOf branches
    return { anyOf: nodes }
  }

  return parseInline(String(value))
}
