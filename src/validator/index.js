import { BailSignal } from './signals.js'
import { getRule } from '../rules/scalars/index.js'
import testType from '../rules/scalars/type.js'
import testObject from '../rules/composites/object.js'
import testArray from '../rules/composites/array.js'
import testAnyOf from '../rules/composites/any_of.js'
import testOneOf from '../rules/composites/one_of.js'
import testAllOf from '../rules/composites/all_of.js'

export function validateNode (value, node, path, emit) {
  if (node.type === 'any_of') { testAnyOf(value, node, path, validateNode, emit); return }

  if (node.type === 'one_of') { testOneOf(value, node, path, validateNode, emit); return }

  if (node.type === 'all_of') { testAllOf(value, node, path, validateNode, emit); return }

  const typeError = testType(value, node.type, path)

  if (typeError) { emit({ path, ...typeError }); return }

  if (Array.isArray(value)) { testArray(value, node, path, validateNode, emit); return }

  if (typeof value === 'object' && value !== null) { testObject(value, node, path, validateNode, emit); return }

  for (const key of (node.rules ?? [])) {
    const result = getRule(key)(value, node[key], path)
    if (result) emit({ path, ...result })
  }
}

export function interpretAST (ast, { bail = false } = {}) {
  return function validate (payload) {
    const errors = []
    const emit = bail
      ? (e) => { throw new BailSignal(e) }
      : (e) => errors.push(e)

    try {
      validateNode(payload, ast, '', emit)
    } catch (e) {
      if (e instanceof BailSignal) return [e.error]
      throw e
    }

    return errors
  }
}
