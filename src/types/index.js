import string  from './string.js'
import integer from './integer.js'
import float   from './float.js'
import boolean_ from './boolean.js'
import null_   from './null.js'
import object  from './object.js'
import list    from './list.js'
import set_    from './set.js'
import tuple   from './tuple.js'

const registry = {}

for (const type of [string, integer, float, boolean_, null_, object, list, set_, tuple]) {
  registry[type.name] = type
}

export function getType(name) {
  return registry[name] ?? null
}

export { registry }
