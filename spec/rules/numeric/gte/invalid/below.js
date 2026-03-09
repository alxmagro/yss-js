import { code } from "../../../../../src/errors.js"

export const payload  = { age: 17 }
export const expected = [
  {
    path: 'age',
    code: code.GTE_INVALID,
    message: 'Value must be greater than or equal to `18`',
    data: {
      value: 17,
      gte: 18
    }
  }
]

