import { createRequire } from 'node:module'
import { aliases } from '../aliases.js'
import {
  fieldPathExpr, indexPathExpr, atPathExpr,
  typeMatchCond
} from './fragments.js'

const _require = createRequire(import.meta.url)
const deepEqual = _require('fast-deep-equal')

// ── Dispatcher ────────────────────────────────────────────────────────────────

export function emitNode (ctx, varExpr, node, pathExpr, errTarget = 'errors') {
  const type = node.type ?? 'any'

  if (type === 'any_of') {
    emitAnyOf(ctx, varExpr, node, pathExpr, errTarget)
    return
  }

  if (type === 'one_of') {
    emitOneOf(ctx, varExpr, node, pathExpr, errTarget)
    return
  }

  if (type === 'all_of') {
    emitAllOf(ctx, varExpr, node, pathExpr, errTarget)
    return
  }

  const isArr = type === 'array' || (type === 'any' && (node.item != null || node.at != null))
  const isObj = type === 'object' || (type === 'any' && node.fields != null)

  if (type !== 'any') {
    const cond = typeMatchCond(varExpr, type)
    const expected = JSON.stringify(Array.isArray(type) ? type : type)

    ctx.emit(`if (!(${cond})) {`)
    ctx.emit(`  ${errTarget}.push({ path: ${pathExpr}, code: 'type', message: 'Unexpected type', data: { value: ${varExpr}, expected: ${expected} } })`)
    ctx.emit('} else {')

    if (isArr) emitArrayBody(ctx, varExpr, node, pathExpr, errTarget)
    else if (isObj) emitObjectBody(ctx, varExpr, node, pathExpr, errTarget)
    else emitScalarRules(ctx, varExpr, node, pathExpr, errTarget)

    ctx.emit('}')
  } else if (isArr) {
    emitArrayBody(ctx, varExpr, node, pathExpr, errTarget)
  } else if (isObj) {
    emitObjectBody(ctx, varExpr, node, pathExpr, errTarget)
  } else {
    // any — no type check, runtime dispatch
    ctx.emit(`if (Array.isArray(${varExpr})) {`)
    emitArrayBody(ctx, varExpr, node, pathExpr, errTarget)
    ctx.emit(`} else if (typeof ${varExpr} === 'object' && ${varExpr} !== null) {`)
    emitObjectBody(ctx, varExpr, node, pathExpr, errTarget)
    ctx.emit('} else {')
    emitScalarRules(ctx, varExpr, node, pathExpr, errTarget)
    ctx.emit('}')
  }
}

// ── Object ────────────────────────────────────────────────────────────────────

function emitObjectBody (ctx, varExpr, node, pathExpr, errTarget) {
  emitScalarRules(ctx, varExpr, node, pathExpr, errTarget)

  if (!node.fields) return

  for (const [key, fieldNode] of Object.entries(node.fields)) {
    const fVar = ctx.nextId()
    const fPathStr = fieldPathExpr(pathExpr, key) // compile-time expression, not a runtime variable

    ctx.emit(`const ${fVar} = ${varExpr}[${JSON.stringify(key)}]`)
    ctx.emit(`if (${fVar} === undefined) {`)
    if (fieldNode.required) {
      ctx.emit(`  const _p = ${fPathStr}`)
      ctx.emit(`  ${errTarget}.push({ path: _p, code: 'required', message: 'Missing required property \`' + _p + '\`' })`)
    }
    ctx.emit('} else {')
    emitNode(ctx, fVar, fieldNode, fPathStr, errTarget)
    ctx.emit('}')
  }

  if (node.dependencies != null) {
    for (const [trigger, deps] of Object.entries(node.dependencies)) {
      const depsRef = ctx.addRef(deps)
      const missingVar = ctx.nextId()

      ctx.emit(`if (${varExpr}["${trigger}"] !== undefined) {`)
      ctx.emit(`  const ${missingVar} = refs.${depsRef}.filter(d => ${varExpr}[d] === undefined)`)
      ctx.emit(`  if (${missingVar}.length > 0)`)
      ctx.emit(`    ${errTarget}.push({ path: ${pathExpr}, code: 'dependencies', message: 'Value does not match all conditions', data: { trigger: "${trigger}", missing: ${missingVar} } })`)
      ctx.emit('}')
    }
  }

  if (node.strict) {
    const allowedRef = ctx.addRef(new Set(Object.keys(node.fields)))
    const kVar = ctx.nextId()
    const kPath = pathExpr === '""'
      ? kVar
      : `(${pathExpr} ? ${pathExpr} + '.' + ${kVar} : ${kVar})`

    ctx.emit(`for (const ${kVar} in ${varExpr}) {`)
    ctx.emit(`  if (!refs.${allowedRef}.has(${kVar})) {`)
    ctx.emit(`    const p = ${kPath}`)
    ctx.emit(`    ${errTarget}.push({ path: p, code: 'strict', message: 'Unexpected property \`' + p + '\`' })`)
    ctx.emit('  }')
    ctx.emit('}')
  }
}

