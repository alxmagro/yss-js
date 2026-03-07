import { schema } from '../../../index.js'

const validate = schema.fromFile(
  new URL('./schema.yaml', import.meta.url).pathname
)

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
  transactionId: 'kessel-run-12-parsecs',
  method:        'bitcoin',
  amount:        0,
  installments:  13,
  card: {
    holder: 'H',
    last4:  'ABCD',
    expiry: [13, 2027],
  },
  billedTo: 'B',
}

describe('integration - payment', () => {
  test('valid payload passes', () => {
    expect(validate(validPayload)).toEqual([])
  })

  test('invalid payload returns expected errors', () => {
    const errors = validate(invalidPayload)

    expect(errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'transactionId', code: 'match_invalid' }),
      expect.objectContaining({ path: 'method',        code: 'enum_invalid'  }),
      expect.objectContaining({ path: 'amount',        code: 'min_invalid'   }),
      expect.objectContaining({ path: 'installments',  code: 'max_invalid'   }),
      expect.objectContaining({ path: 'card.holder',   code: 'min_invalid'   }),
      expect.objectContaining({ path: 'card.last4',    code: 'match_invalid' }),
      expect.objectContaining({ path: 'card.expiry[0]', code: 'max_invalid'  }),
      expect.objectContaining({ path: 'billedTo',      code: 'min_invalid'   }),
    ]))
  })
})