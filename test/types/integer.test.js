import integer from '../../src/types/integer.js'

describe('Integer', () => {
  test('accepts zero', () => {
    expect(integer.validate(0)).toBeNull()
  })
  test('accepts a positive integer', () => {
    expect(integer.validate(42)).toBeNull()
  })
  test('accepts a negative integer', () => {
    expect(integer.validate(-7)).toBeNull()
  })
  test('rejects a float', () => {
    expect(integer.validate(3.14)).toMatch(/expected Integer/)
  })
  test('rejects a string', () => {
    expect(integer.validate('42')).toMatch(/expected Integer/)
  })
  test('rejects null', () => {
    expect(integer.validate(null)).toMatch(/expected Integer/)
  })
  test('rejects NaN', () => {
    expect(integer.validate(NaN)).toMatch(/expected Integer/)
  })
  test('exposes correct rules', () => {
    expect(integer.rules).toEqual(expect.arrayContaining(['min', 'max', 'enum', 'optional']))
  })
})