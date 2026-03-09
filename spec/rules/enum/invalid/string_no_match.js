import { code } from "../../../../src/errors.js"

export const payload  = { status: 'cancelled' }
export const expected = [
  {
    path: 'status',
    code: code.ENUM_INVALID,
    message: 'Value `cancelled` is not allowed',
    data: {
      value: 'cancelled',
      expected: ['pending', 'processing', 'shipped']
    }
  }
]

