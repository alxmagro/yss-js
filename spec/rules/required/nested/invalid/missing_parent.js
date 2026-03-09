import { code } from "../../../../../src/errors.js"

export const payload  = {}
export const expected = [
  {
    path: 'user',
    code: code.PROP_REQUIRED,
    message: 'Missing required property `user`'
  }
]
