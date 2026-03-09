import { code } from "../../../../src/errors.js"

export const payload  = { uuid: 'not-a-uuid' }
export const expected = [
  {
    path: 'uuid',
    code: code.FORMAT_INVALID,
    message: 'Value does not match required format',
    data: {
      value: 'not-a-uuid',
      format: 'uuid'
    }
  }
]

