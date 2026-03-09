import { code } from "../../../../../src/errors.js"

export const payload  = { score: -1 }
export const expected = [
  {
    path: 'score',
    code: code.GT_INVALID,
    message: 'Value must be greater than `0`',
    data: {
      value: -1,
      gt: 0
    }
  }
]

