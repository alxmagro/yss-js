import { schema, ValidationError } from '../../index.js'

const validate = schema.fromObject({ name: 'string', age: 'integer' })

describe('ValidationError', () => {
  let error

  beforeAll(() => {
    try {
      validate.assert({ name: 42, age: 'old' })
    } catch (e) {
      error = e
    }
  })

  it('is an instance of ValidationError', () => {
    expect(error).toBeInstanceOf(ValidationError)
  })

  it('has name ValidationError', () => {
    expect(error.name).toBe('ValidationError')
  })

  it('has errors array with one entry per invalid field', () => {
    expect(Array.isArray(error.errors)).toBe(true)
    expect(error.errors.length).toBe(2)
  })

  it('message includes Validation failed', () => {
    expect(error.message).toContain('Validation failed')
  })

  it('message includes field paths', () => {
    expect(error.message).toContain('name')
    expect(error.message).toContain('age')
  })
})
