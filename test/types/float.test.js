import float from '../../src/types/float.js'

describe('Float', () => {
  test('accepts an integer (integers are valid floats)', () => {
    expect(float.validate(1)).toBeNull()
  })
  test('accepts a decimal', () => {
    expect(float.validate(3.14)).toBeNull()
  })
  test('accepts zero', () => {
    expect(float.validate(0)).toBeNull()
  })
  test('accepts a negative float', () => {
    expect(float.validate(-0.5)).toBeNull()
  })
  test('rejects a string', () => {
    expect(float.validate('3.14')).toMatch(/expected Float/)
  })
  test('rejects null', () => {
    expect(float.validate(null)).toMatch(/expected Float/)
  })
  test('rejects NaN', () => {
    expect(float.validate(NaN)).toMatch(/expected Float/)
  })
  test('exposes correct rules', () => {
    expect(float.rules).toEqual(expect.arrayContaining(['gt', 'gte', 'lt', 'lte', 'enum', 'optional']))
  })
})
