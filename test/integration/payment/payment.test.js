import path from 'path'
import { fileURLToPath } from 'url'
import { schema } from '../../../index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const validate = schema.fromFile(path.join(__dirname, 'schema.yaml'))

const validPayload = {
  transactionId: 'c0ffee00-dead-beef-cafe-000000000042',
  method:        'credits',
  amount:        3720.50,
  installments:  6,
  card: {
    holder: 'Han Solo',
    last4:  '7749',
    expiry: [5, 2027],
  },
  billedTo: 'Millennium Falcon LLC',
}

const invalidPayload = {
  transactionId: 'kessel-run-12-parsecs',   // invalid uuid
  method:        'bitcoin',                 // not in allowed values
  amount:        0,                         // below min 0.01
  installments:  13,                        // exceeds max 12
  card: {
    holder: 'H',                            // too short (min 2)
    last4:  'ABCD',                         // does not match /^[0-9]{4}$/
    expiry: [13, 2027],                     // month 13 exceeds max 12
  },
  billedTo: 'B',                            // too short (min 2)
}

describe('integration - payment', () => {
  test('valid payload passes', () => {
    expect(validate(validPayload)).toEqual([])
  })

  test('card accepts null (no card payment)', () => {
    const payload = {
      ...validPayload,
      method: 'hutt_coin',
      card:   null,
    }
    expect(validate(payload)).toEqual([])
  })

  test('installments is optional', () => {
    const { installments, ...withoutInstallments } = validPayload
    expect(validate(withoutInstallments)).toEqual([])
  })

  test('expiry tuple must have exactly 2 positions', () => {
    const errors = validate({
      ...validPayload,
      card: { ...validPayload.card, expiry: [5] },
    })
    expect(errors.some(e => e.path === 'card.expiry')).toBe(true)
  })

  test('invalid payload returns expected errors', () => {
    const errors = validate(invalidPayload)
    const paths = errors.map(e => e.path)
    expect(paths).toContain('transactionId')
    expect(paths).toContain('method')
    expect(paths).toContain('amount')
    expect(paths).toContain('installments')
    expect(paths).toContain('card.holder')
    expect(paths).toContain('card.last4')
    expect(paths).toContain('billedTo')
  })

  test('past year on expiry is rejected', () => {
    const errors = validate({
      ...validPayload,
      card: { ...validPayload.card, expiry: [1, 2020] },
    })
    expect(errors.some(e => e.path === 'card.expiry[1]')).toBe(true)
  })
})
