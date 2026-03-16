#!/bin/bash
set -e

ROOT=$(cd "$(dirname "$0")/.." && pwd)
INTEGRATION="$ROOT/test/integration"

cleanup() {
  rm -f "$INTEGRATION"/*.tgz
  rm -rf "$INTEGRATION/node_modules"
}
trap cleanup EXIT

echo "▶ packing..."
TARBALL=$(
  npm pack --pack-destination "$INTEGRATION" --json 2>/dev/null \
  | node -e "
      process.stdin.resume()
      let d = ''
      process.stdin.on('data', c => d += c)
      process.stdin.on('end', () => console.log(JSON.parse(d)[0].filename))
    "
)

echo "▶ installing $TARBALL..."
npm install --prefix "$INTEGRATION" "$INTEGRATION/$TARBALL" --no-save --silent

echo "▶ running tests..."
node "$INTEGRATION/index.test.js"
node "$INTEGRATION/specs.test.js"
