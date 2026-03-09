import { code } from "../../../../src/errors.js"

export const payload  = { name: 'L' }
export const expected = [
  {
    path: 'name',
    code: code.MIN_INVALID,
    message: 'Minimum size is `2`',
    data: {
      value: 'L',
      size: 1,
      min: 2
    }
  }
]

