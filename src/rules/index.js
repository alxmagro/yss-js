import min      from './min.js'
import max      from './max.js'
import gt       from './gt.js'
import gte      from './gte.js'
import lt       from './lt.js'
import lte      from './lte.js'
import match    from './match.js'
import enumRule from './enum.js'
import item     from './item.js'
import at       from './at.js'

// Rules that return a single error or null
export const scalarRules = { min, max, gt, gte, lt, lte, match, enum: enumRule }

// Rules that return an array of errors (recursive)
export const arrayRules = { item, at }

export function getRule (name) {
  return scalarRules[name] ?? arrayRules[name] ?? null
}
