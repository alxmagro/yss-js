# Compiler Architecture

Instead of interpreting the AST on every `validate(payload)` call, the compiler
walks the AST **once at schema-load time** and produces a native JavaScript function
via `new Function()`. Validation then runs pure generated code with no dynamic
dispatch, no rule registry lookups, and no `Object.keys` overhead.

This is the same approach Ajv uses. Benchmarks show YSS matching or exceeding
Ajv on all cases except anyOf with fully-invalid payloads (see Performance Notes).

---

## File Structure

```
src/compiler/
  index.js      — public entry: compileAST(ast) → validate Function
  context.js    — CompilerContext: unique var counter + refs registry
  codegen.js    — emitters per node type (scalar, object, array, any_of)
  fragments.js  — path building helpers and type check condition generators
```

---

## How It Works

`compileAST(ast)` accumulates JavaScript source lines into a string, then
materializes it with:

```js
new Function('refs', `
  return function validate(payload) {
    ${body}
  }
`)(refs)
```

`refs` is a plain object that holds anything that cannot be serialized as a
literal: regex objects, Set instances for enum lookups, custom format functions.
It is captured in the closure once and never touched again at runtime.

---

## Code Generation Per Node Type

### Scalar

Type check wraps everything in an `if/else` so no further rules run after a
type mismatch. Each rule is emitted inline — no function call, no registry lookup:

```js
if (!(typeof v0 === 'string')) {
  errors.push({ path: "email", code: 'type_mismatch', ... })
} else {
  if (!(refs.r0(v0)))               errors.push({ ... format_invalid ... })
  { const v1 = v0.length
    if (v1 < 2)                     errors.push({ ... size_min_invalid ... })
    if (v1 > 80)                    errors.push({ ... size_max_invalid ... }) }
}
```

### Object

Field variables use unique names (no `{}` scoping blocks needed), and path
strings are computed **lazily** — never allocated on the happy path, only inside
error branches:

```js
const v0 = payload["email"]
if (v0 === undefined) {
  const _p = "email"   // ← only runs when field is missing
  errors.push({ path: _p, code: 'prop_required', ... })
} else {
  // emitNode(v0, fieldNode, "email")  ← "email" is a compile-time literal
}
// strict check — path also lazy:
for (const v1 in payload) {
  if (!refs.r0.has(v1)) {
    const p = v1             // root-level: path is just the key
    errors.push({ path: p, code: 'prop_unexpected', ... })
  }
}
```

### Array

Path expressions for items are passed as inline expressions — no variable
allocated per item on the happy path:

```js
for (let v0 = 0; v0 < payload["tags"].length; v0++) {
  const v1 = payload["tags"][v0]
  // pathExpr passed as: (parent + '[' + v0 + ']')
  // evaluated only inside error blocks
}
```

### AnyOf — Early Exit

Branches run sequentially, stopping at the first match. Failed branch errors
are collected only when all branches fail (needed for the `any_of` error data):

```js
let v0 = false          // matched flag
const v1 = []           // branch error accumulator

if (!v0) {
  const v2 = []
  /* emitNode branch 0 → v2 */
  if (v2.length === 0) { v0 = true } else { v1.push(v2) }
}
if (!v0) {
  const v3 = []
  /* emitNode branch 1 → v3 */
  if (v3.length === 0) { v0 = true } else { v1.push(v3) }
}
if (!v0) {
  errors.push({ code: 'anyof_invalid', data: { value, any_of: v1 } })
}
```

---

## External References (`refs`)

| Schema value | What is stored in refs |
|---|---|
| Named format alias (`'email'`) | the function from `aliases.js` |
| Inline regex format (`'/regex/flags'`) | `new RegExp(source, flags)` — constructed once at compile time |
| `enum` array | `new Set(node.enum)` for O(1) `.has()` + original array for error data |
| `strict` allowed keys | `new Set(Object.keys(fields))` |

`ctx.addRef(value)` deduplicates by identity — the same regex or function object
reused across nodes maps to a single `refs.rN` slot.

---

## Path Building (Lazy)

**Key insight**: path strings are only needed when pushing an error. On the
happy path (valid payload), no path string is ever computed or allocated.

Three strategies, chosen at codegen time:

| Context | Expression in generated code | Cost on happy path |
|---|---|---|
| Top-level field `"name"` | `"name"` (string literal) | zero |
| Nested field, parent path in `pN` | `(pN ? pN + '.name' : 'name')` | zero — inside error branch |
| Array item, index in `iN` | `(parent + '[' + iN + ']')` | zero — inside error branch |
| Static `at` position `[2]` | `"[2]"` or `(pN + '[2]')` | zero — inside error branch |

---

## Variable Naming

All variables are globally unique (`v0`, `v1`, `v2`, ...) via `ctx.nextId()`.
No `{}` scoping blocks are emitted for object fields — they are unnecessary since
names never collide, and removing them reduces lexical scope creation overhead
in V8.

---

## Performance Notes

Benchmarks vs Ajv (2026-03-12, Node.js v24):

| Case | valid | invalid |
|---|---|---|
| flat scalars | YSS 44% faster | YSS 19% faster |
| deep object (strict) | parity | YSS 9× faster |
| array with items | YSS 4× faster | YSS 62% faster |
| any_of | YSS 4× faster | Ajv 46% faster |

**The anyOf invalid gap**: when all branches fail, we collect full branch errors
into `data.any_of`. Ajv discards branch errors entirely and returns a single
flat error. This allocation cost is the sole remaining gap. On real workloads
where payloads are mostly valid, the difference does not appear.

**Things that did NOT help** (tested and reverted):
- `require-from-string` instead of `new Function` — no measurable difference
- Minifying the generated source string — V8 compiles to bytecode once; source
  size is irrelevant at runtime

---

## Integration Point

`index.js` (root) calls `compileAST(tree)` and attaches `.assert` and `.valid`:

```js
function compile(tree) {
  const validate = compileAST(tree)
  validate.assert = function (payload) { ... }
  validate.valid  = function (payload) { ... }
  return validate
}
```

No changes to `schema.fromFile`, `schema.fromString`, or `schema.fromObject`.
