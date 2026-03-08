import at from '../../src/rules/at.js'

const floatNode   = { type: 'Float',   required: true, rules: {} }
const stringNode  = { type: 'String',  required: true, rules: {} }
const integerNode = { type: 'Integer', required: true, rules: {} }

describe('at - Tuple (strict length)', () => {
  const positions = { 0: floatNode, 1: floatNode }

  test('passes with correct length and types', () => {
    expect(at([1.5, 2.5], positions, 'point', 'Tuple')).toEqual([])
  })
  test('fails when array is too short', () => {
    const errors = at([1.5], positions, 'point', 'Tuple')
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toMatch(/expected Tuple of length 2, got 1/)
  })
  test('fails when array is too long', () => {
    const errors = at([1.5, 2.5, 3.5], positions, 'point', 'Tuple')
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toMatch(/expected Tuple of length 2, got 3/)
  })
  test('fails when a position has wrong type', () => {
    const errors = at(['not-a-float', 2.5], positions, 'point', 'Tuple')
    expect(errors).toHaveLength(1)
    expect(errors[0].path).toBe('point[0]')
  })
  test('uses correct bracket path for each position', () => {
    const errors = at([1.5, 'bad'], positions, 'coord', 'Tuple')
    expect(errors[0].path).toBe('coord[1]')
  })
  test('passes empty tuple with no declared positions', () => {
    expect(at([], {}, 'empty', 'Tuple')).toEqual([])
  })
})

describe('at - List (positional, non-strict)', () => {
  const positions = { 0: stringNode, 1: integerNode }

  test('passes when declared positions match their types', () => {
    expect(at(['hello', 42], positions, 'tokens', 'List')).toEqual([])
  })
  test('passes when extra items exist beyond declared positions', () => {
    expect(at(['hello', 42, 999, 'anything'], positions, 'tokens', 'List')).toEqual([])
  })
  test('fails when a declared position has wrong type', () => {
    const errors = at([42, 42], positions, 'tokens', 'List')
    expect(errors[0].path).toBe('tokens[0]')
    expect(errors[0].message).toMatch(/got/)
  })
  test('fails when list is shorter than a declared position', () => {
    const errors = at(['hello'], positions, 'tokens', 'List')
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toMatch(/position 1 is required/)
  })
  test('passes empty list with no declared positions', () => {
    expect(at([], {}, 'tokens', 'List')).toEqual([])
  })
})
