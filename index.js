/**
 * YSS - YAML Simplified Schema
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

import { readFileSync }  from 'node:fs'
import { dirname }       from 'node:path'
import { load }          from 'js-yaml'
import { buildAST }      from './src/parser/index.js'
import { compileAST }    from './src/compiler/index.js'
import { validateNode }  from './src/validator/index.js'

const DEV_MODE = false

// ── ValidationError ───────────────────────────────────────────────────────────

export class ValidationError extends Error {
  constructor(errors) {
    const summary = errors.map(e => `  ${e.path || '(root)'}: ${e.message}`).join('\n')
    super(`Validation failed:\n${summary}`)
    this.name   = 'ValidationError'
    this.errors = errors
  }
}

// ── Compile a schema tree into a validate function ────────────────────────────

function compile(tree) {
  const validate = DEV_MODE
    ? (payload) => validateNode(payload, tree)
    : compileAST(tree)

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
  fromFile (path) {
    const content = readFileSync(path, 'utf8')
    const raw     = load(content)
    const tree    = buildAST(raw, dirname(path))
    return compile(tree)
  },

  fromString (yaml) {
    const raw  = load(yaml)
    const tree = buildAST(raw)
    return compile(tree)
  },

  fromObject (raw) {
    const tree = buildAST(raw)
    return compile(tree)
  },
}
