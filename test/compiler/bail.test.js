import { schema } from '../../index.js'

const validate = schema.fromObject(
  { name: 'string', age: 'integer', email: 'string' },
  { bail: true }
)

describe('bail option', () => {
  it('returns only the first error', () => {
    const errors = validate({ name: 42, age: 'old', email: 123 })
    expect(errors.length).toBe(1)
  })

  it('returns no errors for valid payload', () => {
    const errors = validate({ name: 'Ana', age: 30, email: 'a@b.com' })
    expect(errors.length).toBe(0)
  })

  it('without bail returns all errors', () => {
    const validateAll = schema.fromObject({ name: 'string', age: 'integer', email: 'string' })
    const errors = validateAll({ name: 42, age: 'old', email: 123 })
    expect(errors.length).toBe(3)
  })
})
