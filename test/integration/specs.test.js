import assert from 'node:assert/strict'
import { schema } from 'yss-js'
import { runSpecs } from '../../scripts/run-specs.js'

const { failed } = runSpecs({ silent: true, schema })

assert.equal(failed, 0, `${failed} spec(s) failed against the published package`)
console.log('✓ all specs passed against the published package')