// ── Array ─────────────────────────────────────────────────────────────────────

function emitArrayBody (ctx, varExpr, node, pathExpr, errTarget) {
  emitScalarRules(ctx, varExpr, node, pathExpr, errTarget)

  if (node.item != null) {
    const iVar = ctx.nextId()
    const elVar = ctx.nextId()

    ctx.emit(`for (let ${iVar} = 0; ${iVar} < ${varExpr}.length; ${iVar}++) {`)
    ctx.emit(`  const ${elVar} = ${varExpr}[${iVar}]`)
    // Path expression inlined — only evaluated inside error branches
    emitNode(ctx, elVar, node.item, indexPathExpr(pathExpr, iVar), errTarget)
    ctx.emit('}')
  }

  if (node.at != null) {
    for (const [pos, posNode] of Object.entries(node.at)) {
      const index = Number(pos)
      const atVar = ctx.nextId()

      ctx.emit(`if (${varExpr}.length > ${index}) {`)
      ctx.emit(`  const ${atVar} = ${varExpr}[${index}]`)
      emitNode(ctx, atVar, posNode, atPathExpr(pathExpr, index), errTarget)
      ctx.emit('}')
    }
  }

  if (node.contains != null) {
    emitContains(ctx, varExpr, node.contains, pathExpr, errTarget)
  }
}

// ── Contains ──────────────────────────────────────────────────────────────────

function emitContains (ctx, varExpr, contains, pathExpr, errTarget) {
  const { item, quantity } = contains
  const isExact = typeof quantity === 'number'
  const min = isExact ? null : quantity[0]
  const max = isExact ? null : quantity[1]
  const quantityJson = JSON.stringify(quantity)

  const iVar = ctx.nextId()
  const elVar = ctx.nextId()
  const beVar = ctx.nextId()
  const countVar = ctx.nextId()

  ctx.emit(`let ${countVar} = 0`)
  ctx.emit(`for (let ${iVar} = 0; ${iVar} < ${varExpr}.length; ${iVar}++) {`)
  ctx.emit(`  const ${elVar} = ${varExpr}[${iVar}]`)
  ctx.emit(`  const ${beVar} = []`)
  emitNode(ctx, elVar, item, indexPathExpr(pathExpr, iVar), beVar)
  ctx.emit(`  if (${beVar}.length === 0) {`)
  ctx.emit(`    ${countVar}++`)
  if (isExact) ctx.emit(`    if (${countVar} > ${quantity}) break`)
  else if (max != null) ctx.emit(`    if (${countVar} > ${max}) break`)
  else if (min != null) ctx.emit(`    if (${countVar} >= ${min}) break`)
  ctx.emit('  }')
  ctx.emit('}')

  if (isExact) {
    const msg = quantity === 0
      ? 'Array must not contain any matching items'
      : `Array must contain exactly \`${quantity}\` matching items`
    ctx.emit(`if (${countVar} !== ${quantity}) {`)
    ctx.emit(`  ${errTarget}.push({ path: ${pathExpr}, code: 'contains_exact', message: '${msg}', data: { quantity: ${quantityJson} } })`)
    ctx.emit('}')
  } else {
    if (max != null) {
      ctx.emit(`if (${countVar} > ${max}) {`)
      ctx.emit(`  ${errTarget}.push({ path: ${pathExpr}, code: 'contains_max', message: 'Array must contain at most \`${max}\` matching items', data: { quantity: ${quantityJson} } })`)
      ctx.emit('}')
    }
    if (min != null) {
      const minMsg = min === 1 ? 'Array must contain at least one matching item' : `Array must contain at least \`${min}\` matching items`
      const keyword = max != null ? 'else if' : 'if'
      ctx.emit(`${keyword} (${countVar} < ${min}) {`)
      ctx.emit(`  ${errTarget}.push({ path: ${pathExpr}, code: 'contains_min', message: '${minMsg}', data: { quantity: ${quantityJson} } })`)
      ctx.emit('}')
    }
  }
}

