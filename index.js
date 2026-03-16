/**
 * YSS - YAML Schema Syntax
 *
 * Public API:
 *
 *   import { schema } from 'yss'
 *
 *   const validate = schema.fromFile('./order.yaml')
 *   const validate = schema.fromString(`name: String{2,80}`)
 *
 *   const errors = validate(payload)      // -> [{ path, message }] or []
 *   validate.assert(payload)              // -> throws ValidationError if invalid
 *   validate.valid(payload)               // -> boolean
 */

import { readFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { load } from 'js-yaml'
import { buildAST, assertIntegrity } from './src/parser/index.js'
import { compileAST } from './src/compiler/index.js'
import { interpretAST } from './src/validator/index.js'
import { ValidationError } from './src/validator/errors.js'

export { ValidationError }

// ── Compile a schema tree into a validate function ────────────────────────────

function compile (tree, { interpreted = false, bail = false } = {}) {
  assertIntegrity(tree)

  const validate = interpreted
    ? interpretAST(tree, { bail })
    : compileAST(tree, { bail })

  validate.assert = function (payload) {
    const errors = validate(payload)
    if (errors.length > 0) throw new ValidationError(errors)
  }

  validate.valid = function (payload) {
    return validate(payload).length === 0
  }

  return validate
}

// ── Public API ────────────────────────────────────────────────────────────────

export const schema = {
  /**
   * Load and compile a schema from a YAML file.
   * @param {string} path - path to the .yaml file
   * @returns {Function} validate(payload) -> errors[]
   */
  fromFile (path, options) {
    const content = readFileSync(path, 'utf8')
    const raw = load(content)
    const tree = buildAST(raw, dirname(path))
    return compile(tree, options)
  },

  fromString (yaml, options) {
    const raw = load(yaml)
    const tree = buildAST(raw)
    return compile(tree, options)
  },

  fromObject (raw, options) {
    const tree = buildAST(raw)
    return compile(tree, options)
  }
}
