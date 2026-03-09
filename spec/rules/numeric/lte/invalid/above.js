import { code } from "../../../../../src/errors.js"

export const payload  = { age: 101 }
export const expected = [
  {
    path: 'age',
    code: code.LTE_INVALID,
    message: 'Value must be less than or equal to `100`',
    data: {
      value: 101,
      lte: 100
    }
  }
]

