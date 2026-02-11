import { NextResponse } from 'next/server';
import { getSkillPreview } from '@/lib/skill-store.js';

/**
 * GET /api/v1/skills/:slug/preview — Always returns preview only (no body).
 *
 * This is the primary endpoint agents use to evaluate a skill before purchasing.
 * Returns all metadata, inputs/outputs, pricing, stats — but never the body.
 */
export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const preview = getSkillPreview(slug);

    if (!preview) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...preview,
      access: 'preview',
      actions: {
        purchase: preview.isFree ? null : `/api/v1/skills/${slug}/purchase`,
        download: preview.isFree ? `/api/v1/skills/${slug}/download` : null,
        full: preview.isFree ? `/api/v1/skills/${slug}` : null,
      },
    });
  } catch (err) {
    console.error(`GET /api/v1/skills/${params?.slug}/preview failed:`, err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
