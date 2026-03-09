import { code } from "../../../../../src/errors.js"

export const payload  = { user: { name: 'Luke' }, extra: true }
export const expected = [
  {
    path: 'extra',
    code: code.PROP_UNEXPECTED,
    message: 'Unexpected property `extra`'
  }
]
