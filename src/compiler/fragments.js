// ── Path expressions ──────────────────────────────────────────────────────────

/**
 * Returns a JS expression that evaluates to the path of a named object field.
 * When parent is the empty-string literal '""', the child path is a static literal.
 */
export function fieldPathExpr (parent, key) {
  if (parent === '""') return JSON.stringify(key)
  return `(${parent} ? ${parent} + ${JSON.stringify('.' + key)} : ${JSON.stringify(key)})`
}

/**
 * Returns a JS expression that evaluates to the path of an array element.
 * idxVar is the runtime loop index variable name.
 */
export function indexPathExpr (parent, idxVar) {
  if (parent === '""') return `('[' + ${idxVar} + ']')`
  return `(${parent} + '[' + ${idxVar} + ']')`
}

/**
 * Returns a JS expression for a statically known array index (used in `at`).
 */
export function atPathExpr (parent, index) {
  if (parent === '""') return JSON.stringify(`[${index}]`)
  return `(${parent} + ${JSON.stringify(`[${index}]`)})`
}

// ── Type checks ───────────────────────────────────────────────────────────────

/**
 * Returns a JS boolean expression that is true when varExpr matches the type(s).
 */
export function typeMatchCond (varExpr, type) {
  const types = Array.isArray(type) ? type : [type]
  return types.map(t => singleTypeCond(varExpr, t)).join(' || ')
}

function singleTypeCond (v, t) {
  switch (t) {
    case 'null': return `${v} === null`
    case 'boolean': return `typeof ${v} === 'boolean'`
    case 'integer': return `Number.isInteger(${v})`
    case 'number': return `typeof ${v} === 'number'`
    case 'string': return `typeof ${v} === 'string'`
    case 'array': return `Array.isArray(${v})`
    case 'object': return `(typeof ${v} === 'object' && ${v} !== null && !Array.isArray(${v}))`
    default: return 'false'
  }
}
