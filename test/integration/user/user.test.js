import { schema } from '../../../index.js'

const validate = schema.fromFile(
  new URL('./schema.yaml', import.meta.url).pathname
)

const validPayload = {
  id:       'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  username: 'obiwan_kenobi',
  email:    'obiwan@jediorder.org',
  roles:    ['jedi', 'pilot'],
  profile: {
    displayName: 'Obi-Wan Kenobi',
    homeworld:   'Stewjon',
    age:         57,
  },
  deletedAt: null,
}

const invalidPayload = {
  id:       'obiwan-kenobi',
  username: 'ob',
  email:    'obiwan@',
  roles:    ['jedi', 'jedi'],
  profile: {
    displayName: 'O',
    age:         1200,
  },
  deletedAt: 42,
}

describe('integration - user', () => {
  test('valid payload passes', () => {
    expect(validate(validPayload)).toEqual([])
  })

  test('invalid payload returns expected errors', () => {
    const errors = validate(invalidPayload)

    expect(errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'id',                  code: 'match_invalid' }),
      expect.objectContaining({ path: 'username',            code: 'min_invalid'   }),
      expect.objectContaining({ path: 'email',               code: 'match_invalid' }),
      expect.objectContaining({ path: 'roles[1]',            code: 'set_duplicated' }),
      expect.objectContaining({ path: 'profile.displayName', code: 'min_invalid'  }),
      expect.objectContaining({ path: 'profile.age',         code: 'max_invalid'   }),
      expect.objectContaining({ path: 'deletedAt',           code: 'anyof_invalid' }),
    ]))
  })
})