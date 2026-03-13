import { schema }        from '../index.js'
import Ajv               from 'ajv'
import addFormats        from 'ajv-formats'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require   = createRequire(import.meta.url)

// ── Payloads ──────────────────────────────────────────────────────────────────

const validPayload = {
  id:       42,
  username: 'john_doe',
  email:    'john@example.com',
  role:     'editor',
  score:    87.5,
  level:    7,
  active:   true,
  version:  1,
  address: {
    street:  '221B Baker Street',
    city:    'London',
    country: 'GB',
    zip:     '12345',
  },
  tags: ['typescript', 'node', 'yaml'],
  permissions: [
    { resource: 'posts',    actions: ['create', 'read', 'update'] },
    { resource: 'comments', actions: ['read', 'delete'] },
  ],
  contact: { phone: '+44 20 7946 0958' },
}

const invalidPayload = {
  id:       -1,
  username: 'jo',
  email:    'not-an-email',
  role:     'superuser',
  score:    150,
  level:    200,
  active:   'yes',
  version:  2,
  address: {
    street:  '',
    country: 'BRA',
    zip:     '00000',
  },
  tags: ['a', 'a'],
  permissions: [
    { resource: 'posts', actions: ['publish'] },
  ],
  contact: { phone: 'abc' },
}

// ── YSS ───────────────────────────────────────────────────────────────────────

const yss = schema.fromFile(join(__dirname, 'schema.yaml'))

// ── Ajv ───────────────────────────────────────────────────────────────────────

const ajvSchema   = require('./schema.json')
const ajv         = new Ajv({ allErrors: true })
addFormats(ajv)

const ajvValidate = ajv.compile(ajvSchema)

// ── Benchmark ─────────────────────────────────────────────────────────────────

const GOAL       = 1.5
const ITERATIONS = Number(process.argv[2]?.replace(/_/g, '')) || 100_000

function bench(name, fn, iterations = ITERATIONS) {
  for (let i = 0; i < 1000; i++) fn()

  const start = performance.now()
  for (let i = 0; i < iterations; i++) fn()
  const elapsed = performance.now() - start

  const opsPerSec = Math.round(iterations / (elapsed / 1000))
  const us = (elapsed / iterations * 1000).toFixed(3)
  console.log(`  ${name.padEnd(6)} ${opsPerSec.toLocaleString().padStart(12)} ops/sec   (${us} µs/op)`)
  return opsPerSec
}

console.log('\n── valid payload ────────────────────────────────────────────')
const yssValid = bench('yss', () => yss(validPayload))
const ajvValid = bench('ajv', () => ajvValidate(validPayload))

console.log('\n── invalid payload ──────────────────────────────────────────')
const yssInvalid = bench('yss', () => yss(invalidPayload))
const ajvInvalid = bench('ajv', () => ajvValidate(invalidPayload))

const yssTotal = yssValid + yssInvalid
const ajvTotal = ajvValid + ajvInvalid
const pct      = (((yssTotal - ajvTotal) / ajvTotal) * 100).toFixed(1)
const faster   = yssTotal >= ajvTotal
const metGoal  = (ajvTotal / yssTotal) <= GOAL
const status   = metGoal ? '\x1b[32m✓ goal met\x1b[0m' : '\x1b[31m✗ not yet\x1b[0m'
const diff     = faster
  ? `\x1b[32myss is ${pct}% faster than ajv\x1b[0m`
  : `\x1b[33myss is ${Math.abs(pct)}% slower than ajv\x1b[0m`
console.log('\n── summary ──────────────────────────────────────────────────')
console.log(`  ${diff}   ${status}`)
console.log()
