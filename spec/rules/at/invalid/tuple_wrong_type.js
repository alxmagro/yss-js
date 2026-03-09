import { code } from "../../../../src/errors.js"

export const payload  = { point: ['x', 2.5] }
export const expected = [
  {
    path: 'point[0]',
    code: code.TYPE_MISMATCH,
    message: 'Unexpected type',
    data: {
      value: 'x',
      expected: 'Float'
    }
  }
]

