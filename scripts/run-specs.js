/**
 * YSS spec runner — language-agnostic YAML specs
 *
 * Usage:
 *   node scripts/run-specs.js [filter]
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { load } from 'js-yaml'
import { schema } from '../index.js'

const specsDir = join(dirname(fileURLToPath(import.meta.url)), '../specs')

const c = {
  green: s => `\x1b[32m${s}\x1b[0m`,
  red: s => `\x1b[31m${s}\x1b[0m`,
  gray: s => `\x1b[90m${s}\x1b[0m`
}

const codes = load(readFileSync(join(specsDir, 'codes.yaml'), 'utf8'))

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

export function runSpecs ({ filter, silent = false, interpreted = false } = {}) {
  let passed = 0; let failed = 0; let skipped = 0
  const log = silent ? () => {} : console.log

  function runCase (label, validate, when, then) {
    if (then === null || then === undefined) {
      log(c.gray(`·  TODO   ${label}`))
      skipped++
      return
    }

    try {
      const actual = validate(when)
      const expected = resolveTemplates(then)

      if (deepEqual(actual, expected)) {
        log(c.green(`✓  PASS   ${label}`))
        passed++
      } else {
        log(c.red(`✗  FAIL   ${label}`))
        log(c.red(`          expected ${JSON.stringify(expected)}`))
        log(c.red(`          got      ${JSON.stringify(actual)}`))
        failed++
      }
    } catch (err) {
      log(c.red(`✗  ERROR  ${label}`))
      log(c.red(`          ${err.message}`))
      failed++
    }
  }

  function runThrowsCase (label, given, thenThrows, schemaFile) {
    if (thenThrows === null || thenThrows === undefined) {
      log(c.gray(`·  TODO   ${label}`))
      skipped++
      return
    }

    try {
      if (schemaFile) schema.fromFile(schemaFile, { interpreted })
      else schema.fromObject(given, { interpreted })
      log(c.red(`✗  FAIL   ${label}`))
      log(c.red(`          expected to throw: ${thenThrows}`))
      log(c.red('          but did not throw'))
      failed++
    } catch (err) {
      if (err.message === thenThrows) {
        log(c.green(`✓  PASS   ${label}`))
        passed++
      } else {
        log(c.red(`✗  FAIL   ${label}`))
        log(c.red(`          expected throw: ${thenThrows}`))
        log(c.red(`          got throw:      ${err.message}`))
        failed++
      }
    }
  }

  function matchesFilter (path) {
    return !filter || path.includes(filter)
  }

  // ── rules (scalars / composites) and parser ──────────────────────────────────

  const ruleDirs = [join(specsDir, 'rules'), join(specsDir, 'parser')]

  for (const file of ruleDirs.flatMap(d => findSpecs(d)).filter(matchesFilter)) {
    const rel = file.replace(specsDir + '/', '')
    const spec = load(readFileSync(file, 'utf8'))
    const validate = spec.given !== undefined ? schema.fromObject(spec.given, { interpreted }) : null

    for (const scenario of (spec.scenarios ?? [])) {
      const label = `${rel} › ${scenario.name ?? '?'}`
      if ('then_throws' in scenario) {
        runThrowsCase(label, scenario.given ?? spec.given, scenario.then_throws)
      } else {
        const v = scenario.given !== undefined ? schema.fromObject(scenario.given, { interpreted }) : validate
        runCase(label, v, scenario.when, scenario.then)
      }
    }
  }

  // ── integration ───────────────────────────────────────────────────────────────

  for (const file of findSpecs(join(specsDir, 'integration')).filter(f => f.endsWith('/spec.yaml')).filter(matchesFilter)) {
    const rel = file.replace(specsDir + '/', '')
    const spec = load(readFileSync(file, 'utf8'))
    const schemaFile = join(dirname(file), 'schema.yaml')

    if (spec.throws !== undefined) {
      runThrowsCase(rel, null, spec.throws, schemaFile)
      continue
    }

    const validate = schema.fromFile(schemaFile, { interpreted })

    for (const scenario of (spec.scenarios ?? [])) {
      runCase(`${rel} › ${scenario.name ?? '?'}`, validate, scenario.when, scenario.then)
    }
  }

  return { passed, failed, skipped }
}

// ── CLI ───────────────────────────────────────────────────────────────────────

const isCLI = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]

if (isCLI) {
  const { passed, failed, skipped } = runSpecs({ filter: process.argv[2] })

  console.log()
  console.log(`${c.green(passed + ' passed')}, ${c.red(failed + ' failed')}, ${c.gray(skipped + ' skipped')}`)
  if (failed > 0) process.exit(1)
}
