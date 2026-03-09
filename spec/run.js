import { readdirSync, statSync } from 'node:fs'
import { join, dirname }         from 'node:path'
import { fileURLToPath }         from 'node:url'
import { schema }                from '../index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const c = {
  green:  s => `\x1b[32m${s}\x1b[0m`,
  red:    s => `\x1b[31m${s}\x1b[0m`,
  gray:   s => `\x1b[90m${s}\x1b[0m`,
}

let passed = 0
let failed = 0
let skipped = 0

function findCases (dir) {
  const cases = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      cases.push(...findCases(full))
    } else if (entry.endsWith('.js')) {
      cases.push(full)
    }
  }
  return cases
}

function findSchema (casePath) {
  let dir = dirname(casePath)
  while (dir !== __dirname) {
    const candidate = join(dir, 'schema.yaml')
    try {
      statSync(candidate)
      return candidate
    } catch {}
    dir = dirname(dir)
  }
  return null
}

function deepEqual (a, b) {
  if (a === b) return true
  if (a === null || b === null) return a === b
  if (typeof a !== typeof b) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false

  if (Array.isArray(a)) {
    if (a.length !== b.length) return false
    return a.every((item, i) => deepEqual(item, b[i]))
  }

  if (typeof a === 'object') {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    if (keysA.length !== keysB.length) return false
    return keysA.every(k => deepEqual(a[k], b[k]))
  }

  return false
}

function diff (actual, expected) {
  if (!deepEqual(actual, expected)) {
    return `expected ${JSON.stringify(expected, null, 2)}\n         got     ${JSON.stringify(actual, null, 2)}`
  }
  return null
}

const cases = findCases(__dirname).filter(f => !f.endsWith('run.js'))

for (const casePath of cases) {
  const rel = casePath.replace(__dirname + '/', '')
  const schemaPath = findSchema(casePath)

  if (!schemaPath) {
    console.log(c.gray(`·  SKIP   ${rel} — no schema.yaml found`))
    skipped++
    continue
  }

  const mod = await import(casePath)

  if (mod.expected === null) {
    console.log(c.gray(`·  TODO   ${rel}`))
    skipped++
    continue
  }

  const payloads = mod.payloads
    ? mod.payloads.map((p, i) => ({ payload: p, index: i }))
    : [{ payload: mod.payload, index: null }]

  try {
    const validate = schema.fromFile(schemaPath)
    let allPassed = true

    for (const { payload, index } of payloads) {
      const actual = validate(payload)
      const error  = diff(actual, mod.expected)
      const label  = index !== null ? `${rel} [${index}]` : rel

      if (error) {
        console.log(c.red(`✗  FAIL   ${label}`))
        console.log(c.red(`         ${error}`))
        failed++
        allPassed = false
      } else {
        console.log(c.green(`✓  PASS   ${label}`))
        passed++
      }
    }
  } catch (err) {
    console.log(c.red(`✗  ERROR  ${rel}`))
    console.log(c.red(`          ${err.message}`))
    failed++
  }
}

console.log()
console.log(`${c.green(passed + ' passed')}, ${c.red(failed + ' failed')}, ${c.gray(skipped + ' skipped')}`)
if (failed > 0) process.exit(1)
