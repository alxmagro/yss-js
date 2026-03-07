import values from '../../src/rules/values.js'

describe('values', () => {
  test('passes when value is in the list', () => {
    expect(values('active', ['active', 'inactive'], '')).toBeNull()
  })
  test('passes for the last item in list', () => {
    expect(values('inactive', ['active', 'inactive'], '')).toBeNull()
  })
  test('fails when value is not in the list', () => {
    const result = values('banned', ['active', 'inactive'], '')
    expect(result.code).toBe('enum_invalid')
    expect(result.message).toMatch(/expected one of/)
  })
  test('works with integers', () => {
    expect(values(1, [1, 2, 3], '')).toBeNull()
    const result = values(5, [1, 2, 3], '')
    expect(result.code).toBe('enum_invalid')
  })
  test('includes the invalid value in the error message', () => {
    const result = values('nope', ['a', 'b'], '')
    expect(result.message).toMatch(/"nope"/)
  })
  test('includes allowed values in the error message', () => {
    const result = values('nope', ['a', 'b'], '')
    expect(result.message).toMatch(/a\|b/)
  })
})