import { schema } from '../../../index.js'

const validate = schema.fromFile(
  new URL('./schema.yaml', import.meta.url).pathname
)

const validPayload = {
  orderId:   '550e8400-e29b-41d4-a716-446655440000',
  createdAt: '2024-05-04T12:00:00Z',
  status:    'processing',
  customer: {
    name:  'Luke Skywalker',
    email: 'luke@rebelalliance.org',
  },
  items: [
    { productId: 1, name: 'Lightsaber (blue)',  qty: 1, price: 999.99  },
    { productId: 2, name: 'Jedi Robe',          qty: 2, price: 49.90   },
    { productId: 3, name: 'Proton Torpedo x12', qty: 1, price: 1200.00 },
  ],
}

const invalidPayload = {
  orderId:   'not-a-uuid',
  createdAt: '2024-05-04T12:00:00Z',
  status:    'cancelled',
  customer: {
    name:  'L',
    email: 'luke-at-rebelalliance',
  },
  items: [],
}

describe('integration - order', () => {
  test('valid payload passes', () => {
    expect(validate(validPayload)).toEqual([])
  })

  test('invalid payload returns expected errors', () => {
    const errors = validate(invalidPayload)

    expect(errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'orderId',       code: 'match_invalid' }),
      expect.objectContaining({ path: 'status',        code: 'enum_invalid'  }),
      expect.objectContaining({ path: 'customer.name', code: 'min_invalid'   }),
      expect.objectContaining({ path: 'customer.email', code: 'match_invalid' }),
      expect.objectContaining({ path: 'items',         code: 'min_invalid'   }),
    ]))
  })
})