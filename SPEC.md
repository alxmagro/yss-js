# YSS Specification - YAML Simplified Schema

> Version 0.1.0

YSS is a schema language for validating JSON payloads, written in YAML.
It is designed to be simple to read, simple to write, and simple to implement in any language.

---

## Core principles

- Every field present in the schema is **required** by default.
- Every object is **strict** by default - extra fields are rejected.
- Fields and rules are additive - the more you declare, the stricter the validation.
- The schema should be readable by non-developers without explanation.

---

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

---

## Inline syntax

Fields with no extra rules can be declared inline on a single line.

### Pure type

```yaml
name: String
age:  Integer
```

### Range - `Type {min,max}`

Applies to the value for numbers, character length for strings, and item count for List/Set.
Both bounds are **inclusive**.

```yaml
name:  String {2,80}     # length >= 2 and <= 80
age:   Integer {18,120}  # value >= 18 and <= 120
score: Float {0,100}
tags:
  $type: List
  $min: 1
  $max: 10
```

A single value means **exactly** that length or amount - equivalent to `{n,n}`:

```yaml
code: String {4}    # exactly 4 characters
page: Integer {1}   # exactly 1
```

Either bound can be omitted:

```yaml
name: String {2,}   # min 2, no max
age:  Integer {,18} # max 18, no min
```

### Values - `Type (VAL1 | VAL2 | VAL3)`

The value must be one of the listed options. Equivalent to an enum.
Spaces around `|` are allowed and encouraged for readability.

```yaml
status: String (active | inactive | banned)
code:   Integer (1 | 2 | 3)
```

### Optional - `?`

The field may be absent from the payload.

```yaml
nickname: String?
phone:    String? {10,11}
```

### Match - `=~ alias` or `=~ /regex/`

Validates the string against a named alias or a raw regular expression.

- **Named alias** - no delimiters, just the alias name (e.g. `email`, `uuid`)
- **Raw regex** - must be wrapped in `/slashes/`, optionally with flags

```yaml
email:   String =~ email              # named alias
orderId: String =~ uuid               # named alias
phone:   String =~ /^\+?[0-9]{10,11}$/   # raw regex
zipCode: String =~ /^\d{5}-?\d{3}$/     # raw regex
token:   String =~ /^[A-Z0-9]{6}$/i  # raw regex with flag
```

### Combining modifiers

Modifiers can be combined. The canonical order is:

```
Type? {min,max} (VAL1 | VAL2) =~ match
```

| Position | Modifier | Example |
|----------|----------|---------|
| 1 | Type | `String` |
| 2 | `?` optional - immediately after the type | `String?` |
| 3 | `{}` range | `String? {2,80}` |
| 4 | `()` allowed values | `String? {2,80} (foo | bar)` |
| 5 | `=~` match | `String? {2,80} (foo | bar) =~ /^[a-z]+$/` |

The `?` comes immediately after the type so it is never lost at the end of a long expression.

```yaml
tag:   String? {1,20} (urgent | low | medium) =~ /^[a-z]+$/
email: String? =~ email
role:  String? (admin | editor | viewer)
name:  String? {2,80}
```

### AnyOf - `[Type, Type]`

The value must match at least one of the listed types. Inline modifiers are allowed inside AnyOf.

```yaml
code:      [String, Integer]
deletedAt: [String, null]
value:     [String (active | inactive), Integer {1,100}]
```

### List shorthand - `List<Type>`

Shorthand for a list where all items are of the same bare type. No modifiers inside `<>`.

```yaml
tags:  List<String>
ids:   List<Integer>
flags: Set<Boolean>
```

---

## Expanded block syntax

When a field needs more than one modifier, use the expanded block form with `$type`.

```yaml
email:
  $type: String
  $match: email
  $optional: true

count:
  $type: Integer
  $min: 1
  $max: 100
```

---

## Runes (modifiers)

All modifiers are prefixed with `$`.

| Rune        | Applies to              | Description                                      |
|-------------|-------------------------|--------------------------------------------------|
| `$type`     | any                     | The type of the field                            |
| `$optional` | any                     | Field may be absent. Default: `false`            |
| `$min`      | String, Integer, Float, List, Set | Minimum length / value / item count    |
| `$max`      | String, Integer, Float, List, Set | Maximum length / value / item count    |
| `$match`    | String                  | Regex or named alias the value must match        |
| `$values`   | String, Integer, Float  | List of allowed values                           |
| `$item`     | List, Set               | Schema for each item in the collection           |
| `$at`       | List, Tuple             | Schema per position in the tuple                 |

