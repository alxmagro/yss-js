import any from '../../src/types/any.js'

describe('any', () => {
  test('accepts a string', () => {
    expect(any.validate('hello')).toBeNull()
  })

  test('accepts an integer', () => {
    expect(any.validate(42)).toBeNull()
  })

  test('accepts a float', () => {
    expect(any.validate(3.14)).toBeNull()
  })

  test('accepts a boolean', () => {
    expect(any.validate(true)).toBeNull()
  })

  test('accepts null', () => {
    expect(any.validate(null)).toBeNull()
  })

  test('accepts an object', () => {
    expect(any.validate({ foo: 'bar' })).toBeNull()
  })

  test('accepts an array', () => {
    expect(any.validate([1, 2, 3])).toBeNull()
  })

  test('has no rules', () => {
    expect(any.rules).toEqual([])
  })
})
