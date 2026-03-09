import { code } from "../../../../../src/errors.js"

export const payload  = { user: { name: 'Luke', age: 19 } }
export const expected = [
  {
    path: 'user.age',
    code: code.PROP_UNEXPECTED,
    message: 'Unexpected property `user.age`'
  }
]

