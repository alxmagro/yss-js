import tuple from '../../src/types/tuple.js'

describe('Tuple', () => {
  test('accepts an array', () => {
    expect(tuple.validate([1, 'two', true])).toBeNull()
  })
  test('accepts an empty array', () => {
    expect(tuple.validate([])).toBeNull()
  })
  test('rejects an object', () => {
    expect(tuple.validate({})).toMatch(/expected Tuple/)
  })
  test('rejects a string', () => {
    expect(tuple.validate('hello')).toMatch(/expected Tuple/)
  })
  test('rejects null', () => {
    expect(tuple.validate(null)).toMatch(/expected Tuple/)
  })
  test('exposes correct rules', () => {
    expect(tuple.rules).toEqual(expect.arrayContaining(['at', 'required']))
  })
})
