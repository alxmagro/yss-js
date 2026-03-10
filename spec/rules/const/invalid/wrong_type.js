import { code } from "../../../../src/errors.js"

export const payload  = { version: '2' }
export const expected = [
  {
    path: 'version',
    code: code.TYPE_MISMATCH,
    message: 'Unexpected type',
    data: { value: '2', expected: 'Integer' }
  }
]
