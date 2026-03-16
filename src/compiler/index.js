import { CompilerContext } from './context.js'
import { emitNode } from './codegen.js'

export function compileAST (ast, { bail = false } = {}) {
  const ctx = new CompilerContext({ bail })

  ctx.emit('const errors = []')
  emitNode(ctx, 'payload', ast, '""')
  ctx.emit('return errors')

  // eslint-disable-next-line no-new-func
  return new Function('refs', `return function validate(payload) {\n${ctx.body()}\n}`)(ctx.refs)
}
