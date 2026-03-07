import max from '../../src/rules/max.js'

describe('max — String (length)', () => {
  test('passes when length equals max', () => {
    expect(max('hello', 5, '')).toBeNull()
  })
  test('passes when length is below max', () => {
    expect(max('hi', 5, '')).toBeNull()
  })
  test('fails when length exceeds max', () => {
    const result = max('toolong', 5, '')
    expect(result.code).toBe('max_invalid')
    expect(result.message).toMatch(/expected String length <= 5/)
  })
  test('passes empty string with max 0', () => {
    expect(max('', 0, '')).toBeNull()
  })
})

describe('max — Integer / Float (value)', () => {
  test('passes when value equals max', () => {
    expect(max(5, 5, '')).toBeNull()
  })
  test('passes when value is below max', () => {
    expect(max(3, 5, '')).toBeNull()
  })
  test('fails when value exceeds max', () => {
    const result = max(10, 5, '')
    expect(result.code).toBe('max_invalid')
    expect(result.message).toMatch(/expected value <= 5/)
  })
  test('passes negative values correctly', () => {
    expect(max(-5, -1, '')).toBeNull()
    const result = max(-1, -5, '')
    expect(result.code).toBe('max_invalid')
    expect(result.message).toMatch(/expected value <= -5/)
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