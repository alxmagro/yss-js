import { code } from "../../../../../src/errors.js"

export const payload  = { score: 1.5 }
export const expected = [
  {
    path: 'score',
    code: code.LT_INVALID,
    message: 'Value must be less than `1`',
    data: {
      value: 1.5,
      lt: 1
    }
  }
]
