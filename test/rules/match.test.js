import match from '../../src/rules/match.js'

describe('match — named aliases', () => {
  test('email — valid', () => {
    expect(match('user@example.com', 'email', '')).toBeNull()
  })
  test('email — invalid', () => {
    const result = match('notanemail', 'email', '')
    expect(result.code).toBe('match_invalid')
    expect(result.message).toMatch(/expected String =~ email/)
  })
  test('uuid — valid', () => {
    expect(match('550e8400-e29b-41d4-a716-446655440000', 'uuid', '')).toBeNull()
  })
  test('uuid — invalid', () => {
    const result = match('not-a-uuid', 'uuid', '')
    expect(result.code).toBe('match_invalid')
    expect(result.message).toMatch(/expected String =~ uuid/)
  })
  test('date — valid', () => {
    expect(match('2024-01-15', 'date', '')).toBeNull()
  })
  test('date — invalid', () => {
    const result = match('15/01/2024', 'date', '')
    expect(result.code).toBe('match_invalid')
    expect(result.message).toMatch(/expected String =~ date/)
  })
  test('date-time — valid', () => {
    expect(match('2024-01-01T00:00:00Z', 'date-time', '')).toBeNull()
  })
  test('date-time — invalid', () => {
    const result = match('2024-01-01', 'date-time', '')
    expect(result.code).toBe('match_invalid')
  })
  test('time — valid', () => {
    expect(match('14:30:00Z', 'time', '')).toBeNull()
  })
  test('duration — valid', () => {
    expect(match('P3D', 'duration', '')).toBeNull()
    expect(match('PT1H30M', 'duration', '')).toBeNull()
  })
  test('ipv4 — valid', () => {
    expect(match('192.168.0.1', 'ipv4', '')).toBeNull()
  })
  test('ipv4 — invalid octet', () => {
    const result = match('999.0.0.1', 'ipv4', '')
    expect(result.code).toBe('match_invalid')
  })
  test('ipv6 — valid', () => {
    expect(match('2001:db8::1', 'ipv6', '')).toBeNull()
  })
  test('hostname — valid', () => {
    expect(match('example.com', 'hostname', '')).toBeNull()
  })
  test('hostname — invalid', () => {
    const result = match('not a hostname', 'hostname', '')
    expect(result.code).toBe('match_invalid')
  })
  test('uri — valid', () => {
    expect(match('https://example.com/path', 'uri', '')).toBeNull()
  })
  test('uri — invalid', () => {
    const result = match('not-a-uri', 'uri', '')
    expect(result.code).toBe('match_invalid')
  })
  test('json-pointer — valid', () => {
    expect(match('/foo/bar/0', 'json-pointer', '')).toBeNull()
  })
  test('json-pointer — root pointer', () => {
    expect(match('', 'json-pointer', '')).toBeNull()
  })
  test('regex — valid regex string', () => {
    expect(match('^[a-z]+$', 'regex', '')).toBeNull()
  })
  test('regex — invalid regex string', () => {
    const result = match('[unclosed', 'regex', '')
    expect(result.code).toBe('match_invalid')
  })
})

describe('match — raw regex', () => {
  test('passes when value matches pattern', () => {
    expect(match('ABC123', '/^[A-Z0-9]+$/', '')).toBeNull()
  })
  test('fails when value does not match pattern', () => {
    const result = match('abc', '/^[A-Z0-9]+$/', '')
    expect(result.code).toBe('match_invalid')
  })
  test('supports case-insensitive flag', () => {
    expect(match('abc', '/^[A-Z]+$/i', '')).toBeNull()
  })
  test('supports anchored patterns', () => {
    expect(match('12345-678', '/^\\d{5}-?\\d{3}$/', '')).toBeNull()
    expect(match('1234', '/^\\d{5}-?\\d{3}$/', '')).not.toBeNull()
  })
})

describe('match — non-string passthrough', () => {
  test('returns null for numbers (type rule handles this)', () => {
    expect(match(42, 'email', '')).toBeNull()
  })
  test('returns null for null', () => {
    expect(match(null, 'email', '')).toBeNull()
  })
})