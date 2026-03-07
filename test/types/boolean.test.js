import boolean_ from '../../src/types/boolean.js'

describe('Boolean', () => {
  test('accepts true', () => {
    expect(boolean_.validate(true)).toBeNull()
  })
  test('accepts false', () => {
    expect(boolean_.validate(false)).toBeNull()
  })
  test('rejects a string', () => {
    expect(boolean_.validate('true')).toMatch(/expected Boolean/)
  })
  test('rejects 1', () => {
    expect(boolean_.validate(1)).toMatch(/expected Boolean/)
  })
  test('rejects 0', () => {
    expect(boolean_.validate(0)).toMatch(/expected Boolean/)
  })
  test('rejects null', () => {
    expect(boolean_.validate(null)).toMatch(/expected Boolean/)
  })
  test('exposes correct rules', () => {
    expect(boolean_.rules).toContain('optional')
  })
})
