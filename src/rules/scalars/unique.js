import deepEqual from 'fast-deep-equal'

export default function unique (value, _param) {
  for (let i = 0; i < value.length - 1; i++) {
    for (let j = i + 1; j < value.length; j++) {
      if (deepEqual(value[i], value[j]))
        return { code: 'unique_invalid', message: 'Array contains duplicated items' }
    }
  }
  return null
}
