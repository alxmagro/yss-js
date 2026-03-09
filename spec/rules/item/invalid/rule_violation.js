import { code } from "../../../../src/errors.js"

export const payload  = { scores: [10, -1, 20] }
export const expected = [
  {
    path: 'scores[1]',
    code: code.GTE_INVALID,
    message: 'Value must be greater than or equal to `0`',
    data: {
      value: -1,
      gte: 0
    }
  }
]
