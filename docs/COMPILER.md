# Compiler Architecture

> **Purpose of this document**: This is a living log of insights, lessons learned,
> and design decisions accumulated while building and tuning the YSS compiler.
> It is written for the compiler author (human or AI) returning to this codebase —
> not as API documentation, but as institutional memory: what was tried, what worked,
> what didn't, and why.
>
> **Update this document when:**
> - A non-obvious decision was made (you chose A over B for a reason not visible in the code)
> - A new codegen pattern is introduced that will be reused or extended
> - There is a performance tradeoff worth remembering (something that looks worse but is faster, or vice-versa)
> - A benchmark produces a surprising or reference-worthy result
>
> **Do not update for** straightforward rule implementations where the code speaks for itself.

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

### Contains — Candidate Matching

For each array item, a boolean flag `beVar = false` runs the item schema in
**lightweight mode** (see below). If the flag stays `false` the item matched.
Only one error (the contains constraint violation) is pushed to the outer
`errTarget`.

```js
let v2 = 0                       // match counter
for (let v0 = 0; v0 < val.length; v0++) {
  const v1  = val[v0]
  let v3 = false                  // ← lightweight flag, no allocation
  /* emitNode(v1, itemNode, path, v3, lightweight=true) */
  if (!v3) {
    v2++
    if (v2 >= min) break          // ← early exit once min satisfied (min-only)
  }
}
if (v2 < min) errors.push({ code: 'contains_min_invalid', ... })
```

**Early-exit strategy** (chosen at codegen time, zero runtime branching):

| `$quantity` | break condition |
|---|---|
| exact `N` | `count > N` |
| `[min, max]` | `count > max` |
| `[min, ~]` (min-only) | `count >= min` — exits as soon as constraint is met |
| `[~, max]` (max-only) | `count > max` |

The min-only early exit is critical: without it a valid array with the first item
matching would still scan every remaining item.

**Why not reuse `errTarget` with save/restore?** Tested and reverted. Setting
`errTarget.length = savedLen` (array truncation) is more expensive than a fresh
short-lived `[]` allocation, which V8 can optimize via escape analysis.

### AnyOf — Early Exit

Branches run sequentially, stopping at the first match. Each branch uses a
**lightweight flag** instead of an error array — no error objects are constructed
for non-matching branches:

```js
let v0 = false          // matched flag

if (!v0) {
  let v2 = false        // ← lightweight flag, no allocation
  /* emitNode branch 0 → v2, lightweight=true */
  if (!v2) { v0 = true }
}
if (!v0) {
  let v3 = false
  /* emitNode branch 1 → v3, lightweight=true */
  if (!v3) { v0 = true }
}
if (!v0) {
  errors.push({ code: 'anyof_invalid', message: 'Value does not match any condition' })
}
```

### AllOf — Short-Circuit on First Failure

`allOf` runs branches sequentially and stops at the first failure — the opposite
of `anyOf`. Only one error is ever emitted (`allof_invalid` with `failed_at: i`).

```js
let v0 = false          // done flag

if (!v0) {
  const v1 = []
  /* emitNode branch 0 → v1 */
  if (v1.length > 0) { errors.push({ code: 'allof_invalid', data: { failed_at: 0 } }); v0 = true }
}
if (!v0) {
  const v2 = []
  /* emitNode branch 1 → v2 */
  if (v2.length > 0) { errors.push({ code: 'allof_invalid', data: { failed_at: 1 } }); v0 = true }
}
```

---

## Lightweight Mode

`anyOf`, `oneOf`, and `contains` branches only need to know **whether** a node
produced an error — not what the error was. The full error object
`{ path, code, message, data }` would be constructed and immediately discarded.

The `lightweight` flag (threaded through all `emit*` functions) changes every
`errTarget.push({ ... })` into `errTarget = true`. The per-branch `beVar`
becomes a `let` boolean instead of a `const []`.

