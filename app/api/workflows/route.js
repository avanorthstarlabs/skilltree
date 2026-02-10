import { NextResponse } from 'next/server';
import { getWorkflows } from '@/lib/store.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');

    // Validate query params: if present, they must be non-empty strings.
    const fieldErrors = {};
    const validateOptionalString = (key, value) => {
      if (value === null) return undefined;
      // URLSearchParams.get always returns string|null, but keep defensive validation.
      if (typeof value !== 'string') {
        fieldErrors[key] = 'Must be a string';
        return undefined;
      }
      const trimmed = value.trim();
      if (!trimmed) {
        fieldErrors[key] = 'Must not be empty';
        return undefined;
      }
      if (trimmed.length > 200) {
        fieldErrors[key] = 'Must be 200 characters or fewer';
        return undefined;
      }
      return trimmed;
    };

    const s = validateOptionalString('search', search);
    const c = validateOptionalString('category', category);
    const t = validateOptionalString('tag', tag);

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        { error: 'Invalid query parameters', fields: fieldErrors },
        { status: 400 }
      );
    }

    const workflows = getWorkflows({ search: s, category: c, tag: t });

    return NextResponse.json(
      {
        workflows,
        filters: {
          search: s || null,
          category: c || null,
          tag: t || null
        }
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('GET /api/workflows failed', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
