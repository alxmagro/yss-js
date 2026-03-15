export class CompilerContext {
  constructor () {
    this._id = 0
    this._refId = 0
    this.refs = {}
    this.lines = []
  }

  nextId () { return `v${this._id++}` }

  emit (line) { this.lines.push(line) }

  body () { return this.lines.join('\n') }

  addRef (value) {
    for (const [k, v] of Object.entries(this.refs)) { if (v === value) return k }
    const k = `r${this._refId++}`
    this.refs[k] = value
    return k
  }
}
