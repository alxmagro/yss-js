import { code } from "../../../src/errors.js"

export const payload  = { bool: 1 }
export const expected = [
  {
    path: 'bool',
    code: code.TYPE_MISMATCH,
    message: 'Unexpected type',
    data: { value: 1, expected: 'Boolean' }
  }
]

