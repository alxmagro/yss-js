import { schema }        from '../index.js'
import Ajv               from 'ajv'
import addFormats        from 'ajv-formats'
import { readdirSync }   from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require   = createRequire(import.meta.url)
const ajv       = new Ajv({ allErrors: true })
addFormats(ajv)

// ── Payloads per case ─────────────────────────────────────────────────────────

const payloads = {
  'scalars': {
    valid:   { name: 'Alice', email: 'alice@example.com', age: 30, score: 87.5, role: 'admin',   active: true,  env: 'production', status: 'active',    quantity: 25 },
    invalid: { name: 'A',     email: 'not-an-email',      age: 15, score: 200,  role: 'unknown', active: 'yes', env: 'staging',    status: 'suspended', quantity: 7  },
  },
  'deep-object': {
    valid:   { user: { profile: { name: 'Alice', bio: 'Hello world' }, settings: { theme: 'dark',  lang: 'en' } } },
    invalid: { user: { profile: { name: 42,      bio: 'x'.repeat(600) }, settings: { theme: 'blue', lang: 99 }, extra: true } },
  },
  'array': {
    valid:   { items: [{ id: 1, name: 'Widget', price: 9.99 }, { id: 2, name: 'Gadget', price: 24.99 }] },
    invalid: { items: [{ id: -1, name: '', price: -5 }, { id: 'x', name: 'x'.repeat(60), price: 'free' }] },
  },
  'all-of': {
    valid:   { product: { name: 'Wireless Headphones', price: 49.99, sku: 'WH-1000X', stock: 42, category: 'electronics', active: true } },
    invalid: { product: { name: 'X', price: -5, sku: 'WH', stock: -1, category: 'gadgets', active: 'yes' } },
  },
  'any-of': {
    valid:   { contact: { phone: '+44791123456' } },
    invalid: { contact: { phone: 'x', email: 'bad', handle: { platform: 'facebook', username: '' } } },
  },
  'contains': {
    valid: { roster: [
      { name: 'Alice',   role: 'captain' },
      { name: 'Bob',     role: 'crew' },
      { name: 'Carol',   role: 'crew' },
      { name: 'Dave',    role: 'crew' },
      { name: 'Eve',     role: 'crew' },
    ]},
    invalid: { roster: [
      { name: 'Alice',   role: 'crew' },
      { name: 'Bob',     role: 'crew' },
      { name: 'Carol',   role: 'crew' },
      { name: 'Dave',    role: 'crew' },
      { name: 'Eve',     role: 'crew' },
    ]},
  },
  'one-of': {
    valid:   { shipment: { delivery: { address: '1977 Tatooine Ave, Mos Eisley', carrier: 'Falcon Cargo', status: 'pending' } } },
    invalid: { shipment: { delivery: { address: '1977 Tatooine Ave, Mos Eisley' }, pickup: { location: 'Mos Eisley Cantina' } } },
  },
  'unique': {
    valid: { items: [
      { id: 1, name: 'Alpha',   category: 'a', active: true,  score: 80 },
      { id: 2, name: 'Beta',    category: 'b', active: false, score: 60 },
      { id: 3, name: 'Gamma',   category: 'c', active: true,  score: 90 },
      { id: 4, name: 'Delta',   category: 'd', active: false, score: 45 },
      { id: 5, name: 'Epsilon', category: 'a', active: true,  score: 72 },
    ]},
    invalid: { items: [
      { id: 1, name: 'Alpha',   category: 'a', active: true,  score: 80 },
      { id: 2, name: 'Beta',    category: 'b', active: false, score: 60 },
      { id: 3, name: 'Gamma',   category: 'c', active: true,  score: 90 },
      { id: 4, name: 'Delta',   category: 'd', active: false, score: 45 },
      { id: 1, name: 'Alpha',   category: 'a', active: true,  score: 80 },
    ]},
  },
}

// ── Bench helper ──────────────────────────────────────────────────────────────

function bench (fn, iterations = 200_000) {
  for (let i = 0; i < 2000; i++) fn()
  const start = performance.now()
  for (let i = 0; i < iterations; i++) fn()
  return Math.round(iterations / ((performance.now() - start) / 1000))
}

// ── Runner ────────────────────────────────────────────────────────────────────

const R = '\x1b[0m'
const G = '\x1b[32m'
const Y = '\x1b[33m'

function row (label, yss, ajvOps) {
  const ratio = (ajvOps / yss).toFixed(2)
  const color = yss >= ajvOps ? G : Y
  console.log(`    ${label.padEnd(9)} yss ${String(yss.toLocaleString()).padStart(13)}   ajv ${String(ajvOps.toLocaleString()).padStart(13)}   ${color}${ratio}x${R}`)
}

const casesDir = join(__dirname, 'isolated')
const cases    = readdirSync(casesDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort()

console.log('\n── isolated benchmarks ──────────────────────────────────────────')

for (const name of cases) {
  const dir        = join(casesDir, name)
  const yssSchema  = schema.fromFile(join(dir, 'schema.yaml'))
  const jsonSchema = require(join(dir, 'schema.json'))
  const ajvSchema  = ajv.compile(jsonSchema)
  const { valid, invalid } = payloads[name] ?? {}

  if (!valid || !invalid) {
    console.log(`\n  ${name}  (no payloads — skipping)`)
    continue
  }

  console.log(`\n  ${name}`)
  row('valid',   bench(() => yssSchema(valid)),   bench(() => ajvSchema(valid)))
  row('invalid', bench(() => yssSchema(invalid)), bench(() => ajvSchema(invalid)))
}

console.log()
