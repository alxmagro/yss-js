import { code } from "../../../../src/errors.js"

export const payload  = { size: 'huge' }
export const expected = [
  {
    path: 'size',
    code: code.ANYOF_INVALID,
    message: 'Value does not match any condition',
    data: {
      value: 'huge',
      any_of: [
        [
          {
            path: 'size',
            code: code.ENUM_INVALID,
            message: 'Value `huge` is not allowed',
            data: {
              value: 'huge',
              enum: ['small', 'medium', 'large']
            }
          }
        ],
        [
          {
            path: 'size',
            code: code.TYPE_MISMATCH,
            message: 'Unexpected type',
            data: {
              value: 'huge',
              expected: 'Integer'
            }
          }
        ]
      ]
    }
  }
]
