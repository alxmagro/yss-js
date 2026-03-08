import string from '../../src/types/string.js'

describe('String', () => {
  test('accepts a string', () => {
    expect(string.validate('hello')).toBeNull()
  })
  test('accepts an empty string', () => {
    expect(string.validate('')).toBeNull()
  })
  test('rejects a number', () => {
    expect(string.validate(42)).toMatch(/expected String/)
  })
  test('rejects null', () => {
    expect(string.validate(null)).toMatch(/expected String/)
  })
  test('rejects a boolean', () => {
    expect(string.validate(true)).toMatch(/expected String/)
  })
  test('rejects an array', () => {
    expect(string.validate([])).toMatch(/expected String/)
  })
  test('rejects an object', () => {
    expect(string.validate({})).toMatch(/expected String/)
  })
  test('exposes correct rules', () => {
    expect(string.rules).toEqual(expect.arrayContaining(['min', 'max', 'match', 'enum', 'required']))
  })
})
