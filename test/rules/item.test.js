import item from '../../src/rules/item.js'

const stringNode  = { type: 'String',  required: true, rules: {} }
const integerNode = { type: 'Integer', required: true, rules: {} }

describe('item', () => {
  test('passes when all items match the schema', () => {
    expect(item(['a', 'b', 'c'], stringNode, 'tags')).toEqual([])
  })
  test('passes on empty array', () => {
    expect(item([], stringNode, 'tags')).toEqual([])
  })
  test('fails when one item does not match', () => {
    const errors = item(['a', 42, 'c'], stringNode, 'tags')
    expect(errors).toHaveLength(1)
    expect(errors[0].path).toBe('tags[1]')
    expect(errors[0].message).toMatch(/Unexpected type/)
  })
  test('fails when multiple items do not match', () => {
    expect(item([1, 2, 3], stringNode, 'tags')).toHaveLength(3)
  })
  test('uses correct bracket path', () => {
    const errors = item([1], stringNode, 'list')
    expect(errors[0].path).toBe('list[0]')
  })
  test('works with integer schema', () => {
    expect(item([1, 2, 3], integerNode, 'ids')).toEqual([])
    const errors = item([1, 'two', 3], integerNode, 'ids')
    expect(errors).toHaveLength(1)
    expect(errors[0].path).toBe('ids[1]')
  })
})
