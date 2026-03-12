import { aliases }                                          from '../aliases.js'
import { fieldPathExpr, indexPathExpr, atPathExpr,
         typeMatchCond }                                    from './fragments.js'

// ── Dispatcher ────────────────────────────────────────────────────────────────

export function emitNode (ctx, varExpr, node, pathExpr, errTarget = 'errors') {
  const type = node.type ?? 'any'

  if (type === 'any_of') {
    emitAnyOf(ctx, varExpr, node, pathExpr, errTarget)
    return
  }

  const isArr = type === 'array'  || (type === 'any' && (node.item != null || node.at != null))
  const isObj = type === 'object' || (type === 'any' && node.fields != null)

  if (type !== 'any') {
    const cond     = typeMatchCond(varExpr, type)
    const expected = JSON.stringify(Array.isArray(type) ? type : type)

    ctx.emit(`if (!(${cond})) {`)
    ctx.emit(`  ${errTarget}.push({ path: ${pathExpr}, code: 'type_mismatch', message: 'Unexpected type', data: { value: ${varExpr}, expected: ${expected} } })`)
    ctx.emit(`} else {`)

    if (isArr)      emitArrayBody(ctx, varExpr, node, pathExpr, errTarget)
    else if (isObj) emitObjectBody(ctx, varExpr, node, pathExpr, errTarget)
    else            emitScalarRules(ctx, varExpr, node, pathExpr, errTarget)

    ctx.emit(`}`)

  } else {
    // any — no type check
    if (isArr)      emitArrayBody(ctx, varExpr, node, pathExpr, errTarget)
    else if (isObj) emitObjectBody(ctx, varExpr, node, pathExpr, errTarget)
    else {
      // runtime dispatch (value type unknown at compile time)
      ctx.emit(`if (Array.isArray(${varExpr})) {`)
      emitArrayBody(ctx, varExpr, node, pathExpr, errTarget)
      ctx.emit(`} else if (typeof ${varExpr} === 'object' && ${varExpr} !== null) {`)
      emitObjectBody(ctx, varExpr, node, pathExpr, errTarget)
      ctx.emit(`} else {`)
      emitScalarRules(ctx, varExpr, node, pathExpr, errTarget)
      ctx.emit(`}`)
    }
  }
}

// ── Object ────────────────────────────────────────────────────────────────────

function emitObjectBody (ctx, varExpr, node, pathExpr, errTarget) {
  emitScalarRules(ctx, varExpr, node, pathExpr, errTarget)

  if (!node.fields) return

  for (const [key, fieldNode] of Object.entries(node.fields)) {
    const fVar     = ctx.nextId()
    const fPathStr = fieldPathExpr(pathExpr, key)  // compile-time expression, not a runtime variable

    ctx.emit(`const ${fVar} = ${varExpr}[${JSON.stringify(key)}]`)
    ctx.emit(`if (${fVar} === undefined) {`)
    if (fieldNode.required) {
      ctx.emit(`  const _p = ${fPathStr}`)
      ctx.emit(`  ${errTarget}.push({ path: _p, code: 'prop_required', message: 'Missing required property \`' + _p + '\`' })`)
    }
    ctx.emit(`} else {`)
    emitNode(ctx, fVar, fieldNode, fPathStr, errTarget)
    ctx.emit(`}`)
  }

  if (node.strict) {
    const allowedRef = ctx.addRef(new Set(Object.keys(node.fields)))
    const kVar  = ctx.nextId()
    const kPath = pathExpr === '""'
      ? kVar
      : `(${pathExpr} ? ${pathExpr} + '.' + ${kVar} : ${kVar})`

    ctx.emit(`for (const ${kVar} in ${varExpr}) {`)
    ctx.emit(`  if (!refs.${allowedRef}.has(${kVar})) {`)
    ctx.emit(`    const p = ${kPath}`)
    ctx.emit(`    ${errTarget}.push({ path: p, code: 'prop_unexpected', message: 'Unexpected property \`' + p + '\`' })`)
    ctx.emit(`  }`)
    ctx.emit(`}`)
  }
}

// ── Array ─────────────────────────────────────────────────────────────────────