**Why this matters**: in JavaScript, object literals are evaluated as arguments
*before* the function is called — even if the function ignores them. Removing
the push means the entire `{ path, code, message, data }` object is never
allocated. On invalid payloads where many branches fail, this compounds
per-branch and per-element.

**`allOf` is the exception**: its internal per-branch check still uses a real
`[]` (it needs `beVar.length > 0` to detect failure). Only the outer
`errTarget.push` — which reports to the parent — becomes lightweight-aware.

---

**`baseType` pre-check**: when the schema declares `$type` alongside `$all_of`
(e.g. `$type: array`), the parser stores `baseType` on the node. The codegen
emits a type check *before* running branches, wrapped in an `if/else` block so
branches are skipped entirely on type mismatch. This avoids incorrect
`allof_invalid` errors when the real problem is a type error.

**Performance**: `allOf` has no branch-error-collection overhead — a failed
branch only needs to set the done flag. This gives it a consistent edge over
`anyOf`/`oneOf` on invalid payloads.

### OneOf — Must Run All Branches

Unlike `anyOf`, `oneOf` cannot short-circuit on the first match — it must verify
that **exactly one** branch matches. Branches stop only after `count >= 2`
(already invalid):

```js
let v0 = 0              // match counter

if (v0 < 2) {
  let v1 = false        // ← lightweight flag
  /* emitNode branch 0 → v1, lightweight=true */
  if (!v1) { v0++ }
}
if (v0 < 2) {
  let v2 = false
  /* emitNode branch 1 → v2, lightweight=true */
  if (!v2) { v0++ }
}
if (v0 === 0)      errors.push({ code: 'oneof_invalid',  ... })
else if (v0 > 1)   errors.push({ code: 'oneof_multiple', ... })
```

**Consequence**: on valid payloads, `oneOf` always runs all N branches, while
`anyOf` runs only 1 on average. This is structural — not an optimization gap.

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

Benchmarks vs Ajv (2026-03-15, Node.js v24):

| Case | valid | invalid |
|---|---|---|
| flat scalars | YSS 36% faster | YSS 25% faster |
| deep object (strict) | parity | YSS 9× faster |
| array with items | YSS 3.2× faster | YSS 60% faster |
| any_of | YSS 5× faster | YSS 2.2× faster |
| all_of | YSS 3.4× faster | YSS 2.6× faster |
| contains (min-only) | YSS 2.7× faster | YSS 5× faster |
| one_of | YSS 34% faster | YSS 43% faster |

Numbers are from the isolated benchmark (`node benchmark/isolated.js`).
The composite benchmark (`npm run bm`) targets ≥50% faster overall.

**Things that did NOT help** (tested and reverted):
- `require-from-string` instead of `new Function` — no measurable difference
- Minifying the generated source string — V8 compiles to bytecode once; source
  size is irrelevant at runtime
- `errTarget.length = savedLen` (array truncation for reuse in `contains`) —
  more expensive than a fresh short-lived `[]`, which V8 can optimize via escape
  analysis. Superseded by the lightweight boolean flag anyway.

---

## DEV_MODE — Iterating on New Rules

`index.js` exposes a `DEV_MODE` flag (top of file, defaults to `false`):

```js
const DEV_MODE = false
```

When `true`, every `validate(payload)` call goes through the interpreter
(`validateNode`) instead of the compiled function. This lets you implement and
test a new rule in two steps:

1. **Interpreter first** (`DEV_MODE = true`): add the rule to the parser
   (`src/parser/index.js`), the validator (`src/rules/composites/` or
   `src/rules/scalars/`), and the validator dispatcher (`src/validator/index.js`).
   Run `npm run specs` to confirm correctness before touching the compiler.

2. **Compiler next** (`DEV_MODE = false`): implement the corresponding `emit*`
   function in `src/compiler/codegen.js`. Run `npm run specs` again — the same
   spec files cover both paths.

**Never commit with `DEV_MODE = true`** — the interpreter is ~10× slower than
the compiled path and skips all codegen coverage.

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
