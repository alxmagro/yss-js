import { code } from "../../../src/errors.js"

export const payload  = { float: 'hello' }
export const expected = [
  {
    path: 'float',
    code: code.TYPE_MISMATCH,
    message: 'Unexpected type',
    data: { value: 'hello', expected: 'Float' }
  }
]

