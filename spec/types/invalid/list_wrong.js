import { code } from "../../../src/errors.js"

export const payload  = { list: 'hello' }
export const expected = [
  {
    path: 'list',
    code: code.TYPE_MISMATCH,
    message: 'Unexpected type',
    data: { value: 'hello', expected: 'List' }
  }
]

