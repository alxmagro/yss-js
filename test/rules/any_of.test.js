import anyOf from '../../src/rules/any_of.js'

function node (type, extra = {}) {
  return {
    type, required: false, strict: null,
    min: null, max: null, gt: null, gte: null, lt: null, lte: null,
    format: null, enum: null, item: null, at: null, anyOf: null, fields: null,
    ...extra,
  }
}

describe('any_of', () => {
  const branches = [node('String'), node('Integer')]

  test('passes when value matches first branch', () => {
    expect(anyOf('hello', branches, 'field', false)).toEqual([])
  })

  test('passes when value matches second branch', () => {
    expect(anyOf(42, branches, 'field', false)).toEqual([])
  })

  test('fails when no branch matches', () => {
    const result = anyOf(true, branches, 'field', false)
    expect(result).toHaveLength(1)
    expect(result[0].code).toBe('anyof_invalid')
    expect(result[0].message).toBe('Value does not match any condition')
    expect(result[0].data.value).toBe(true)
    expect(result[0].data.any_of).toHaveLength(2)
  })

  test('data.any_of contains per-branch errors', () => {
    const result = anyOf(true, branches, 'field', false)
    expect(result[0].data.any_of[0]).toHaveLength(1)
    expect(result[0].data.any_of[0][0].code).toBe('type_mismatch')
    expect(result[0].data.any_of[1]).toHaveLength(1)
    expect(result[0].data.any_of[1][0].code).toBe('type_mismatch')
  })
})
