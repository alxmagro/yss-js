import { emitNode } from '../../src/compiler/codegen.js'
import { CompilerContext } from '../../src/compiler/context.js'

describe('emitNode', () => {
  it('treats missing node.type as any — falls back to runtime dispatch', () => {
    const ctx = new CompilerContext()
    emitNode(ctx, 'v', { required: false }, '""')
    expect(ctx.body()).toContain('Array.isArray(v)')
  })
})
