/**
 * YSS inline syntax v2.
 *
 * Syntax: Type1 | Type2, key val, key val, ...
 *
 * Constraints (comma-separated after type):
 *   ~ format       format alias or /regex/
 *   == x           const value
 *   >= n           gte
 *   > n            gt
 *   <= n           lte
 *   < n            lt
 *   size n         exact size
 *   size [n, m]    size range (null = unbounded)
 *   enum [a, b]    allowed values
 *   unique         unique: true (no val needed)
 *   key            key: true  (any boolean flag with no val)
 *
 * Generic: array<string>, set<integer>, etc.
 */

function parseScalar (raw) {
  raw = raw.trim()

  if (raw.startsWith('[') && raw.endsWith(']')) {
    const inner = raw.slice(1, -1).trim()
    if (!inner) return []
    return splitArray(inner).map(parseScalar)
  }

  if (raw === 'true') return true
  if (raw === 'false') return false

  if ((raw.startsWith('"') && raw.endsWith('"')) ||
      (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1)
  }

  if (/^-?\d+\.\d+$/.test(raw)) return parseFloat(raw)
  if (/^-?\d+$/.test(raw)) return parseInt(raw, 10)

  return raw
}

function splitArray (str) {
  const parts = []
  let depth = 0
  let current = ''

  for (const ch of str) {
    if (ch === '[') depth++
    else if (ch === ']') depth--
    if (ch === ',' && depth === 0) {
      parts.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim()) parts.push(current.trim())
  return parts
}

function splitConstraints (str) {
  const parts = []
  let depth = 0
  let quote = null
  let current = ''

  for (const ch of str) {
    if (quote) {
      current += ch
      if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") { quote = ch; current += ch; continue }
    if ('[({'.includes(ch)) depth++
    else if ('])}'.includes(ch)) depth--
    if (ch === ',' && depth === 0) {
      parts.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim()) parts.push(current.trim())
  return parts
}

export function parseInline (token) {
  if (typeof token !== 'string') return null
  token = token.trim()

  const result = {}

  // Generic: array<string>, set<integer>, etc.
  const genericMatch = token.match(/^(\w+)<(\w+)>$/)
  if (genericMatch) {
    result.type = genericMatch[1]
    result.item = parseInline(genericMatch[2])
    return result
  }

  if (!token.includes(',')) {
    const types = token.split('|').map(t => t.trim()).filter(Boolean)
    result.type = types.length > 1 ? types : (types[0] ?? token)
    return result
  }

  const parts = splitConstraints(token)
  const typePart = parts[0]
  const constraints = parts.slice(1)

  const types = typePart.split('|').map(t => t.trim()).filter(Boolean)
  result.type = types.length > 1 ? types : (types[0] ?? typePart)

  const rules = []

  for (const constraint of constraints) {
    if (!constraint) continue
    const spaceIdx = constraint.indexOf(' ')
    const key = spaceIdx === -1 ? constraint : constraint.slice(0, spaceIdx).trim()
    const val = spaceIdx === -1 ? true : parseScalar(constraint.slice(spaceIdx + 1).trim())

    if (key === '==') { result.const = val; rules.push('const'); continue }
    if (key === '~') { result.format = val; rules.push('format'); continue }
    if (key === '>=') { result.gte = val; rules.push('gte'); continue }
    if (key === '>') { result.gt = val; rules.push('gt'); continue }
    if (key === '<=') { result.lte = val; rules.push('lte'); continue }
    if (key === '<') { result.lt = val; rules.push('lt'); continue }
    if (key === 'size') { result.size = val; rules.push('size'); continue }
    if (key === 'in') { result.in = val; rules.push('in'); continue }
    if (key === 'not_in') { result.not_in = val; rules.push('not_in'); continue }
    if (key === '%') { result.multiple_of = val; rules.push('multiple_of'); continue }
    if (key === 'unique') { result.unique = true; rules.push('unique'); continue }
  }

  if (rules.length) result.rules = rules

  return result
}

export function parseValue (value) {
  return parseInline(String(value))
}
