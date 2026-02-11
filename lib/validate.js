/**
 * Input validation against workflow inputs_schema.
 * Returns { valid: boolean, errors: string[] }
 */
export function validateInputs(schema, payload) {
  const errors = [];

  if (!schema || !schema.properties) {
    return { valid: true, errors: [] };
  }

  const required = schema.required || [];

  for (const field of required) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      const prop = schema.properties[field];
      const label = prop?.label || field;
      errors.push(`${label} is required`);
    }
  }

  for (const [key, prop] of Object.entries(schema.properties)) {
    const value = payload[key];
    if (value === undefined || value === null || value === '') continue;

    if (prop.type === 'string' && typeof value !== 'string') {
      errors.push(`${prop.label || key} must be a string`);
    }

    if (prop.type === 'string' && prop.minLength && typeof value === 'string' && value.length < prop.minLength) {
      errors.push(`${prop.label || key} must be at least ${prop.minLength} characters`);
    }

    if (prop.type === 'enum' && prop.options && !prop.options.includes(value)) {
      errors.push(`${prop.label || key} must be one of: ${prop.options.join(', ')}`);
    }

    if (prop.type === 'boolean' && typeof value !== 'boolean') {
      errors.push(`${prop.label || key} must be true or false`);
    }

    if (prop.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push(`${prop.label || key} must be an array`);
      } else if (prop.options && prop.options.length > 0) {
        const invalid = value.filter(v => !prop.options.includes(v));
        if (invalid.length > 0) {
          errors.push(`${prop.label || key} contains invalid values: ${invalid.join(', ')}. Allowed: ${prop.options.join(', ')}`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
