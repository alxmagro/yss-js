import { schema } from '../../index.js'

const validate = schema.fromObject({
  name:  'string, size [2, 80]',
  email: 'string, ~ email',
})

describe('validate', () => {
  it('returns empty array for valid payload', () => {
    expect(validate({ name: 'Ana', email: 'ana@example.com' })).toEqual([])
  })

  it('returns error objects for invalid payload', () => {
    const errors = validate({ name: 'A', email: 'not-an-email' })
    expect(errors.length).toBe(2)
  })

  it('each error has path, code, message, data', () => {
    const [error] = validate({ name: 'A', email: 'ana@example.com' })
    expect(error).toHaveProperty('path')
    expect(error).toHaveProperty('code')
    expect(error).toHaveProperty('message')
    expect(error).toHaveProperty('data')
  })

  it('error path points to the invalid field', () => {
    const [error] = validate({ name: 'A', email: 'ana@example.com' })
    expect(error.path).toBe('name')
  })
})
