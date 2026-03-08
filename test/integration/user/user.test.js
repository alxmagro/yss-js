import path from 'path'
import { fileURLToPath } from 'url'
import { schema } from '../../../index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const validate = schema.fromFile(path.join(__dirname, 'schema.yaml'))

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
  id:       'obiwan-kenobi',               // invalid uuid
  username: 'ob',                          // too short (min 3)
  email:    'obiwan@',                     // invalid email
  roles:    ['jedi', 'jedi'],              // duplicate in Set
  profile: {
    displayName: 'O',                      // too short (min 2)
    age:         1200,                     // exceeds max 900
  },
  deletedAt: 42,                           // not String or null
}

describe('integration - user', () => {
  test('valid payload passes', () => {
    expect(validate(validPayload)).toEqual([])
  })

  test('deletedAt accepts null', () => {
    expect(validate({ ...validPayload, deletedAt: null })).toEqual([])
  })

  test('deletedAt accepts a date string', () => {
    expect(validate({ ...validPayload, deletedAt: '2024-05-04T00:00:00Z' })).toEqual([])
  })

  test('optional profile fields can be omitted', () => {
    const payload = {
      ...validPayload,
      profile: { displayName: 'Obi-Wan Kenobi' },
    }
    expect(validate(payload)).toEqual([])
  })

  test('invalid payload returns expected errors', () => {
    const errors = validate(invalidPayload)
    const paths = errors.map(e => e.path)
    expect(paths).toContain('id')
    expect(paths).toContain('username')
    expect(paths).toContain('email')
    expect(paths).toContain('roles[1]')
    expect(paths).toContain('profile.displayName')
    expect(paths).toContain('profile.age')
    expect(paths).toContain('deletedAt')
  })

  test('role not in allowed values returns error', () => {
    const errors = validate({ ...validPayload, roles: ['jedi', 'smuggler'] })
    expect(errors.some(e => e.path === 'roles[1]')).toBe(true)
  })
})
