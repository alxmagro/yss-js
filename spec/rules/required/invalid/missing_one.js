import { code } from "../../../../src/errors.js"

export const payload  = { name: 'Luke' }
export const expected = [
  {
    path: 'email',
    code: code.PROP_REQUIRED,
    message: 'Missing required property `email`'
  }
]
