import { emitNode } from '../../src/compiler/codegen.js'
import { CompilerContext } from '../../src/compiler/context.js'

describe('emitNode — type: any optimisations', () => {
  it('missing node.type falls back to runtime dispatch', () => {
    const ctx = new CompilerContext()
    emitNode(ctx, 'v', { required: false }, '""')
    expect(ctx.body()).toContain('Array.isArray(v)')
  })

  it('type: any with item emits array body directly (no Array.isArray guard)', () => {
    const ctx = new CompilerContext()
    emitNode(ctx, 'v', { type: 'any', item: { type: 'string', required: false } }, '""')
    const code = ctx.body()
    expect(code).not.toContain('Array.isArray(v)')
    expect(code).toContain('v.length') // emitArrayBody iterates items
  })

  it('type: any with fields emits object body directly (no typeof guard)', () => {
    const ctx = new CompilerContext()
    emitNode(ctx, 'v', { type: 'any', fields: { name: { type: 'string', required: false } } }, '""')
    const code = ctx.body()
    expect(code).not.toContain('Array.isArray(v)')
    expect(code).toContain('v["name"]') // emitObjectBody accesses field
  })
})
