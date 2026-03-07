import null_ from '../../src/types/null.js'

describe('null', () => {
  test('accepts null', () => {
    expect(null_.validate(null)).toBeNull()
  })
  test('rejects undefined', () => {
    expect(null_.validate(undefined)).toMatch(/expected null/)
  })
  test('rejects 0', () => {
    expect(null_.validate(0)).toMatch(/expected null/)
  })
  test('rejects empty string', () => {
    expect(null_.validate('')).toMatch(/expected null/)
  })
  test('rejects false', () => {
    expect(null_.validate(false)).toMatch(/expected null/)
  })
  test('exposes empty rules', () => {
    expect(null_.rules).toEqual([])
  })
})
