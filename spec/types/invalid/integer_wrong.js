import { code } from "../../../src/errors.js"

export const payload  = { int: 3.14 }
export const expected = [
  {
    path: 'int',
    code: code.TYPE_MISMATCH,
    message: 'Unexpected type',
    data: { value: 3.14, expected: 'Integer' }
  }
]

