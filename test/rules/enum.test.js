import enumRule from '../../src/rules/enum.js'

describe('enum', () => {
  test('passes when value is in the list', () => {
    expect(enumRule('active', ['active', 'inactive'], '')).toBeNull()
  })
  test('passes for the last item in list', () => {
    expect(enumRule('inactive', ['active', 'inactive'], '')).toBeNull()
  })
  test('fails when value is not in the list', () => {
    const result = enumRule('banned', ['active', 'inactive'], '')
    expect(result.code).toBe('enum_invalid')
    expect(result.message).toMatch(/is not allowed/)
  })
  test('works with integers', () => {
    expect(enumRule(1, [1, 2, 3], '')).toBeNull()
    const result = enumRule(5, [1, 2, 3], '')
    expect(result.code).toBe('enum_invalid')
  })
  test('includes the invalid value in the error message', () => {
    const result = enumRule('nope', ['a', 'b'], '')
    expect(result.message).toMatch(/nope/)
  })
  test('includes allowed values in data.expected', () => {
    const result = enumRule('nope', ['a', 'b'], '')
    expect(result.data.expected).toEqual(['a', 'b'])
  })
})
