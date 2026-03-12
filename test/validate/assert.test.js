import { schema, ValidationError } from '../../index.js'

const validate = schema.fromObject({ name: 'string' })

describe('validate.assert', () => {
  it('does not throw for valid payload', () => {
    expect(() => validate.assert({ name: 'Ana' })).not.toThrow()
  })

  it('throws ValidationError for invalid payload', () => {
    expect(() => validate.assert({ name: 42 })).toThrow(ValidationError)
  })

  it('thrown error has errors array', () => {
    try {
      validate.assert({ name: 42 })
    } catch (e) {
      expect(Array.isArray(e.errors)).toBe(true)
      expect(e.errors.length).toBeGreaterThan(0)
    }
  })

  it('thrown error has descriptive message', () => {
    try {
      validate.assert({ name: 42 })
    } catch (e) {
      expect(e.message).toContain('Validation failed')
    }
  })
})
