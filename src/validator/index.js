import { getRule }  from '../rules/scalars/index.js'
import testType     from '../rules/scalars/type.js'
import testObject   from '../rules/composites/object.js'
import testArray    from '../rules/composites/array.js'
import testAnyOf    from '../rules/composites/any_of.js'
import testOneOf    from '../rules/composites/one_of.js'
import testAllOf    from '../rules/composites/all_of.js'

export function validateNode (value, node, path = '') {
  if (node.type === 'any_of')
    return testAnyOf(value, node, path, validateNode)

  if (node.type === 'one_of')
    return testOneOf(value, node, path, validateNode)

  if (node.type === 'all_of')
    return testAllOf(value, node, path, validateNode)

  const typeError = testType(value, node.type, path)

  if (typeError) return [{ path, ...typeError }]

  if (Array.isArray(value))
    return testArray(value, node, path, validateNode)

  if (typeof value === 'object' && value !== null)
    return testObject(value, node, path, validateNode)

  const errors = []

  for (const key of (node.rules ?? [])) {
    const rule = getRule(key)
    if (!rule) continue
    const result = rule(value, node[key], path)
    if (result) errors.push({ path, ...result })
  }
  return errors
}
