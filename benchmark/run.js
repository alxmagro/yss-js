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

const GOAL = 1.5  // yss must be no more than 1.5x slower than ajv

function bench(name, fn, iterations = 100_000) {
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

const ratio = ((ajvValid + ajvInvalid) / (yssValid + yssInvalid)).toFixed(2)
const met    = ratio <= GOAL
const status = met ? '\x1b[32m✓ goal met\x1b[0m' : '\x1b[31m✗ not yet\x1b[0m'
console.log('\n── summary ──────────────────────────────────────────────────')
console.log(`  goal          ${GOAL}x slower than ajv`)
console.log(`  ajv / yss     ${ratio}x   ${status}`)
console.log()
