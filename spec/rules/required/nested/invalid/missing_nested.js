import { code } from "../../../../../src/errors.js"

export const payload  = { user: { email: 'luke@jedi.org' } }
export const expected = [
  {
    path: 'user.name',
    code: code.PROP_REQUIRED,
    message: 'Missing required property `user.name`'
  }
]
