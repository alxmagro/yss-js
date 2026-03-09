import { code } from "../../../../src/errors.js"

export const payload  = { tags: [] }
export const expected = [
  {
    path: 'tags',
    code: code.MIN_INVALID,
    message: 'Minimum size is `1`',
    data: {
      value: [],
      size: 0,
      min: 1
    }
  }
]
