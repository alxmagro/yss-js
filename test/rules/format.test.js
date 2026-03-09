import format from '../../src/rules/format.js'

describe('format — named aliases', () => {
  test('email — valid', () => {
    expect(format('user@example.com', 'email', '')).toBeNull()
  })
  test('email — invalid', () => {
    const result = format('notanemail', 'email', '')
    expect(result.code).toBe('format_invalid')
    expect(result.message).toMatch(/does not match required format/)
  })
  test('uuid — valid', () => {
    expect(format('550e8400-e29b-41d4-a716-446655440000', 'uuid', '')).toBeNull()
  })
  test('uuid — invalid', () => {
    const result = format('not-a-uuid', 'uuid', '')
    expect(result.code).toBe('format_invalid')
    expect(result.message).toMatch(/does not match required format/)
  })
  test('date — valid', () => {
    expect(format('2024-01-15', 'date', '')).toBeNull()
  })
  test('date — invalid', () => {
    const result = format('15/01/2024', 'date', '')
    expect(result.code).toBe('format_invalid')
    expect(result.message).toMatch(/does not match required format/)
  })
  test('date-time — valid', () => {
    expect(format('2024-01-01T00:00:00Z', 'date-time', '')).toBeNull()
  })
  test('date-time — invalid', () => {
    const result = format('2024-01-01', 'date-time', '')
    expect(result.code).toBe('format_invalid')
  })
  test('time — valid', () => {
    expect(format('14:30:00Z', 'time', '')).toBeNull()
  })
  test('duration — valid', () => {
    expect(format('P3D', 'duration', '')).toBeNull()
    expect(format('PT1H30M', 'duration', '')).toBeNull()
  })
  test('ipv4 — valid', () => {
    expect(format('192.168.0.1', 'ipv4', '')).toBeNull()
  })
  test('ipv4 — invalid octet', () => {
    const result = format('999.0.0.1', 'ipv4', '')
    expect(result.code).toBe('format_invalid')
  })
  test('ipv6 — valid', () => {
    expect(format('2001:db8::1', 'ipv6', '')).toBeNull()
  })
  test('hostname — valid', () => {
    expect(format('example.com', 'hostname', '')).toBeNull()
  })
  test('hostname — invalid', () => {
    const result = format('not a hostname', 'hostname', '')
    expect(result.code).toBe('format_invalid')
  })
  test('uri — valid', () => {
    expect(format('https://example.com/path', 'uri', '')).toBeNull()
  })
  test('uri — invalid', () => {
    const result = format('not-a-uri', 'uri', '')
    expect(result.code).toBe('format_invalid')
  })
  test('json-pointer — valid', () => {
    expect(format('/foo/bar/0', 'json-pointer', '')).toBeNull()
  })
  test('json-pointer — root pointer', () => {
    expect(format('', 'json-pointer', '')).toBeNull()
  })
  test('regex — valid regex string', () => {
    expect(format('^[a-z]+$', 'regex', '')).toBeNull()
  })
  test('regex — invalid regex string', () => {
    const result = format('[unclosed', 'regex', '')
    expect(result.code).toBe('format_invalid')
  })
})

describe('format — raw regex', () => {
  test('passes when value matches pattern', () => {
    expect(format('ABC123', '/^[A-Z0-9]+$/', '')).toBeNull()
  })
  test('fails when value does not match pattern', () => {
    const result = format('abc', '/^[A-Z0-9]+$/', '')
    expect(result.code).toBe('format_invalid')
  })
  test('supports case-insensitive flag', () => {
    expect(format('ABC', '/^[A-Z]+$/', '')).toBeNull()
  })
  test('supports anchored patterns', () => {
    expect(format('12345-678', '/^\\d{5}-?\\d{3}$/', '')).toBeNull()
    expect(format('1234', '/^\\d{5}-?\\d{3}$/', '')).not.toBeNull()
  })
})

describe('format — non-string passthrough', () => {
  test('returns null for numbers (type rule handles this)', () => {
    expect(format(42, 'email', '')).toBeNull()
  })
  test('returns null for null', () => {
    expect(format(null, 'email', '')).toBeNull()
  })
})
