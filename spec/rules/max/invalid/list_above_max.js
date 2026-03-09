import { code } from "../../../../src/errors.js"

export const payload  = { tags: ['jedi', 'pilot', 'senator'] }
export const expected = [
  {
    path: 'tags',
    code: code.MAX_INVALID,
    message: 'Maximum size is `2`',
    data: {
      value: ['jedi', 'pilot', 'senator'],
      size: 3,
      max: 2
    }
  }
]
