/**
 * Parses YSS inline type syntax:
 *
 *   Type?(min,max)(VAL1 | VAL2 | VAL3) =~ match
 *
 * Canonical order:
 *   1. Type  - the base type
 *   2. ?     - optional, immediately after the type
 *   3. {}    - range (min,max)
 *   4. ()    - allowed values
 *   5. =~    - match alias or /regex/
 *
 * Examples:
 *   String
 *   String?
 *   String{2,80}
 *   String?{2,80}
 *   String(active | inactive)
 *   String?{2,80}(foo | bar)
 *   String? =~ email
 *   String?{1,20}(urgent | low | medium) =~ /^[a-z]+$/
 *   Integer{1,100}
 *   List<String>
 *   [String, Integer]        -> AnyOf
 *   [String, null]           -> nullable AnyOf
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

  // 1. Extract =~ match (must be last - strip from right first)
  const matchIdx = token.indexOf('=~')
  if (matchIdx !== -1) {
    result.match = token.slice(matchIdx + 2).trim()
    token = token.slice(0, matchIdx).trim()
  }

  // 2. Extract values (VAL1 | VAL2) - last () group
  const valuesMatch = token.match(/^(.*)\(([^)]+)\)$/)
  if (valuesMatch) {
    result.values = valuesMatch[2].split('|').map(v => v.trim())
    token = valuesMatch[1].trim()
  }

  // 3. Extract range: {n} = exactly n, {n,m} = between, {n,} = min only, {,m} = max only
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

  // 4. Extract optional ? - now immediately after the type name
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
