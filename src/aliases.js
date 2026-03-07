/**
 * Named aliases for $match.
 * Each alias maps to a regex or validator function.
 *
 * Spec references per category:
 *
 * Dates & Times - RFC 3339
 *   https://datatracker.ietf.org/doc/html/rfc3339
 *
 * Email - RFC 5321 / RFC 6531
 *   https://datatracker.ietf.org/doc/html/rfc5321
 *   https://datatracker.ietf.org/doc/html/rfc6531
 *
 * Hostname - RFC 1123 / RFC 5890
 *   https://datatracker.ietf.org/doc/html/rfc1123
 *   https://datatracker.ietf.org/doc/html/rfc5890
 *
 * IP Addresses - RFC 2673 / RFC 4291
 *   https://datatracker.ietf.org/doc/html/rfc2673
 *   https://datatracker.ietf.org/doc/html/rfc4291
 *
 * URI - RFC 3986 / RFC 3987
 *   https://datatracker.ietf.org/doc/html/rfc3986
 *   https://datatracker.ietf.org/doc/html/rfc3987
 *
 * UUID - RFC 4122
 *   https://datatracker.ietf.org/doc/html/rfc4122
 *
 * JSON Pointer - RFC 6901
 *   https://datatracker.ietf.org/doc/html/rfc6901
 *
 * JsonSchema format spec reference:
 *   https://json-schema.org/draft/2020-12/json-schema-validation#section-7.3
 */

// ── Dates & Times ────────────────────────────────────────────────────────────

const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
const DATE      = /^\d{4}-\d{2}-\d{2}$/
const TIME      = /^\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
const DURATION  = /^P(?:\d+Y)?(?:\d+M)?(?:\d+W)?(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+S)?)?$/

// ── Email ─────────────────────────────────────────────────────────────────────

const EMAIL     = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const IDN_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // simplified - full IDN requires unicode lib

// ── Hostname ──────────────────────────────────────────────────────────────────

const HOSTNAME     = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
const IDN_HOSTNAME = /^(?:[a-zA-Z0-9\u00C0-\u024F](?:[a-zA-Z0-9\u00C0-\u024F-]{0,61}[a-zA-Z0-9\u00C0-\u024F])?\.)+[a-zA-Z\u00C0-\u024F]{2,}$/

// ── IP Addresses ──────────────────────────────────────────────────────────────

const IPV4 = /^(\d{1,3}\.){3}\d{1,3}$/
const IPV6 = /^([\da-fA-F]{0,4}:){2,7}[\da-fA-F]{0,4}$/

// ── URI ───────────────────────────────────────────────────────────────────────

const URI           = /^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\/[^\s]*$/
const URI_REFERENCE = /^([a-zA-Z][a-zA-Z0-9+\-.]*:)?\/\/[^\s]*|^[^\s]*$/
const IRI           = /^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\/[^\s]*$/  // simplified

// ── UUID ──────────────────────────────────────────────────────────────────────

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ── JSON Pointer ──────────────────────────────────────────────────────────────

const JSON_POINTER = /^(\/([^~/]|~0|~1)*)*$/

// ── Regex ─────────────────────────────────────────────────────────────────────

function isValidRegex(value) {
  try { new RegExp(value); return true }
  catch { return false }
}

// ── Aliases map ───────────────────────────────────────────────────────────────

export const aliases = {
  // dates & times
  'date-time':    (v) => DATE_TIME.test(v),
  'date':         (v) => DATE.test(v),
  'time':         (v) => TIME.test(v),
  'duration':     (v) => DURATION.test(v),

  // email
  'email':        (v) => EMAIL.test(v),
  'idn-email':    (v) => IDN_EMAIL.test(v),

  // hostname
  'hostname':     (v) => HOSTNAME.test(v),
  'idn-hostname': (v) => IDN_HOSTNAME.test(v),

  // ip
  'ipv4':         (v) => IPV4.test(v) && v.split('.').every(n => Number(n) <= 255),
  'ipv6':         (v) => IPV6.test(v),

  // uri
  'uri':          (v) => URI.test(v),
  'uri-reference':(v) => URI_REFERENCE.test(v),
  'iri':          (v) => IRI.test(v),

  // uuid
  'uuid':         (v) => UUID.test(v),

  // json pointer
  'json-pointer': (v) => JSON_POINTER.test(v),

  // regex
  'regex':        (v) => isValidRegex(v),
}

/**
 * Register custom patterns, merging into the aliases map.
 * Values must be /regex/ strings. Overwrites built-ins if names collide.
 *
 * @param {object} patterns - { name: '/regex/' }
 */
export function registerPatterns (patterns) {
  for (const [name, raw] of Object.entries(patterns)) {
    if (typeof raw !== 'string' || !raw.startsWith('/') || raw.lastIndexOf('/') === 0) {
      throw new Error(`$patterns: "${name}" must be a /regex/ string`)
    }
    const lastSlash = raw.lastIndexOf('/')
    const source    = raw.slice(1, lastSlash)
    const flags     = raw.slice(lastSlash + 1)
    aliases[name]   = (v) => new RegExp(source, flags).test(v)
  }
}

/**
 * Run a $match against a value.
 *
 * Resolution order:
 *   - Named alias (e.g. "email", "uuid")  -> no delimiters
 *   - Raw regex                            -> must be wrapped in /pattern/
 *
 * @param {string} value
 * @param {string} pattern - alias name or /regex/
 * @returns {boolean}
 */
export function runMatch (value, pattern) {
  // Named alias - no delimiters
  if (aliases[pattern]) return aliases[pattern](value)

  // Raw regex - must be wrapped in /pattern/
  if (pattern.startsWith('/') && pattern.lastIndexOf('/') > 0) {
    const lastSlash = pattern.lastIndexOf('/')
    const source    = pattern.slice(1, lastSlash)
    const flags     = pattern.slice(lastSlash + 1)
    try {
      return new RegExp(source, flags).test(value)
    } catch {
      throw new Error(`Invalid regex in =~ : ${pattern}`)
    }
  }

  throw new Error(`=~ "${pattern}" is not a known alias and is not wrapped in /slashes/. Use =~ /pattern/ for raw regex.`)
}