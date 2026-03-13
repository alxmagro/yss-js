import testSize   from './size.js'
import testUnique from './unique.js'
import testGt     from './gt.js'
import testGte    from './gte.js'
import testLt     from './lt.js'
import testLte    from './lte.js'
import testFormat from './format.js'
import testIn     from './in.js'
import testNotIn  from './not_in.js'
import testConst  from './const.js'

export const scalarRules = {
  size:   testSize,
  unique: testUnique,
  gt:     testGt,
  gte:    testGte,
  lt:     testLt,
  lte:    testLte,
  format: testFormat,
  in:     testIn,
  not_in: testNotIn,
  const:  testConst
}

export function getRule (name) {
  return scalarRules[name] ?? null
}
