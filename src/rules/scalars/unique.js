export default function unique (value, _param) {
  const seen = new Set()
  for (const item of value) {
    const key = JSON.stringify(item)

    if (seen.has(key))
      return { code: 'unique_invalid', message: 'Array contains duplicated items' }
    seen.add(key)
  }

  return null
}
