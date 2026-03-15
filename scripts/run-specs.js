/**
 * YSS spec runner — language-agnostic YAML specs
 *
 * Usage:
 *   node scripts/run-specs.js
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { load } from 'js-yaml'
import { schema } from '../index.js'

const __dirname = join(dirname(fileURLToPath(import.meta.url)), '../specs')

const c = {
  green: s => `\x1b[32m${s}\x1b[0m`,
  red: s => `\x1b[31m${s}\x1b[0m`,
  gray: s => `\x1b[90m${s}\x1b[0m`
}

const codes = load(readFileSync(join(__dirname, 'codes.yaml'), 'utf8'))

function resolveTemplates (value) {
  if (typeof value === 'string') {
    return value.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
      if (!(key in codes)) throw new Error(`Unknown template: {{ ${key} }}`)
      return codes[key]
    })
  }
  if (Array.isArray(value)) return value.map(resolveTemplates)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveTemplates(v)]))
  }
  return value
}

function findSpecs (dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (entry === 'run.js' || entry === 'codes.yaml') continue
    if (statSync(full).isDirectory()) files.push(...findSpecs(full))
    else if (entry.endsWith('.yaml')) files.push(full)
  }
  return files
}

function deepEqual (a, b) {
  if (a === b) return true
  if (a === null || b === null) return false
  if (typeof a !== typeof b) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false
    return a.every((item, i) => deepEqual(item, b[i]))
  }
  if (typeof a === 'object') {
    const ka = Object.keys(a); const kb = Object.keys(b)
    if (ka.length !== kb.length) return false
    return ka.every(k => deepEqual(a[k], b[k]))
  }
  return false
}

let passed = 0; let failed = 0; let skipped = 0

function runCase (label, validate, when, then) {
  if (then === null || then === undefined) {
    console.log(c.gray(`·  TODO   ${label}`))
    skipped++
    return
  }

  try {
    const payloads = Array.isArray(when) ? when : [when]
    const expected = resolveTemplates(then)

    for (let i = 0; i < payloads.length; i++) {
      const actual = validate(payloads[i])
      const caseLabel = payloads.length > 1 ? `${label} [${i}]` : label

      if (deepEqual(actual, expected)) {
        console.log(c.green(`✓  PASS   ${caseLabel}`))
        passed++
      } else {
        console.log(c.red(`✗  FAIL   ${caseLabel}`))
        console.log(c.red(`          expected ${JSON.stringify(expected)}`))
        console.log(c.red(`          got      ${JSON.stringify(actual)}`))
        failed++
      }
    }
  } catch (err) {
    console.log(c.red(`✗  ERROR  ${label}`))
    console.log(c.red(`          ${err.message}`))
    failed++
  }
}

const filter = process.argv[2]

function matchesFilter (path) {
  return !filter || path.includes(filter)
}

// ── rules (scalars / composites) ─────────────────────────────────────────────

const specFiles = findSpecs(join(__dirname, 'rules'))
  .filter(matchesFilter)

for (const file of specFiles) {
  const rel = file.replace(__dirname + '/', '')
  const spec = load(readFileSync(file, 'utf8'))

  const validate = schema.fromObject(spec.given)

  for (const scenario of (spec.scenarios ?? [])) {
    const label = `${rel} › ${scenario.name ?? '?'}`
    runCase(label, validate, scenario.when, scenario.then)
  }
}

// ── integration ───────────────────────────────────────────────────────────────

const parserSpecFiles = findSpecs(join(__dirname, 'integration'))
  .filter(f => f.endsWith('/spec.yaml'))
  .filter(matchesFilter)

for (const file of parserSpecFiles) {
  const rel = file.replace(__dirname + '/', '')
  const spec = load(readFileSync(file, 'utf8'))
  const validate = schema.fromFile(join(dirname(file), 'schema.yaml'))

  for (const scenario of (spec.scenarios ?? [])) {
    const label = `${rel} › ${scenario.name ?? '?'}`
    runCase(label, validate, scenario.when, scenario.then)
  }
}

console.log()
console.log(`${c.green(passed + ' passed')}, ${c.red(failed + ' failed')}, ${c.gray(skipped + ' skipped')}`)
if (failed > 0) process.exit(1)
