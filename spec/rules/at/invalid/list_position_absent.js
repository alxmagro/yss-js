import { code } from "../../../../src/errors.js"

export const payload  = { tags: [] }
export const expected = [
  {
    path: 'tags[0]',
    code: code.LIST_POSITION_MISSING,
    message: "Position `0` is required but list has `0` items",
    data: {
      value: [],
      size: 0
    }
  }
]

