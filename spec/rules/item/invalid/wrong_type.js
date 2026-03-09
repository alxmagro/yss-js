import { code } from "../../../../src/errors.js"

export const payload  = { tags: ['jedi', 42] }
export const expected = [
  {
    path: 'tags[1]',
    code: code.TYPE_MISMATCH,
    message: 'Unexpected type',
    data: {
      value: 42,
      expected: 'String'
    }
  }
]

