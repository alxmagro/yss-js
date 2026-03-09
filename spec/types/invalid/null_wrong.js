import { code } from "../../../src/errors.js"

export const payload  = { null_val: 'hello' }
export const expected = [
  {
    path: 'null_val',
    code: code.TYPE_MISMATCH,
    message: 'Unexpected type',
    data: { value: 'hello', expected: 'null' }
  }
]

