import { code } from "../../../../src/errors.js"

export const payload  = { tags: ['invalid', 'other'] }
export const expected = [
  {
    path: 'tags[0]',
    code: code.ENUM_INVALID,
    message: 'Value `invalid` is not allowed',
    data: {
      value: 'invalid',
      expected: ['featured', 'pinned']
    }
  }
]
