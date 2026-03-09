import { code } from "../../../../src/errors.js"

export const payload  = { date: '15/01/2024' }
export const expected = [
  {
    path: 'date',
    code: code.FORMAT_INVALID,
    message: 'Value does not match required format',
    data: {
      value: '15/01/2024',
      format: 'date'
    }
  }
]
