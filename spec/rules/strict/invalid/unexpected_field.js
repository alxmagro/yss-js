import { code } from "../../../../src/errors.js"

export const payload  = { name: 'Luke', email: 'luke@jedi.org', age: 19 }
export const expected = [
  {
    path: 'age',
    code: code.PROP_UNEXPECTED,
    message: 'Unexpected property `age`'
  }
]

