# YSS Specification - YAML Simplified Schema

> Version 0.1.0

YSS is a schema language for validating JSON payloads, written in YAML.
It is designed to be simple to read, simple to write, and simple to implement in any language.

## Core principles

- Every object is open by default, extra fields are allowed.
- Every field present in the schema is **required** by default.
- Fields and rules are additive, the more you declare, the stricter the validation.
- The schema should be readable by non-developers without explanation.

## Types

| Type      | Validates                            |
|-----------|--------------------------------------|
| `String`  | UTF-8 string                         |
| `Integer` | Whole number (no decimal part)       |
| `Float`   | Any number, including decimals       |
| `Boolean` | `true` or `false`                    |
| `Object`  | JSON object (key-value pairs)        |
| `List`    | Array, duplicates allowed            |
| `Set`     | Array, duplicates not allowed        |
| `Tuple`   | Array with fixed length and types    |
| `null`    | JSON null value                      |

## Rules

Every field is described by a block with `$type` and optional rules. All rules are prefixed with `$`.

| Rule        | Applies to                        | Description                               |
|-------------|-----------------------------------|-------------------------------------------|
| `$type`     | any                               | The type of the field                     |
| `$optional` | any                               | Field may be absent. Default: `false`     |
| `$min`      | String, Integer, Float, List, Set | Minimum length / value / item count       |
| `$max`      | String, Integer, Float, List, Set | Maximum length / value / item count       |
| `$match`    | String                            | Named alias or `/regex/` the value must match |
| `$enum`     | String, Integer, Float            | List of allowed values                    |
| `$item`     | List, Set                         | Schema for each item in the collection    |
| `$at`       | List, Tuple                       | Schema per position                       |

```yaml
email:
  $type:     String
  $match:    email
  $optional: true

age:
  $type: Integer
  $min:  18
  $max:  120

status:
  $type:   String
  $enum: [active, inactive, banned]

phone:
  $type:  String
  $match: /^\+?[0-9]{10,11}$/
```

When a field has no extra rule, the type alone is enough:

```yaml
name:   String
active: Boolean
```

## Object

Object schemas are declared by nesting field definitions. The type is inferred automatically,
no `$type: Object` needed.

```yaml
address:
  street:
    $type: String
    $min:  5
    $max:  120
  city:    String
  country: String
```

### Strict mode

By default, objects allow any extra fields not declared in the schema. To reject extra fields,
add `$strict: true` to the object.

**NOTE:** This cascades to all nested objects unless overridden.

```yaml
# strict - extra fields will cause a validation error
user:
  $strict: true
  name:    String
  email:   String
  address:
    street: String   # also strict, inherited from user
```

A nested object can opt out by declaring `$strict: false`:

```yaml
user:
  $strict: true
  name:    String
  meta:
    $strict: false   # open, overrides parent
    source:  String
    address:
      street: String  # open again, inherited from meta
```

## List

A list of items, duplicates allowed. Use `$item` to declare the schema for each item,
and `$min` / `$max` for length constraints.

```yaml
emails:
  $type: List
  $min:  1
  $max:  20
  $item:
    $type:  String
    $match: email
```

## Set

A list of items, duplicates not allowed. Follows the same syntax as List.

```yaml
roles:
  $type: Set
  $item:
    $type:   String
    $enum: [admin, editor, viewer]
```

## Tuple

An array with a fixed number of positions, each with its own type. The `$at` rule maps each
position index to a schema.

```yaml
point:
  $type: Tuple
  $at:
    0: Float   # latitude
    1: Float   # longitude
```

When used on a **Tuple**, the length of the array must exactly match the number of positions
defined in `$at`.

When used on a **List**, only the declared positions are validated - extra items are allowed.
If the list is shorter than a declared position, it is an error.

```yaml
tokens:
  $type: List
  $at:
    0:
      $type:  String
      $match: uuid
    1: Integer
```

## AnyOf

The value must match at least one of the listed types. Each branch is a full schema block.
`null` can be listed as a bare scalar.

```yaml
value:
  - $type:  String
    $match: email
  - $type: Integer
    $min:  1
  - null
```

## Schema reuse (YAML anchors)

Within the same file, use native YAML anchors (`&`) and aliases (`*`) to avoid repeating structures.

```yaml
$anchors:
  - &Address
    street:
      $type: String
      $min:  5
      $max:  120
    city:    String
    country: String

user:
  billing_address:  *Address
  shipping_address: *Address
```

## Shorthand syntax

For simple fields, YSS offers an inline shorthand that fits on a single line. Shorthand is
purely cosmetic, it compiles to the same schema as the expanded form.

The canonical order is:

```
Type? (match) [val1, val2] {min, max}
```

### Pure type

```yaml
name:   String
active: Boolean
```

### Match - `Type (named-pattern)`

Validates the value against a named alias. Raw regex is not allowed in shorthand - use `$match: /regex/` in expanded form instead.

