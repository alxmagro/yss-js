import { code } from "../../../../src/errors.js"

export const payload  = { point: [1.5] }
export const expected = [
  {
    path: 'point',
    code: code.TUPLE_LENGTH_INVALID,
    message: 'Expected tuple of length `2`, got `1`',
    data: {
      value: [1.5],
      size: 1,
      expected: 2
    }
  }
]

