import max from '../../src/rules/max.js'

describe('max — String (length)', () => {
  test('passes when length equals max', () => {
    expect(max('ab', 2)).toBeNull()
  })
  test('passes when length is below max', () => {
    expect(max('a', 2)).toBeNull()
  })
  test('fails when length exceeds max', () => {
    const result = max('abc', 2)
    expect(result.code).toBe('max_invalid')
    expect(result.message).toMatch(/Maximum size is/)
    expect(result.data.size).toBe(3)
    expect(result.data.max).toBe(2)
  })
})

describe('max — Array (item count)', () => {
  test('passes when count equals max', () => {
    expect(max(['a', 'b'], 2)).toBeNull()
  })
  test('passes when count is below max', () => {
    expect(max(['a'], 2)).toBeNull()
  })
  test('fails when count exceeds max', () => {
    const result = max(['a', 'b', 'c'], 2)
    expect(result.code).toBe('max_invalid')
    expect(result.message).toMatch(/Maximum size is/)
    expect(result.data.size).toBe(3)
    expect(result.data.max).toBe(2)
  })
})
