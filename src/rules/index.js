import min    from './min.js'
import max    from './max.js'
import match  from './match.js'
import enum_ from './enum.js'
import item   from './item.js'
import at     from './at.js'

// Rules that return a single error string or null
export const scalarRules = { min, max, match, enum: enum_ }

// Rules that return an array of errors (recursive)
export const arrayRules = { item, at }

export function getRule(name) {
  return scalarRules[name] ?? arrayRules[name] ?? null
}