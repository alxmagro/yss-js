import { schema } from '../../index.js'

describe('schema.fromObject', () => {
  it('returns a validate function', () => {
    const validate = schema.fromObject({ name: 'string' })
    expect(typeof validate).toBe('function')
  })

  it('validate function has assert and valid methods', () => {
    const validate = schema.fromObject({ name: 'string' })
    expect(typeof validate.assert).toBe('function')
    expect(typeof validate.valid).toBe('function')
  })
})
