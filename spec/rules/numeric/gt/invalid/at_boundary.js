import { code } from "../../../../../src/errors.js"

export const payload  = { score: 0 }
export const expected = [
  {
    path: 'score',
    code: code.GT_INVALID,
    message: 'Value must be greater than `0`',
    data: {
      value: 0,
      gt: 0
    }
  }
]

