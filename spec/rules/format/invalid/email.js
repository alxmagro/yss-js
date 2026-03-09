import { code } from "../../../../src/errors.js"

export const payload  = { email: 'not-an-email' }
export const expected = [
  {
    path: 'email',
    code: code.FORMAT_INVALID,
    message: 'Value does not match required format',
    data: {
      value: 'not-an-email',
      format: 'email'
    }
  }
]

