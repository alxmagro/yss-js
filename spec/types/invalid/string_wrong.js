import { code } from "../../../src/errors.js"

export const payload  = { str: 42 }
export const expected = [
  {
    path: 'str',
    code: code.TYPE_MISMATCH,
    message: 'Unexpected type',
    data: { value: 42, expected: 'String' }
  }
]

