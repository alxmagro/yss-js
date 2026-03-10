import { code } from "../../../../src/errors.js"

export const payload  = { role: 'user' }
export const expected = [
  {
    path: 'role',
    code: code.CONST_MISMATCH,
    message: 'Value must be `admin`',
    data: { value: 'user', const: 'admin' }
  }
]

