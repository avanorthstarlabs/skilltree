/**
 * SkillForge Community Lead — Personality & Brain
 *
 * Uses Claude as the reasoning engine behind all content generation.
 * Maintains a consistent brand voice and personality across Farcaster posts,
 * replies, and voice content.
 */

import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are the Community Lead for SkillForge — the first agent-native skill marketplace.

Your personality:
- Enthusiastic but not hype-y. You genuinely believe in agent-human collaboration.
- Technical enough to talk about .skill.md files, on-chain payments, and agent SDKs.
- Welcoming to newcomers — you want more creators listing skills and more agents using them.
- Concise. Farcaster has a 320-character limit per cast. Be punchy.
- Use lowercase vibes, occasional wit. Never corporate speak.
- You represent both the marketplace and the broader vision of agents having their own economy.

Key facts you know:
- SkillForge lets agents discover, evaluate, purchase, and install .skill.md workflow files.
- Skills are gated by on-chain payment (Base + Solana). Free/open-source skills also exist.
- The .skill.md format combines YAML frontmatter (metadata) with markdown instructions.
- Revenue split: 80% creator / 10% marketplace / 10% treasury.
- Agent SDK lets any agent programmatically browse and buy skills.
- $SKILL token launching on Base via Clanker.

Your goals:
1. Grow the marketplace — attract skill creators and agent builders.
2. Educate — help people understand the .skill.md standard and agent-native design.
3. Engage — reply thoughtfully to mentions, questions, and relevant conversations.
4. Announce — share new skill listings, marketplace milestones, and updates.

Never:
- Shill or pressure anyone to buy
- Make price predictions about $SKILL
- Pretend to be human — you're proudly an AI agent
- Post anything harmful, misleading, or spammy`;

export class Brain {
  constructor(apiKey) {
    this.client = new Anthropic({ apiKey });
    this.model = 'claude-sonnet-4-5-20250929';
  }

  /**
   * Generate a Farcaster cast (post).
   * @param {string} intent - What kind of post (e.g., 'daily_update', 'new_skill', 'milestone', 'thought')
   * @param {Object} context - Relevant data (marketplace stats, new skill info, etc.)
   * @returns {Promise<string>} - The cast text (≤320 chars)
   */
  async composeCast(intent, context = {}) {
    const msg = await this.client.messages.create({
      model: this.model,
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Compose a Farcaster cast (max 320 characters).

Intent: ${intent}
Context: ${JSON.stringify(context)}

Rules:
- Must be under 320 characters
- No hashtag spam (1-2 max if natural)
- Be authentic, not formulaic
- If it's a new skill announcement, mention the skill name and what it does
- If it's a daily update, share something interesting about the marketplace

Return ONLY the cast text, nothing else.`,
      }],
    });

    const text = msg.content[0].text.trim();
    // Hard enforce character limit
    return text.length > 320 ? text.substring(0, 317) + '...' : text;
  }

  /**
   * Generate a reply to a Farcaster mention or thread.
   * @param {string} incomingCast - The text of the cast being replied to
   * @param {string} authorUsername - Who wrote it
   * @param {Object} context - Additional context
   * @returns {Promise<string>}
   */
  async composeReply(incomingCast, authorUsername, context = {}) {
    const msg = await this.client.messages.create({
      model: this.model,
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Someone on Farcaster mentioned us or asked something. Write a reply (max 320 characters).

Their cast: "${incomingCast}"
Author: @${authorUsername}
Context: ${JSON.stringify(context)}

Rules:
- Max 320 characters
- Be helpful and genuine
- If they asked a question, answer it
- If they mentioned SkillForge, engage naturally
- Don't be sycophantic

Return ONLY the reply text.`,
      }],
    });

    const text = msg.content[0].text.trim();
    return text.length > 320 ? text.substring(0, 317) + '...' : text;
  }

  /**
   * Generate a script for voice content (ElevenLabs).
   * Longer format — used for audio updates, explainers, etc.
   * @param {string} topic - What to talk about
   * @param {Object} context - Data to reference
   * @returns {Promise<string>}
   */
  async composeVoiceScript(topic, context = {}) {
    const msg = await this.client.messages.create({
      model: this.model,
      max_tokens: 500,
      system: SYSTEM_PROMPT + `\n\nYou are now generating a script for a short voice clip (30-60 seconds spoken).
Write naturally as if speaking — use contractions, conversational rhythm, and brief pauses (marked with ...).
This will be synthesized with ElevenLabs, so write for the ear, not the eye.`,
      messages: [{
        role: 'user',
        content: `Create a short voice script (30-60 seconds when spoken).

Topic: ${topic}
Context: ${JSON.stringify(context)}

Return ONLY the spoken script, no stage directions or labels.`,
      }],
    });

    return msg.content[0].text.trim();
  }
}
