import assert from 'node:assert/strict'
import { schema, ValidationError } from 'yss'

const validate = schema.fromObject({
  name: 'string',
  age: 'integer, >= 0'
})

// valid payload
assert.deepEqual(validate({ name: 'Ana', age: 30 }), [])

// invalid payload
const errors = validate({ name: 42, age: -1 })
assert.equal(errors.length, 2)
assert.equal(errors[0].path, 'name')
assert.equal(errors[1].path, 'age')

// assert throws ValidationError
assert.throws(
  () => validate.assert({ name: 42 }),
  (e) => e instanceof ValidationError
)

// valid returns boolean
assert.equal(validate.valid({ name: 'Ana', age: 30 }), true)
assert.equal(validate.valid({ name: 42 }), false)

console.log('✓ integration tests passed')
