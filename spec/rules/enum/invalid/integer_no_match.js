import { code } from "../../../../src/errors.js"

export const payload  = { priority: 5 }
export const expected = [
  {
    path: 'priority',
    code: code.ENUM_INVALID,
    message: 'Value `5` is not allowed',
    data: {
      value: 5,
      expected: [1, 2, 3]
    }
  }
]
