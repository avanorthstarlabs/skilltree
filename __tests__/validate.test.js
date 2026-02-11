import { validateInputs } from '../lib/validate';

const testSchema = {
  required: ['title', 'severity'],
  properties: {
    title: { type: 'string', label: 'Bug Title', minLength: 5 },
    severity: { type: 'enum', label: 'Severity', options: ['low', 'medium', 'high', 'critical'] },
    description: { type: 'string', label: 'Description' },
    urgent: { type: 'boolean', label: 'Urgent' },
  },
};

describe('validateInputs', () => {
  test('passes with valid input', () => {
    const result = validateInputs(testSchema, {
      title: 'Login button broken',
      severity: 'high',
      description: 'Cannot click login',
      urgent: true,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('fails when required fields missing', () => {
    const result = validateInputs(testSchema, {});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Bug Title is required');
    expect(result.errors).toContain('Severity is required');
  });

  test('fails when string too short', () => {
    const result = validateInputs(testSchema, {
      title: 'Hi',
      severity: 'low',
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/at least 5 characters/);
  });

  test('fails when enum value invalid', () => {
    const result = validateInputs(testSchema, {
      title: 'Valid title here',
      severity: 'extreme',
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/must be one of/);
  });

  test('fails when boolean field gets string', () => {
    const result = validateInputs(testSchema, {
      title: 'Valid title here',
      severity: 'low',
      urgent: 'yes',
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/must be true or false/);
  });

  test('passes with no schema', () => {
    const result = validateInputs(null, { anything: 'goes' });
    expect(result.valid).toBe(true);
  });

  test('passes with empty schema properties', () => {
    const result = validateInputs({}, { anything: 'goes' });
    expect(result.valid).toBe(true);
  });
});
