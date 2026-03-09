import { code } from "../../../../src/errors.js"

export const payload  = { name: 'Lukes!' }
export const expected = [
  {
    path: 'name',
    code: code.MAX_INVALID,
    message: 'Maximum size is `5`',
    data: {
      value: 'Lukes!',
      size: 6,
      max: 5
    }
  }
]

