<p align="center">
  <img src="assets/logo.svg"/>
</p>

<p align="center">
  A human-friendly alternative to JSON Schema. Write validation schemas in clean YAML.
</p>

## Examples

```yaml
# order.yaml

id: Integer
customer:
  name:  String
  email: String (email)
items:
  $type: List
  $min: 1
  $item:
    id: Integer
    qty:
      $type: Integer
      $min: 1
    price: Float
```

```js
import { schema } from 'yss'

const validate = schema.fromFile('./order.yaml')
const errors   = validate(payload)
// [] -> valid
// [{ path: 'customer.email', message: 'expected String =~ email' }] -> invalid
```

## Install

```bash
npm install yss
```

Requires Node.js >= 22.

## API

**schema.fromFile(path)**

Loads and compiles a schema from a `.yaml` file on disk. The schema is compiled once and reused -
call this at application startup, not on every request.

```js
const validate = schema.fromFile('./schemas/order.yaml')
```

**schema.fromString(yaml)**

Same as `fromFile`, but receives the YAML directly as a string. Useful for tests or when
the schema comes from a database or environment variable.

```js
const validate = schema.fromString(`
  name:  String{2,80}
  email: String =~ email
`)
```

**validate(payload)**

Validates a payload against the compiled schema. Returns an array of error objects.
An empty array means the payload is valid.

```js
const errors = validate({ name: 'Ana', email: 'ana@email.com' })
// -> []

const errors = validate({ name: 'A', email: 'not-an-email' })
// -> [
//     { path: 'name',  message: 'expected String length >= 2, got 1' },
//     { path: 'email', message: 'expected String =~ email' }
//   ]
```

**validate.assert(payload)**

Same validation, but throws a `ValidationError` if the payload is invalid.
Useful for frameworks that handle exceptions globally.

```js
try {
  validate.assert(payload)
} catch (e) {
  console.log(e.errors) // [{ path, message }]
}
```

**validate.valid(payload)**

Returns `true` if valid, `false` otherwise.

```js
if (!validate.valid(payload)) {
  return res.status(400).json({ error: 'Invalid payload' })
}
```

## Schema syntax

See [SPEC.md](./SPEC.md) for the full specification.


## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2025-present, Alexandre Magro
