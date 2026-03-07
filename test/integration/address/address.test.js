import path from 'path'
import { schema } from '../../../index.js'

const validate = schema.fromFile(
  new URL('./schema.yaml', import.meta.url).pathname
)

const validPayload = {
  id:       'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  name:     'Galactic Senate Supplies',
  billing: {
    street: '500 Republica, Senate District',
    city:   'Galactic City',
    planet: 'Coruscant',
  },
  shipping: {
    street: 'Docking Bay 94, Mos Eisley',
    city:   'Mos Eisley',
    planet: 'Tatooine',
  },
  headquarters: {},
}

const invalidPayload = {
  id:   'not-a-uuid',
  name: 'X',
  billing: {
    street: 'Ok',
    city:   'Coruscant',
    planet: 'C',
  },
  shipping: {
    street:     '1 Rebel Base',
    city:       'Massassi Temple',
    planet:     'Yavin IV',
    postalCode: 'WAY-TOO-LONG-POSTAL-CODE',
  },
  headquarters: {},
}

describe('integration - address', () => {
  test('valid payload passes', () => {
    expect(validate(validPayload)).toEqual([])
  })

  test('invalid payload returns expected errors', () => {
    const errors = validate(invalidPayload)

    expect(errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'id',                  code: 'match_invalid' }),
      expect.objectContaining({ path: 'name',                code: 'min_invalid'   }),
      expect.objectContaining({ path: 'billing.street',      code: 'min_invalid'   }),
      expect.objectContaining({ path: 'billing.planet',      code: 'min_invalid'   }),
      expect.objectContaining({ path: 'shipping.postalCode', code: 'max_invalid'   })
    ]))
  })
})