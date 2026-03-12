import { schema } from '../../index.js'

describe('schema.fromString', () => {
  it('returns a validate function', () => {
    const validate = schema.fromString('name: string')
    expect(typeof validate).toBe('function')
  })

  it('validate function has assert and valid methods', () => {
    const validate = schema.fromString('name: string')
    expect(typeof validate.assert).toBe('function')
    expect(typeof validate.valid).toBe('function')
  })

  it('throws on invalid YAML', () => {
    expect(() => schema.fromString('{ invalid: yaml: here')).toThrow()
  })
})
