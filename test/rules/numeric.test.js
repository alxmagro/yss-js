import gt  from '../../src/rules/gt.js'
import gte from '../../src/rules/gte.js'
import lt  from '../../src/rules/lt.js'
import lte from '../../src/rules/lte.js'

describe('gte — value >= param', () => {
  test('passes when value equals param', () => {
    expect(gte(5, 5)).toBeNull()
  })
  test('passes when value exceeds param', () => {
    expect(gte(10, 5)).toBeNull()
  })
  test('fails when value is below param', () => {
    const result = gte(3, 5)
    expect(result.code).toBe('gte_invalid')
    expect(result.message).toMatch(/expected value >= 5, got 3/)
  })
  test('works with floats', () => {
    expect(gte(0.5, 0.5)).toBeNull()
    expect(gte(0.1, 0.5)).toMatchObject({ code: 'gte_invalid' })
  })
  test('works with negatives', () => {
    expect(gte(-1, -5)).toBeNull()
    expect(gte(-10, -5)).toMatchObject({ code: 'gte_invalid' })
  })
})

describe('gt — value > param', () => {
  test('passes when value exceeds param', () => {
    expect(gt(6, 5)).toBeNull()
  })
  test('fails when value equals param', () => {
    const result = gt(5, 5)
    expect(result.code).toBe('gt_invalid')
    expect(result.message).toMatch(/expected value > 5, got 5/)
  })
  test('fails when value is below param', () => {
    expect(gt(3, 5)).toMatchObject({ code: 'gt_invalid' })
  })
  test('works with floats', () => {
    expect(gt(0.51, 0.5)).toBeNull()
    expect(gt(0.5, 0.5)).toMatchObject({ code: 'gt_invalid' })
  })
})

describe('lte — value <= param', () => {
  test('passes when value equals param', () => {
    expect(lte(5, 5)).toBeNull()
  })
  test('passes when value is below param', () => {
    expect(lte(3, 5)).toBeNull()
  })
  test('fails when value exceeds param', () => {
    const result = lte(6, 5)
    expect(result.code).toBe('lte_invalid')
    expect(result.message).toMatch(/expected value <= 5, got 6/)
  })
  test('works with floats', () => {
    expect(lte(0.5, 0.5)).toBeNull()
    expect(lte(0.6, 0.5)).toMatchObject({ code: 'lte_invalid' })
  })
})

describe('lt — value < param', () => {
  test('passes when value is below param', () => {
    expect(lt(3, 5)).toBeNull()
  })
  test('fails when value equals param', () => {
    const result = lt(5, 5)
    expect(result.code).toBe('lt_invalid')
    expect(result.message).toMatch(/expected value < 5, got 5/)
  })
  test('fails when value exceeds param', () => {
    expect(lt(6, 5)).toMatchObject({ code: 'lt_invalid' })
  })
  test('works with floats', () => {
    expect(lt(0.49, 0.5)).toBeNull()
    expect(lt(0.5, 0.5)).toMatchObject({ code: 'lt_invalid' })
  })
})