function emitArrayBody (ctx, varExpr, node, pathExpr, errTarget) {
  emitScalarRules(ctx, varExpr, node, pathExpr, errTarget)

  if (node.item != null) {
    const iVar  = ctx.nextId()
    const elVar = ctx.nextId()

    ctx.emit(`for (let ${iVar} = 0; ${iVar} < ${varExpr}.length; ${iVar}++) {`)
    ctx.emit(`  const ${elVar} = ${varExpr}[${iVar}]`)
    // Path expression inlined — only evaluated inside error branches
    emitNode(ctx, elVar, node.item, indexPathExpr(pathExpr, iVar), errTarget)
    ctx.emit(`}`)
  }

  if (node.at != null) {
    for (const [pos, posNode] of Object.entries(node.at)) {
      const index  = Number(pos)
      const atVar  = ctx.nextId()

      ctx.emit(`if (${varExpr}.length > ${index}) {`)
      ctx.emit(`  const ${atVar} = ${varExpr}[${index}]`)
      emitNode(ctx, atVar, posNode, atPathExpr(pathExpr, index), errTarget)
      ctx.emit(`}`)
    }
  }
}

// ── AnyOf ─────────────────────────────────────────────────────────────────────

function emitAnyOf (ctx, varExpr, node, pathExpr, errTarget) {
  const matchedVar = ctx.nextId()
  const aeVar      = ctx.nextId()

  ctx.emit(`let ${matchedVar} = false`)
  ctx.emit(`const ${aeVar} = []`)

  for (const branch of node.items) {
    const beVar = ctx.nextId()
    ctx.emit(`if (!${matchedVar}) {`)
    ctx.emit(`  const ${beVar} = []`)
    emitNode(ctx, varExpr, branch, pathExpr, beVar)
    ctx.emit(`  if (${beVar}.length === 0) { ${matchedVar} = true }`)
    ctx.emit(`  else { ${aeVar}.push(${beVar}) }`)
    ctx.emit(`}`)
  }

  ctx.emit(`if (!${matchedVar}) {`)
  ctx.emit(`  ${errTarget}.push({ path: ${pathExpr}, code: 'anyof_invalid', message: 'Value does not match any condition', data: { value: ${varExpr}, any_of: ${aeVar} } })`)
  ctx.emit(`}`)
}

// ── Scalar rules ──────────────────────────────────────────────────────────────

function emitScalarRules (ctx, varExpr, node, pathExpr, errTarget) {
  if (!node.rules || node.rules.length === 0) return
  for (const key of node.rules)
    emitScalarRule(ctx, key, varExpr, node[key], node.type, pathExpr, errTarget)
}

function emitScalarRule (ctx, rule, varExpr, param, nodeType, pathExpr, errTarget) {
  switch (rule) {
    case 'format': return emitFormat(ctx, varExpr, param, pathExpr, errTarget)
    case 'size':   return emitSize(ctx, varExpr, param, nodeType, pathExpr, errTarget)
    case 'enum':   return emitEnum(ctx, varExpr, param, pathExpr, errTarget)
    case 'const':  return emitConst(ctx, varExpr, param, pathExpr, errTarget)
    case 'gt':     return emitCompare(ctx, varExpr, param, pathExpr, errTarget, '<=', 'gt_invalid',  'Value must be greater than',             'gt')
    case 'gte':    return emitCompare(ctx, varExpr, param, pathExpr, errTarget, '<',  'gte_invalid', 'Value must be greater than or equal to', 'gte')
    case 'lt':     return emitCompare(ctx, varExpr, param, pathExpr, errTarget, '>=', 'lt_invalid',  'Value must be less than',                'lt')
    case 'lte':    return emitCompare(ctx, varExpr, param, pathExpr, errTarget, '>',  'lte_invalid', 'Value must be less than or equal to',    'lte')
    case 'unique': return emitUnique(ctx, varExpr, pathExpr, errTarget)
  }
}

// ── format ────────────────────────────────────────────────────────────────────

function emitFormat (ctx, varExpr, param, pathExpr, errTarget) {
  let checkExpr

  if (param.startsWith('/')) {
    const lastSlash = param.lastIndexOf('/')
    const source    = param.slice(1, lastSlash)
    const flags     = param.slice(lastSlash + 1)
    try {
      const regexRef = ctx.addRef(new RegExp(source, flags))
      checkExpr = `refs.${regexRef}.test(${varExpr})`
    } catch {
      return // invalid regex — skip
    }
  } else if (aliases[param]) {
    const fnRef = ctx.addRef(aliases[param])
    checkExpr = `refs.${fnRef}(${varExpr})`
  } else {
    return // unknown format — skip
  }

  ctx.emit(`if (typeof ${varExpr} === 'string' && !(${checkExpr})) {`)
  ctx.emit(`  ${errTarget}.push({ path: ${pathExpr}, code: 'format_invalid', message: 'Value does not match required format', data: { value: ${varExpr}, format: ${JSON.stringify(param)} } })`)
  ctx.emit(`}`)
}

