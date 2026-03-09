import { code } from "../../../../src/errors.js"

export const payload  = {}
export const expected = [
  {
    path: 'name',
    code: code.PROP_REQUIRED,
    message: 'Missing required property `name`'
  },
  {
    path: 'email',
    code: code.PROP_REQUIRED,
    message: 'Missing required property `email`'
  }
]
