import { NextResponse } from 'next/server';
import { getSkillBySlug, hasPurchased } from '@/lib/skill-store.js';
import { extractPreview } from '@/lib/skill-parser.js';

/**
 * GET /api/v1/skills/:slug/download — Download a skill's full .skill.md content.
 *
 * Query params:
 *   buyer — wallet address (required for paid skills)
 *
 * For free skills: always returns the full skill content.
 * For paid skills: verifies the buyer has a confirmed purchase record.
 *
 * Response: { skill_content: "full .skill.md content", content_hash: "sha256", filename: "x.skill.md" }
 */
export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const skill = getSkillBySlug(slug);

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    const preview = extractPreview(skill);

    // Free skills: no gate
    if (preview.isFree) {
      return NextResponse.json({
        skill_content: skill.raw,
        content_hash: skill.contentHash,
        filename: skill.filename,
        access: 'free',
      });
    }

    // Paid skills: verify purchase
    const { searchParams } = new URL(request.url);
    const buyer = searchParams.get('buyer');

    if (!buyer) {
      return NextResponse.json(
        { error: 'buyer query param required for paid skills', purchase_url: `/api/v1/skills/${slug}/purchase` },
        { status: 401 }
      );
    }

    if (!hasPurchased(buyer, slug)) {
      return NextResponse.json(
        { error: 'No confirmed purchase found for this wallet', purchase_url: `/api/v1/skills/${slug}/purchase` },
        { status: 403 }
      );
    }

    return NextResponse.json({
      skill_content: skill.raw,
      content_hash: skill.contentHash,
      filename: skill.filename,
      access: 'purchased',
    });
  } catch (err) {
    console.error(`GET /api/v1/skills/${params?.slug}/download failed:`, err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
