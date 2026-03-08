import set_ from '../../src/types/set.js'

describe('Set', () => {
  test('accepts an empty array', () => {
    expect(set_.validate([])).toBeNull()
  })
  test('accepts an array without duplicates', () => {
    expect(set_.validate([1, 2, 3])).toBeNull()
  })
  test('rejects an object', () => {
    expect(set_.validate({})).toMatch(/expected Set/)
  })
  test('rejects a string', () => {
    expect(set_.validate('hello')).toMatch(/expected Set/)
  })
  test('rejects null', () => {
    expect(set_.validate(null)).toMatch(/expected Set/)
  })
  test('exposes correct rules', () => {
    expect(set_.rules).toEqual(expect.arrayContaining(['min', 'max', 'item', 'required']))
  })
})
