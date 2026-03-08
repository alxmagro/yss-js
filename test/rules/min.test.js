import min from '../../src/rules/min.js'

describe('min — String (length)', () => {
  test('passes when length equals min', () => {
    expect(min('ab', 2, '')).toBeNull()
  })
  test('passes when length exceeds min', () => {
    expect(min('hello', 2, '')).toBeNull()
  })
  test('fails when length is below min', () => {
    const result = min('a', 2, '')
    expect(result.code).toBe('min_invalid')
    expect(result.message).toMatch(/expected String length >= 2/)
  })
  test('passes on empty string with min 0', () => {
    expect(min('', 0, '')).toBeNull()
  })
})

describe('min — Array (item count)', () => {
  test('passes when count equals min', () => {
    expect(min([1, 2], 2, '')).toBeNull()
  })
  test('passes when count exceeds min', () => {
    expect(min([1, 2, 3], 2, '')).toBeNull()
  })
  test('fails when count is below min', () => {
    const result = min([1], 2, '')
    expect(result.code).toBe('min_invalid')
    expect(result.message).toMatch(/expected at least 2 items, got 1/)
  })
  test('passes empty array with min 0', () => {
    expect(min([], 0, '')).toBeNull()
  })
})

describe('min — does not apply to numbers', () => {
  test('returns null for numeric values (handled by gte/gt)', () => {
    expect(min(3, 5, '')).toBeNull()
    expect(min(10, 5, '')).toBeNull()
  })
})