// ── AllOf ─────────────────────────────────────────────────────────────────────

function emitAllOf (ctx, varExpr, node, pathExpr, errTarget) {
  const emitBranches = () => {
    const doneVar = ctx.nextId()
    ctx.emit(`let ${doneVar} = false`)

    for (let i = 0; i < node.items.length; i++) {
      const beVar = ctx.nextId()
      ctx.emit(`if (!${doneVar}) {`)
      ctx.emit(`  const ${beVar} = []`)
      emitNode(ctx, varExpr, node.items[i], pathExpr, beVar)
      ctx.emit(`  if (${beVar}.length > 0) {`)
      ctx.emit(`    ${errTarget}.push({ path: ${pathExpr}, code: 'all_of', message: 'Value does not match all conditions', data: { failed_at: ${i} } })`)
      ctx.emit(`    ${doneVar} = true`)
      ctx.emit('  }')
      ctx.emit('}')
    }
  }

  if (node.baseType != null) {
    const cond = typeMatchCond(varExpr, node.baseType)
    const expected = JSON.stringify(node.baseType)
    ctx.emit(`if (!(${cond})) {`)
    ctx.emit(`  ${errTarget}.push({ path: ${pathExpr}, code: 'type', message: 'Unexpected type', data: { value: ${varExpr}, expected: ${expected} } })`)
    ctx.emit('} else {')
    emitBranches()
    ctx.emit('}')
  } else {
    emitBranches()
  }
}

// ── AnyOf ─────────────────────────────────────────────────────────────────────

function emitOneOf (ctx, varExpr, node, pathExpr, errTarget) {
  const countVar = ctx.nextId()
  const firstMatchVar = ctx.nextId()
  const secondMatchVar = ctx.nextId()

  ctx.emit(`let ${countVar} = 0`)
  ctx.emit(`let ${firstMatchVar} = -1`)
  ctx.emit(`let ${secondMatchVar} = -1`)

  for (let i = 0; i < node.items.length; i++) {
    const beVar = ctx.nextId()
    ctx.emit(`if (${countVar} < 2) {`)
    ctx.emit(`  const ${beVar} = []`)
    emitNode(ctx, varExpr, node.items[i], pathExpr, beVar)
    ctx.emit(`  if (${beVar}.length === 0) {`)
    ctx.emit(`    if (${countVar}++ === 0) ${firstMatchVar} = ${i}; else ${secondMatchVar} = ${i}`)
    ctx.emit('  }')
    ctx.emit('}')
  }

  ctx.emit(`if (${countVar} === 0) {`)
  ctx.emit(`  ${errTarget}.push({ path: ${pathExpr}, code: 'one_of', message: 'Value does not match any condition' })`)
  ctx.emit(`} else if (${countVar} > 1) {`)
  ctx.emit(`  ${errTarget}.push({ path: ${pathExpr}, code: 'one_of_multiple', message: 'Value matches more than one condition', data: { matches_at: [${firstMatchVar}, ${secondMatchVar}] } })`)
  ctx.emit('}')
}

function emitAnyOf (ctx, varExpr, node, pathExpr, errTarget) {
  const matchedVar = ctx.nextId()

  ctx.emit(`let ${matchedVar} = false`)

  for (const branch of node.items) {
    const beVar = ctx.nextId()
    ctx.emit(`if (!${matchedVar}) {`)
    ctx.emit(`  const ${beVar} = []`)
    emitNode(ctx, varExpr, branch, pathExpr, beVar)
    ctx.emit(`  if (${beVar}.length === 0) { ${matchedVar} = true }`)
    ctx.emit('}')
  }

  ctx.emit(`if (!${matchedVar}) {`)
  ctx.emit(`  ${errTarget}.push({ path: ${pathExpr}, code: 'any_of', message: 'Value does not match any condition' })`)
  ctx.emit('}')
}

// ── Scalar rules ──────────────────────────────────────────────────────────────

