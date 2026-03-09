import { code } from "../../../src/errors.js"

export const payload  = { obj: [1, 2] }
export const expected = [
  {
    path: 'obj',
    code: code.TYPE_MISMATCH,
    message: 'Unexpected type',
    data: { value: [1, 2], expected: 'Object' }
  }
]