---

## Object fields

Object schemas are declared by nesting field definitions. The object type is inferred automatically.

```yaml
address:
  street: String {5,120}
  city:   String {2,60}
  state:  String {2,2}
```

### Strict mode (default)

By default, objects reject any fields not declared in the schema.

```yaml
# strict - extra fields will cause a validation error
user:
  name:  String
  email: String
```

### Open objects - `...: true`

To allow extra fields, add `...: true` as a child of the object. This only applies to the immediate object, not to nested objects.

```yaml
# open - extra fields are allowed
meta:
  source: String
  ...: true

# nested object is still strict
user:
  name: String
  address:
    street: String   # strict
  ...: true          # only 'user' is open
```

---

## List

A list of items, duplicates allowed.

```yaml
# shorthand
tags: List<String>

# expanded - with item rules
emails:
  $type: List
  $min: 1
  $max: 20
  $item:
    $type: String
    $match: email
```

---

## Set

A list of items, duplicates not allowed. Follows the same syntax as List.

```yaml
# shorthand
roles: Set<String>

# expanded
roles:
  $type: Set
  $item: String (admin | editor | viewer)

# even further expanded
roles:
  $type: Set
  $item:
    $type: String
    $values: [admin, editor, viewer]
```

---

## Tuple

An array with a fixed number of positions, each with its own type. The `$at` rune maps each position index to a type.

```yaml
point:
  $type: Tuple
  $at:
    0: Float    # latitude
    1: Float    # longitude

record:
  $type: Tuple
  $at:
    0: String           # name
    1: Integer {0,120}  # age
    2: String?          # optional note
```

When used on a **Tuple**, the length of the array must exactly match the number of positions defined in `$at`.

When used on a **List**, only the declared positions are validated - extra items are allowed. If the list is shorter than a declared position, it is an error.

```yaml
# List - validates only first two positions, rest is free
tokens:
  $type: List
  $at:
    0: String =~ uuid   # first item must be uuid
    1: Integer {1,}     # second item must be integer >= 1
```

---

## AnyOf (expanded)

When each branch of an AnyOf needs its own rules, use the expanded array form.

```yaml
value:
  - $type: String
    $match: email
  - $type: Integer
    $min: 1
  - null
```

`null` can be listed as a bare scalar - no block needed.

---

## Schema reuse (YAML anchors)

Within the same file, use native YAML anchors (`&`) and aliases (`*`) to avoid repeating structures.

```yaml
$defs:
  - &Address
    street: String {5,120}
    city:   String {2,60}

user:
  name:            String {2,80}
  billingAddress:  *Address
  shippingAddress: *Address
```

---

## Named `$match` aliases

The following aliases can be used with `$match` instead of raw regex.

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

---

## Full example

```yaml
orderId:   String =~ uuid
createdAt: [String, null]

customer:
  id:     Integer {1}
  name:   String {2,80}
  email:  String =~ email
  phones:
    $type: List {1,}
    $item: String =~ /^\+?[0-9]{10,11}$/
  document:
    $type: [Object, null]
    type:  String (cpf | cnpj)
    value: String {11,14}

items:
  $type: List {1,50}
  $item:
    productId: Integer {1}
    name:      String {1,100}
    qty:       Integer {1,9999}
    price:     Float {0.01}
    tags:
      $type: Set
      $item: String (fragile | perishable | digital | oversized)
    dimensions:
      $type: Tuple
      $at:
        0: Float # width
        1: Float # height
        2: Float # depth

payment:
  method:       String (credit_card | pix | boleto)
  amount:       Float {0.01}
  installments: Integer? {1,12}
  card:
    $type: [Object, null]
    last4: String =~ /^[0-9]{4}$/
    brand: String (visa | mastercard | amex | elo)

shipping:
  method:        String (standard | express | pickup)
  cost:          Float {0}
  estimatedDays: Integer? {1}
  address:
    street:     String {5,120}
    number:     [String, null]
    city:       String {2,60}
    state:      String {2,2}
    zipCode:    String =~ /^\d{5}-?\d{3}$/
    complement: String?
  tracking:
    code:    String
    carrier: String?
    status:  String? (pending | shipped | delivered | returned)
    ...: true

notes: String? {0,500}
meta:
  ...: true
```