function emitScalarRules (ctx, varExpr, node, pathExpr, errTarget) {
  if (!node.rules || node.rules.length === 0) return
  for (const key of node.rules) { emitScalarRule(ctx, key, varExpr, node[key], node.type, pathExpr, errTarget) }
}

function emitScalarRule (ctx, rule, varExpr, param, nodeType, pathExpr, errTarget) {
  switch (rule) {
    case 'format': return emitFormat(ctx, varExpr, param, pathExpr, errTarget)
    case 'size': return emitSize(ctx, varExpr, param, nodeType, pathExpr, errTarget)
    case 'in': return emitIn(ctx, varExpr, param, pathExpr, errTarget)
    case 'not_in': return emitNotIn(ctx, varExpr, param, pathExpr, errTarget)
    case 'multiple_of': return emitMultipleOf(ctx, varExpr, param, pathExpr, errTarget)
    case 'const': return emitConst(ctx, varExpr, param, pathExpr, errTarget)
    case 'gt': return emitCompare(ctx, varExpr, param, pathExpr, errTarget, '<=', 'gt', 'Value must be greater than', 'gt')
    case 'gte': return emitCompare(ctx, varExpr, param, pathExpr, errTarget, '<', 'gte', 'Value must be greater than or equal to', 'gte')
    case 'lt': return emitCompare(ctx, varExpr, param, pathExpr, errTarget, '>=', 'lt', 'Value must be less than', 'lt')
    case 'lte': return emitCompare(ctx, varExpr, param, pathExpr, errTarget, '>', 'lte', 'Value must be less than or equal to', 'lte')
    case 'unique': return emitUnique(ctx, varExpr, pathExpr, errTarget)
  }
}

// ── format ────────────────────────────────────────────────────────────────────

function emitFormat (ctx, varExpr, param, pathExpr, errTarget) {
  let checkExpr

  if (param.startsWith('/')) {
    const lastSlash = param.lastIndexOf('/')
    const source = param.slice(1, lastSlash)
    const flags = param.slice(lastSlash + 1)
    const regexRef = ctx.addRef(new RegExp(source, flags))
    checkExpr = `refs.${regexRef}.test(${varExpr})`
  } else {
    const fnRef = ctx.addRef(aliases[param])
    checkExpr = `refs.${fnRef}(${varExpr})`
  }

  ctx.emit(`if (typeof ${varExpr} === 'string' && !(${checkExpr})) {`)
  ctx.emit(`  ${errTarget}.push({ path: ${pathExpr}, code: 'format', message: 'Value does not match required format', data: { value: ${varExpr}, format: ${JSON.stringify(param)} } })`)
  ctx.emit('}')
}

// ── size ──────────────────────────────────────────────────────────────────────

function emitSize (ctx, varExpr, param, nodeType, pathExpr, errTarget) {
  const lenExpr = nodeType === 'object'
    ? `Object.keys(${varExpr}).length`
    : `${varExpr}.length`

  const szVar = ctx.nextId()

  const needsTypeGuard = nodeType !== 'string' && nodeType !== 'array' && nodeType !== 'object'
  if (needsTypeGuard) ctx.emit(`if (typeof ${varExpr} === 'string' || Array.isArray(${varExpr}) || (typeof ${varExpr} === 'object' && ${varExpr} !== null)) {`)
  ctx.emit('{')
  ctx.emit(`  const ${szVar} = ${lenExpr}`)

  if (typeof param === 'number') {
    ctx.emit(`  if (${szVar} !== ${param}) {`)
    ctx.emit(`    ${errTarget}.push({ path: ${pathExpr}, code: 'size_exact', message: 'Size must be exactly \`${param}\`', data: { value: ${varExpr}, size: ${szVar}, expected: ${param} } })`)
    ctx.emit('  }')
  } else {
    // '~' is YAML null kept as string by the inline parser — treat as unbound
    const [rawMin, rawMax] = param
    const min = (rawMin == null || rawMin === '~') ? null : rawMin
    const max = (rawMax == null || rawMax === '~') ? null : rawMax

    if (min != null) {
      ctx.emit(`  if (${szVar} < ${min}) {`)
      ctx.emit(`    ${errTarget}.push({ path: ${pathExpr}, code: 'size_min', message: 'Minimum size is \`${min}\`', data: { value: ${varExpr}, size: ${szVar}, min: ${min} } })`)
      ctx.emit('  }')
    }
    if (max != null) {
      ctx.emit(`  if (${szVar} > ${max}) {`)
      ctx.emit(`    ${errTarget}.push({ path: ${pathExpr}, code: 'size_max', message: 'Maximum size is \`${max}\`', data: { value: ${varExpr}, size: ${szVar}, max: ${max} } })`)
      ctx.emit('  }')
    }
  }

  ctx.emit('}')
  if (needsTypeGuard) ctx.emit('}')
}

