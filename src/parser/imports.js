/**
 * Handles $imports resolution and $ref substitution.
 *
 * loadImports(rawImports, baseDir)
 *   Compiles each imported file in isolation and returns a map of
 *   namespace -> compiled tree. Also registers each file's $patterns
 *   into the global aliases registry under the namespace prefix.
 *
 * resolveRefs(node, importedTrees)
 *   Walks a schema tree and substitutes every { $ref } node with the
 *   corresponding compiled tree from importedTrees.
 */

import { readFileSync }    from 'node:fs'
import { resolve, dirname } from 'node:path'
import { load }            from 'js-yaml'
import { registerPatterns } from '../aliases.js'

/**
 * Compile an imported file in isolation and return its tree.
 * Extracted here to avoid a circular dependency with parser/index.js —
 * the caller (buildTree) passes buildTree itself as a parameter.
 *
 * @param {string}   filePath   - absolute path to the .yaml file
 * @param {Function} buildTree  - buildTree function from parser/index.js
 * @returns {object} compiled schema tree
 */
function compileFile (filePath, buildTree) {
  const content = readFileSync(filePath, 'utf8')
  const raw     = load(content)
  return buildTree(raw)
}

/**
 * Load and compile all $imports in isolation.
 * Registers each file's $patterns under "namespace.pattern-name".
 *
 * @param {object}   rawImports  - raw $imports map { namespace: './path.yaml' }
 * @param {string}   baseDir     - directory of the file declaring $imports
 * @param {Function} buildTree   - buildTree function from parser/index.js
 * @returns {object} map of namespace -> compiled tree
 */
export function loadImports (rawImports, baseDir, buildTree) {
  const importedTrees = {}

  for (const [namespace, relativePath] of Object.entries(rawImports)) {
    const absolutePath = resolve(baseDir, relativePath)

    // Load raw YAML to extract $patterns before compiling
    const content   = readFileSync(absolutePath, 'utf8')
    const raw       = load(content)

    // Register $patterns from the imported file under namespace prefix
    if (raw.$patterns && typeof raw.$patterns === 'object') {
      const prefixed = Object.fromEntries(
        Object.entries(raw.$patterns).map(([name, regex]) => [
          `${namespace}.${name}`,
          regex,
        ])
      )
      registerPatterns(prefixed)
    }

    // Compile the imported file in isolation (its own $patterns are registered
    // without prefix inside compileFile via buildTree)
    importedTrees[namespace] = compileFile(absolutePath, buildTree)
  }

  return importedTrees
}

/**
 * Walk a schema tree and replace every $ref node with the compiled tree
 * it references. Supports dot navigation: "$ref: user.profile" resolves
 * to importedTrees.user.fields.profile.
 *
 * @param {object} node          - schema node to walk
 * @param {object} importedTrees - map of namespace -> compiled tree
 * @returns {object} node with $ref nodes substituted
 */
export function resolveRefs (node, importedTrees) {
  if (!node || typeof node !== 'object') return node

  // Resolve $ref node
  if (node.$ref) {
    const parts     = node.$ref.split('.')
    const namespace = parts[0]
    const path      = parts.slice(1)

    let resolved = importedTrees[namespace]

    if (!resolved) {
      throw new Error(`$ref: unknown import namespace "${namespace}"`)
    }

    // Navigate dot path if present
    for (const key of path) {
      if (!resolved.fields || !(key in resolved.fields)) {
        throw new Error(`$ref: "${node.$ref}" - field "${key}" not found`)
      }
      resolved = resolved.fields[key]
    }

    // Merge $optional if declared alongside $ref
    if (node.optional) {
      return { ...resolved, optional: true }
    }

    return resolved
  }

  // Recurse into known node properties
  const result = { ...node }

  if (node.fields) {
    result.fields = Object.fromEntries(
      Object.entries(node.fields).map(([k, v]) => [k, resolveRefs(v, importedTrees)])
    )
  }

  if (node.item)  result.item  = resolveRefs(node.item, importedTrees)
  if (node.anyOf) result.anyOf = node.anyOf.map(b => resolveRefs(b, importedTrees))

  if (node.at) {
    result.at = Object.fromEntries(
      Object.entries(node.at).map(([k, v]) => [k, resolveRefs(v, importedTrees)])
    )
  }

  return result
}
