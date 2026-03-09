import min from '../../src/rules/min.js'

describe('min — String (length)', () => {
  test('passes when length equals min', () => {
    expect(min('ab', 2)).toBeNull()
  })
  test('passes when length exceeds min', () => {
    expect(min('abc', 2)).toBeNull()
  })
  test('fails when length is below min', () => {
    const result = min('a', 2)
    expect(result.code).toBe('min_invalid')
    expect(result.message).toMatch(/Minimum size is/)
    expect(result.data.size).toBe(1)
    expect(result.data.min).toBe(2)
  })
})

describe('min — Array (item count)', () => {
  test('passes when count equals min', () => {
    expect(min(['a', 'b'], 2)).toBeNull()
  })
  test('passes when count exceeds min', () => {
    expect(min(['a', 'b', 'c'], 2)).toBeNull()
  })
  test('fails when count is below min', () => {
    const result = min(['a'], 2)
    expect(result.code).toBe('min_invalid')
    expect(result.message).toMatch(/Minimum size is/)
    expect(result.data.size).toBe(1)
    expect(result.data.min).toBe(2)
  })
})
