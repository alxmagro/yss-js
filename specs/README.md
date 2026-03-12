# YSS Spec Suite

Language-agnostic test suite for the YSS (YAML Simplified Schema) specification.
To run these specs against a YSS implementation, write a runner in your language of choice — see [Implementing a runner](#implementing-a-runner) below.

---

## Structure

```
specs/
  codes.yaml              — error code constants referenced in specs via {{ CODE_* }} templates
  rules/
    scalars/              — scalar rule specs (type, size, enum, format, ...)
    composites/           — composite rule specs (object, array, any_of)
  integration/
    imports/              — multi-file specs exercising $imports and $ref
      schema.yaml         — the YSS schema under test
      spec.yaml           — scenarios validated against schema.yaml
      *.yaml              — auxiliary schemas imported by schema.yaml
```

---

## Spec format

### Standard spec (`rules/`)

```yaml
feature: Short description

given:                            # YSS schema used to validate the scenarios below
  field_name: string
  other_field:
    $type: integer
    $gte: 0

scenarios:
  - name: valid data
    when:                         # payload to validate
      field_name: hello
    then: []                      # [] means the payload is valid

  - name: multiple valid payloads
    when:                         # list of payloads — all must produce the same then
      - field_name: hello
      - field_name: world
    then: []

  - name: invalid data
    when:
      field_name: 42
    then:
      - path: field_name
        code: type_mismatch
        message: Unexpected type
        data:
          value: 42
          expected: string
```

Each spec file requires `feature`, `given` and `scenarios`.

`when` is the payload to validate. It can also be a list of payloads — in that case each item is validated independently, and all are expected to produce the same `then`.

### Integration spec (`integration/`)

Each subdirectory has a `schema.yaml` (the YSS schema under test, may use `$imports`)
and a `spec.yaml` containing only `scenarios` — no `given`. The scenarios are validated
against `schema.yaml` loaded from the same directory. Auxiliary schemas imported by
`schema.yaml` also live in the same directory.

```yaml
feature: Short description

scenarios:
  - name: valid data
    when:
      slug: my-project
    then: []
```

---

## Error object format

Each error in `then` is compared against the actual validator output:

```yaml
- path: field.nested[0].key   # dot/bracket path to the error location
  code: type_mismatch          # error code string
  message: Unexpected type     # human-readable message
  data:                        # optional — extra context (value, expected, etc.)
    value: 42
    expected: string
```

Comparison uses deep equality. The actual error must contain exactly the same keys and values as specified — partial matching is not used.

---

## Error code templates

`codes.yaml` contains named constants for all error codes:

```yaml
CODE_TYPE_MISMATCH: type_mismatch
CODE_PROP_REQUIRED: prop_required
# ...
```

Spec files reference these constants via `{{ CODE_TYPE_MISMATCH }}` placeholders instead of literal strings. The runner is responsible for resolving them before comparing.

---

## Implementing a runner

### Step 1 — Load codes

```
codes = parse_yaml("specs/codes.yaml")
```

### Step 2 — Resolve templates

Replace `{{ CODE_* }}` placeholders in expected errors before comparing:

```
function resolve_templates(value):
  if string: replace "{{ KEY }}" with codes[KEY]
  if array:  map resolve_templates over items
  if object: map resolve_templates over values
  else:      return as-is
```

### Step 3 — Run rules specs

For each `.yaml` file in `specs/rules/`:

1. Parse the file
2. Build a validator from `given` using your YSS parser
3. For each scenario:
   - Validate `when` payload(s)
   - Compare actual errors against the expected errors in `then`
   - Report PASS / FAIL

### Step 4 — Run integration specs

For each `spec.yaml` file in `specs/integration/*/`:

1. Load `schema.yaml` from the same directory (with `$imports` support)
2. For each scenario in `spec.yaml`:
   - Validate `when` payload(s)
   - Compare actual errors against the expected errors in `then`
   - Report PASS / FAIL

### Step 5 — Report

```
N passed, N failed, N skipped
```

Exit with a non-zero code if any test failed.

---

## Reference implementation

See [`scripts/run-specs.js`](../scripts/run-specs.js) for the JavaScript runner.
