import max from '../../src/rules/max.js'

describe('max — String (length)', () => {
  test('passes when length equals max', () => {
    expect(max('ab', 2, '')).toBeNull()
  })
  test('passes when length is below max', () => {
    expect(max('a', 2, '')).toBeNull()
  })
  test('fails when length exceeds max', () => {
    const result = max('hello', 2, '')
    expect(result.code).toBe('max_invalid')
    expect(result.message).toMatch(/expected String length <= 2/)
  })
})

describe('max — Array (item count)', () => {
  test('passes when count equals max', () => {
    expect(max([1, 2], 2, '')).toBeNull()
  })
  test('passes when count is below max', () => {
    expect(max([1], 2, '')).toBeNull()
  })
  test('fails when count exceeds max', () => {
    const result = max([1, 2, 3], 2, '')
    expect(result.code).toBe('max_invalid')
    expect(result.message).toMatch(/expected at most 2 items, got 3/)
  })
})

describe('max — does not apply to numbers', () => {
  test('returns null for numeric values (handled by lte/lt)', () => {
    expect(max(10, 5, '')).toBeNull()
    expect(max(3, 5, '')).toBeNull()
  })
})
