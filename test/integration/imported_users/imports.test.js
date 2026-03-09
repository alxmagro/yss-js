import { schema } from '../../../index.js'

const validateUser  = schema.fromFile(new URL('./user.yaml', import.meta.url).pathname)
const validateUsers = schema.fromFile(new URL('./users.yaml', import.meta.url).pathname)

const validUser = {
  id:    1,
  name:  'Luke Skywalker',
  email: 'luke@rebelalliance.org',
  zip:   '12345-678',
}

const invalidUser = {
  id:    0,
  name:  'L',
  email: 'not-an-email',
  zip:   'INVALID',
}

describe('integration - imports', () => {
  describe('user.yaml (standalone)', () => {
    test('valid user passes', () => {
      expect(validateUser(validUser)).toEqual([])
    })

    test('invalid user returns expected errors', () => {
      const errors = validateUser(invalidUser)
      expect(errors).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: 'id',    code: 'gte_invalid'    }),
        expect.objectContaining({ path: 'name',  code: 'min_invalid'    }),
        expect.objectContaining({ path: 'email', code: 'format_invalid' }),
        expect.objectContaining({ path: 'zip',   code: 'format_invalid' }),
      ]))
    })
  })

  describe('users.yaml ($ref to user.yaml)', () => {
    test('valid list of users passes', () => {
      expect(validateUsers([validUser, validUser])).toEqual([])
    })

    test('empty list passes', () => {
      expect(validateUsers([])).toEqual([])
    })

    test('invalid user inside list returns errors with correct path', () => {
      const errors = validateUsers([validUser, invalidUser])
      expect(errors).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: '[1].id',    code: 'gte_invalid'    }),
        expect.objectContaining({ path: '[1].name',  code: 'min_invalid'    }),
        expect.objectContaining({ path: '[1].email', code: 'format_invalid' }),
        expect.objectContaining({ path: '[1].zip',   code: 'format_invalid' }),
      ]))
    })

    test('zip-code pattern from user.yaml resolves correctly inside list', () => {
      const user = { ...validUser, zip: '99999-000' }
      expect(validateUsers([user])).toEqual([])
    })
  })
})