// ── size ──────────────────────────────────────────────────────────────────────

function emitSize (ctx, varExpr, param, nodeType, pathExpr, errTarget) {
  const lenExpr = nodeType === 'object'
    ? `Object.keys(${varExpr}).length`
    : `${varExpr}.length`

  const szVar = ctx.nextId()

  ctx.emit(`{`)
  ctx.emit(`  const ${szVar} = ${lenExpr}`)

  if (typeof param === 'number') {
    ctx.emit(`  if (${szVar} !== ${param}) {`)
    ctx.emit(`    ${errTarget}.push({ path: ${pathExpr}, code: 'size_exact_invalid', message: 'Size must be exactly \`${param}\`', data: { value: ${varExpr}, size: ${szVar}, expected: ${param} } })`)
    ctx.emit(`  }`)
  } else {
    // '~' is YAML null kept as string by the inline parser — treat as unbound
    const [rawMin, rawMax] = param
    const min = (rawMin == null || rawMin === '~') ? null : rawMin
    const max = (rawMax == null || rawMax === '~') ? null : rawMax

    if (min != null) {
      ctx.emit(`  if (${szVar} < ${min}) {`)
      ctx.emit(`    ${errTarget}.push({ path: ${pathExpr}, code: 'size_min_invalid', message: 'Minimum size is \`${min}\`', data: { value: ${varExpr}, size: ${szVar}, min: ${min} } })`)
      ctx.emit(`  }`)
    }
    if (max != null) {
      ctx.emit(`  if (${szVar} > ${max}) {`)
      ctx.emit(`    ${errTarget}.push({ path: ${pathExpr}, code: 'size_max_invalid', message: 'Maximum size is \`${max}\`', data: { value: ${varExpr}, size: ${szVar}, max: ${max} } })`)
      ctx.emit(`  }`)
    }
  }

  ctx.emit(`}`)
}

// ── enum ──────────────────────────────────────────────────────────────────────

function emitEnum (ctx, varExpr, param, pathExpr, errTarget) {
  const setRef = ctx.addRef(new Set(param))
  const arrRef = ctx.addRef(param)

  ctx.emit(`if (!refs.${setRef}.has(${varExpr})) {`)
  ctx.emit(`  ${errTarget}.push({ path: ${pathExpr}, code: 'enum_invalid', message: 'Value \`' + ${varExpr} + '\` is not allowed', data: { value: ${varExpr}, enum: refs.${arrRef} } })`)
  ctx.emit(`}`)
}

// ── const ─────────────────────────────────────────────────────────────────────

function emitConst (ctx, varExpr, param, pathExpr, errTarget) {
  const cStr = JSON.stringify(param)

  ctx.emit(`if (${varExpr} !== ${cStr}) {`)
  ctx.emit(`  ${errTarget}.push({ path: ${pathExpr}, code: 'const_mismatch', message: 'Value must be \`${param}\`', data: { value: ${varExpr}, const: ${cStr} } })`)
  ctx.emit(`}`)
}

// ── numeric comparisons ───────────────────────────────────────────────────────

function emitCompare (ctx, varExpr, param, pathExpr, errTarget, failCond, code, message, dataKey) {
  ctx.emit(`if (typeof ${varExpr} === 'number' && ${varExpr} ${failCond} ${param}) {`)
  ctx.emit(`  ${errTarget}.push({ path: ${pathExpr}, code: '${code}', message: '${message} \`${param}\`', data: { value: ${varExpr}, ${dataKey}: ${param} } })`)
  ctx.emit(`}`)
}

// ── unique ────────────────────────────────────────────────────────────────────

function emitUnique (ctx, varExpr, pathExpr, errTarget) {
  const seenVar = ctx.nextId()
  const itemVar = ctx.nextId()
  const keyVar  = ctx.nextId()

  ctx.emit(`{`)
  ctx.emit(`  const ${seenVar} = new Set()`)
  ctx.emit(`  for (const ${itemVar} of ${varExpr}) {`)
  ctx.emit(`    const ${keyVar} = JSON.stringify(${itemVar})`)
  ctx.emit(`    if (${seenVar}.has(${keyVar})) {`)
  ctx.emit(`      ${errTarget}.push({ path: ${pathExpr}, code: 'unique_invalid', message: 'Array contains duplicated items' })`)
  ctx.emit(`      break`)
  ctx.emit(`    }`)
  ctx.emit(`    ${seenVar}.add(${keyVar})`)
  ctx.emit(`  }`)
  ctx.emit(`}`)
}