```yaml
id:         String (uuid)
created_at: String (date-time)
email:      String (email)
```

### Values - `Type [val1, val2]`

The value must be one of the listed options.

```yaml
status: String [active, inactive, banned]
code:   Integer [1, 2, 3]
```

### Optional - `?`

```yaml
nickname: String?
phone:    String? {10, 11}
```

### Range - `Type {min, max}`

Applies to the value for numbers, character length for strings, and item count for List/Set. Both bounds are **inclusive**.

```yaml
name:  String {2, 80}
age:   Integer {18, 120}
score: Float {0, 100}
```

A single value means exactly that - equivalent to `{n, n}`:

```yaml
code: String {4}     # exactly 4 characters
page: Integer {1}    # exactly 1
```

Either bound can be omitted:

```yaml
name: String {2, }   # min 2, no max
age:  Integer {, 18} # max 18, no min
```

### Combining modifiers

```yaml
tag:    String? (slug) [urgent, low, medium] {1, 20}
email:  String? (email)
role:   String? [admin, editor, viewer]
name:   String? {2, 80}
```

### AnyOf shorthand

```yaml
code:       [String, Integer]
deleted_at: [String (date-time), null]
value:      [String [active, inactive], Integer {1, 100}]
```

### List shorthand - `List<Type>`

No modifiers inside `<>`.

```yaml
tags:  List<String>
ids:   List<Integer>
flags: Set<Boolean>
```

## Named `$match` aliases

The following aliases can be used with `$match` or inline as `(alias)`.

### Dates & Times

RFC 3339 - https://datatracker.ietf.org/doc/html/rfc3339

| Alias       | Example                     |
|-------------|-----------------------------|
| `date-time` | `2024-01-01T00:00:00Z`      |
| `date`      | `2024-01-01`                |
| `time`      | `14:30:00Z`                 |
| `duration`  | `P3D`, `PT1H30M`            |

### Email

RFC 5321 - https://datatracker.ietf.org/doc/html/rfc5321

RFC 6531 (IDN) - https://datatracker.ietf.org/doc/html/rfc6531

| Alias       | Description                          |
|-------------|--------------------------------------|
| `email`     | Standard email address               |
| `idn-email` | Email with international characters  |

### Hostname

RFC 1123 - https://datatracker.ietf.org/doc/html/rfc1123

RFC 5890 (IDN) - https://datatracker.ietf.org/doc/html/rfc5890

| Alias          | Example           |
|----------------|-------------------|
| `hostname`     | `example.com`     |
| `idn-hostname` | `münchen.de`      |

### IP Addresses

RFC 2673 (IPv4) - https://datatracker.ietf.org/doc/html/rfc2673

RFC 4291 (IPv6) - https://datatracker.ietf.org/doc/html/rfc4291

| Alias  | Example                  |
|--------|--------------------------|
| `ipv4` | `192.168.0.1`            |
| `ipv6` | `2001:db8::1`            |

### Resource Identifiers

RFC 3986 (URI) - https://datatracker.ietf.org/doc/html/rfc3986

RFC 3987 (IRI) - https://datatracker.ietf.org/doc/html/rfc3987

| Alias           | Example                          |
|-----------------|----------------------------------|
| `uri`           | `https://example.com/path`       |
| `uri-reference` | `/relative/path` or full URI     |
| `iri`           | URI with international chars     |

### UUID

RFC 4122 - https://datatracker.ietf.org/doc/html/rfc4122

| Alias  | Example                                |
|--------|----------------------------------------|
| `uuid` | `550e8400-e29b-41d4-a716-446655440000` |

### JSON Pointer

RFC 6901 - https://datatracker.ietf.org/doc/html/rfc6901

| Alias          | Example       |
|----------------|---------------|
| `json-pointer` | `/foo/bar/0`  |

### Regex

| Alias   | Description                          |
|---------|--------------------------------------|
| `regex` | A valid regular expression string    |

## Full example

```yaml
# order.yaml

id:         String (uuid)
created_at: [String (date-time), null]

customer:
  $strict: true
  id:    Integer {1, }
  name:  String {2, 80}
  email: String (email)
  phones:
    $type: List {1, }
    $item:
      $type:  String
      $match: /^\+?[0-9]{10,11}$/

items:
  $type: List {1, 50}
  $item:
    id:    Integer {1, }
    name:  String {1, 100}
    qty:   Integer {1, 9999}
    price: Float {0.01, }
    tags:
      $type: Set
      $item: String [fragile, perishable, digital, oversized]
    dimensions:
      $type: Tuple
      $at:
        0: Float   # width
        1: Float   # height
        2: Float   # depth

shipping:
  method: String [standard, express, pickup]
  cost:   Float {0, }
  tracking:
    code:    String
    carrier: String?
    status:  String? [pending, shipped, delivered, returned]
```
