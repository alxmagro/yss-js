import object from '../../src/types/object.js'

describe('Object', () => {
  test('accepts a plain object', () => {
    expect(object.validate({ a: 1 })).toBeNull()
  })
  test('accepts an empty object', () => {
    expect(object.validate({})).toBeNull()
  })
  test('rejects null', () => {
    expect(object.validate(null)).toMatch(/expected Object/)
  })
  test('rejects an array', () => {
    expect(object.validate([1, 2])).toMatch(/expected Object/)
  })
  test('rejects a string', () => {
    expect(object.validate('hello')).toMatch(/expected Object/)
  })
  test('rejects a number', () => {
    expect(object.validate(42)).toMatch(/expected Object/)
  })
  test('exposes correct rules', () => {
    expect(object.rules).toContain('optional')
  })
})
