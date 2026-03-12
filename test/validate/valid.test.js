import { schema } from '../../index.js'

const validate = schema.fromObject({ name: 'string' })

describe('validate.valid', () => {
  it('returns true for valid payload', () => {
    expect(validate.valid({ name: 'Ana' })).toBe(true)
  })

  it('returns false for invalid payload', () => {
    expect(validate.valid({ name: 42 })).toBe(false)
  })
})
