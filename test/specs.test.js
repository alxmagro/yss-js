import { runSpecs } from '../scripts/run-specs.js'

it('all specs pass (compiled)', () => {
  const { failed } = runSpecs({ silent: true })
  expect(failed).toBe(0)
})

it('all specs pass (interpreted)', () => {
  const { failed } = runSpecs({ silent: true, interpreted: true })
  expect(failed).toBe(0)
})
