import { schema } from '../../index.js'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixture = join(__dirname, '../fixtures/user.yaml')

describe('schema.fromFile', () => {
  it('returns a validate function', () => {
    const validate = schema.fromFile(fixture)
    expect(typeof validate).toBe('function')
  })

  it('validate function has assert and valid methods', () => {
    const validate = schema.fromFile(fixture)
    expect(typeof validate.assert).toBe('function')
    expect(typeof validate.valid).toBe('function')
  })

  it('throws if file does not exist', () => {
    expect(() => schema.fromFile('./nonexistent.yaml')).toThrow()
  })
})
