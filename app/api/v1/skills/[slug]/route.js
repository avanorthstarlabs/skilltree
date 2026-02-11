import { NextResponse } from 'next/server';
import { getSkillBySlug } from '@/lib/skill-store.js';
import { extractPreview } from '@/lib/skill-parser.js';

/**
 * GET /api/v1/skills/:slug — Get full skill details.
 *
 * For free skills: returns full skill including body (the executable instructions).
 * For paid skills: returns preview only (frontmatter metadata, no body).
 *
 * Use /api/v1/skills/:slug/preview for always-preview behavior.
 * Use /api/v1/skills/:slug/download with purchase token for paid skill body.
 */
export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const skill = getSkillBySlug(slug);

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    const preview = extractPreview(skill);

    // Free skills: return everything — no gate
    if (preview.isFree) {
      return NextResponse.json({
        ...preview,
        body: skill.body,
        access: 'full',
      });
    }

    // Paid skills: preview only — body requires purchase
    return NextResponse.json({
      ...preview,
      body: null,
      access: 'preview',
      purchase_url: `/api/v1/skills/${slug}/purchase`,
    });
  } catch (err) {
    console.error(`GET /api/v1/skills/${params?.slug} failed:`, err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
