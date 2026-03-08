import list from '../../src/types/list.js'

describe('List', () => {
  test('accepts an empty array', () => {
    expect(list.validate([])).toBeNull()
  })
  test('accepts an array with items', () => {
    expect(list.validate([1, 2, 3])).toBeNull()
  })
  test('accepts an array with duplicates', () => {
    expect(list.validate([1, 1, 2])).toBeNull()
  })
  test('rejects an object', () => {
    expect(list.validate({})).toMatch(/expected List/)
  })
  test('rejects a string', () => {
    expect(list.validate('hello')).toMatch(/expected List/)
  })
  test('rejects null', () => {
    expect(list.validate(null)).toMatch(/expected List/)
  })
  test('exposes correct rules', () => {
    expect(list.rules).toEqual(expect.arrayContaining(['min', 'max', 'item', 'at', 'required']))
  })
})
