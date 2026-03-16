<p align="center">
  <img src="assets/logo.svg"/>
</p>

<p align="center">
  <a href="https://github.com/alxmagro/yss-js/actions/workflows/ci.yml"><img src="https://github.com/alxmagro/yss-js/actions/workflows/ci.yml/badge.svg?branch=main" alt="build status"></a>
  <a href="https://codecov.io/github/alxmagro/yss-js" ><img src="https://codecov.io/github/alxmagro/yss-js/graph/badge.svg?token=8XJS41Z9D0"/></a>
</p>

## Introduction

A YSS parser for javascript.

**See** [YAML Simplified Schema](https://github.com/alxmagro/yss) for the full specification.

## Performance

Benchmarked against [AJV](https://ajv.js.org/).

| | yss | ajv | difference |
|---|---|---|---|
| valid payload | 2,478,605 ops/sec | 1,271,329 ops/sec | **+95%** |
| invalid payload | 1,938,438 ops/sec | 1,441,741 ops/sec | **+34%** |

**Measured on GitHub Actions (`ubuntu-latest`, Node.js 24, 10M iterations).*

## Examples

```yaml
# order.yaml

id: integer
customer:
  name:  string
  email: string, ~ email
items:
  $type: array
  $size: [1, ~]
  $item:
    id: integer
    qty: integer, >= 1
    price: number
```

```js
import { schema } from 'yss'

const validate = schema.fromFile('./order.yaml')
const errors   = validate(payload)
// [] -> valid
// [{ path: 'customer.email', code: 'format_invalid', message: 'Value does not match required format', data: { value: 'bad', format: 'email' } }]
```

## Install

```bash
npm install yss-js
```

Requires Node.js >= 22.

## API

**schema.fromFile(path)**

Loads and compiles a schema from a `.yaml` file on disk. The schema is compiled once and reused -
call this at application startup, not on every request.

```js
const validate = schema.fromFile('./schemas/order.yaml')
```

**schema.fromObject(raw)**

Same as `fromFile`, but receives a plain JavaScript object. Useful when the schema is already parsed or comes from another source.

```js
const validate = schema.fromObject({
  name:  'string, size [2, 80]',
  email: 'string, ~ email',
})
```

**schema.fromString(yaml)**

Same as `fromFile`, but receives the YAML directly as a string. Useful for tests or when
the schema comes from a database or environment variable.

```js
const validate = schema.fromString(`
  name:  string, size [2, 80]
  email: string, ~ email
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
//     { path: 'name',  code: 'size_min_invalid', message: 'Minimum size is `2`',                      data: { size: 1, min: 2 } },
//     { path: 'email', code: 'format_invalid',   message: 'Value does not match required format',     data: { value: 'not-an-email', format: 'email' } }
//   ]
```

**validate.assert(payload)**

Same validation, but throws a `ValidationError` if the payload is invalid.
Useful for frameworks that handle exceptions globally.

```js
try {
  validate.assert(payload)
} catch (e) {
  console.log(e.errors) // [{ path, code, message, data }]
}
```

**validate.valid(payload)**

Returns `true` if valid, `false` otherwise.

```js
if (!validate.valid(payload)) {
  return res.status(400).json({ error: 'Invalid payload' })
}
```

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2026-present, Alexandre Magro
