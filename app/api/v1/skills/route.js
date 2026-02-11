import { NextResponse } from 'next/server';
import { searchSkills } from '@/lib/skill-store.js';
import { parseSkill, validateSkillMeta, extractPreview } from '@/lib/skill-parser.js';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * GET /api/v1/skills — Agent-native skill discovery endpoint.
 *
 * Query params:
 *   q         — full-text search across name, description, tags
 *   category  — filter by category
 *   tag       — filter by tag
 *   max_price — maximum price in SKILL tokens
 *   chain     — filter by accepted payment chain (base, solana)
 *   free      — "true" to show only free/open-source skills
 *
 * Response: { skills: [...], count: N, filters: {...} }
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const maxPriceRaw = searchParams.get('max_price');
    const chain = searchParams.get('chain');
    const freeOnly = searchParams.get('free') === 'true';

    // Validate maxPrice is a real non-negative number
    let maxPrice;
    if (maxPriceRaw !== null) {
      const parsed = parseFloat(maxPriceRaw);
      if (!isNaN(parsed) && parsed >= 0) maxPrice = parsed;
    }

    const skills = searchSkills({
      q: q || undefined,
      category: category || undefined,
      tag: tag || undefined,
      maxPrice,
      chain: chain || undefined,
      freeOnly,
    });

    return NextResponse.json({
      skills,
      count: skills.length,
      filters: {
        q: q || null,
        category: category || null,
        tag: tag || null,
        max_price: maxPrice ?? null,
        chain: chain || null,
        free_only: freeOnly,
      },
    });
  } catch (err) {
    console.error('GET /api/v1/skills failed:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/v1/skills — List a new skill on the marketplace.
 *
 * Body: { meta: {...}, body: "markdown content" }
 * Requires author wallet address in meta.author.
 *
 * Response: { success: true, skill: {...} } or { success: false, errors: [...] }
 */
export async function POST(request) {
  try {
    const payload = await request.json();

    if (!payload.meta || !payload.body) {
      return NextResponse.json(
        { success: false, errors: ['Request must include "meta" object and "body" string'] },
        { status: 400 }
      );
    }

    const { meta, body } = payload;

    // Validate metadata
    const validation = validateSkillMeta(meta);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, errors: validation.errors },
        { status: 400 }
      );
    }

    // Ensure skills directory exists
    const skillsDir = join(process.cwd(), 'skills');
    if (!existsSync(skillsDir)) {
      mkdirSync(skillsDir, { recursive: true });
    }

    // Check for duplicate slug
    const { getSkillBySlug } = require('@/lib/skill-store.js');
    const existing = getSkillBySlug(meta.slug);
    if (existing) {
      return NextResponse.json(
        { success: false, errors: [`Skill with slug "${meta.slug}" already exists`] },
        { status: 409 }
      );
    }

    // Build and write the .skill.md file
    const { serializeSkill } = require('@/lib/skill-parser.js');
    const fileContent = serializeSkill(meta, body);
    const filename = `${meta.slug}.skill.md`;
    writeFileSync(join(skillsDir, filename), fileContent);

    // Return the preview
    const parsed = parseSkill(fileContent);
    return NextResponse.json(
      { success: true, skill: extractPreview(parsed) },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    console.error('POST /api/v1/skills failed:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