// ── multiple_of ───────────────────────────────────────────────────────────────

function emitMultipleOf (ctx, varExpr, param, pathExpr, errTarget) {
  ctx.emit(`if (typeof ${varExpr} === 'number') {`)
  ctx.emit(`  const _q = ${varExpr} / ${param}`)
  ctx.emit('  if (Math.abs(Math.round(_q) - _q) > 1e-10) {')
  ctx.emit(`    ${errTarget}.push({ path: ${pathExpr}, code: 'multiple_of', message: 'Value must be a multiple of \`${param}\`', data: { value: ${varExpr}, multiple_of: ${param} } })`)
  ctx.emit('  }')
  ctx.emit('}')
}

// ── in / not_in ───────────────────────────────────────────────────────────────

function emitIn (ctx, varExpr, param, pathExpr, errTarget) {
  const setRef = ctx.addRef(new Set(param))
  const arrRef = ctx.addRef(param)

  ctx.emit(`if (!refs.${setRef}.has(${varExpr})) {`)
  ctx.emit(`  ${errTarget}.push({ path: ${pathExpr}, code: 'in', message: 'Value \`' + ${varExpr} + '\` is not allowed', data: { value: ${varExpr}, in: refs.${arrRef} } })`)
  ctx.emit('}')
}

function emitNotIn (ctx, varExpr, param, pathExpr, errTarget) {
  const setRef = ctx.addRef(new Set(param))
  const arrRef = ctx.addRef(param)

  ctx.emit(`if (refs.${setRef}.has(${varExpr})) {`)
  ctx.emit(`  ${errTarget}.push({ path: ${pathExpr}, code: 'not_in', message: 'Value is not allowed', data: { value: ${varExpr}, not_in: refs.${arrRef} } })`)
  ctx.emit('}')
}

// ── const ─────────────────────────────────────────────────────────────────────

function emitConst (ctx, varExpr, param, pathExpr, errTarget) {
  const cStr = JSON.stringify(param)

  ctx.emit(`if (${varExpr} !== ${cStr}) {`)
  ctx.emit(`  ${errTarget}.push({ path: ${pathExpr}, code: 'const', message: 'Value must be \`${param}\`', data: { value: ${varExpr}, const: ${cStr} } })`)
  ctx.emit('}')
}

// ── numeric comparisons ───────────────────────────────────────────────────────

function emitCompare (ctx, varExpr, param, pathExpr, errTarget, failCond, code, message, dataKey) {
  ctx.emit(`if (typeof ${varExpr} === 'number' && ${varExpr} ${failCond} ${param}) {`)
  ctx.emit(`  ${errTarget}.push({ path: ${pathExpr}, code: '${code}', message: '${message} \`${param}\`', data: { value: ${varExpr}, ${dataKey}: ${param} } })`)
  ctx.emit('}')
}

// ── unique ────────────────────────────────────────────────────────────────────

function emitUnique (ctx, varExpr, pathExpr, errTarget) {
  const eqRef = ctx.addRef(deepEqual)
  const iVar = ctx.nextId()
  const jVar = ctx.nextId()
  const doneVar = ctx.nextId()

  ctx.emit(`let ${doneVar} = false`)
  ctx.emit(`for (let ${iVar} = 0; ${iVar} < ${varExpr}.length - 1 && !${doneVar}; ${iVar}++) {`)
  ctx.emit(`  for (let ${jVar} = ${iVar} + 1; ${jVar} < ${varExpr}.length; ${jVar}++) {`)
  ctx.emit(`    if (refs.${eqRef}(${varExpr}[${iVar}], ${varExpr}[${jVar}])) {`)
  ctx.emit(`      ${errTarget}.push({ path: ${pathExpr}, code: 'unique', message: 'Array contains duplicated items' })`)
  ctx.emit(`      ${doneVar} = true; break`)
  ctx.emit('    }')
  ctx.emit('  }')
  ctx.emit('}')
}
