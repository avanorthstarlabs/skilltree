/**
 * SkillForge Community Lead Agent — Main Runner
 *
 * Orchestrates the Brain (Claude), Farcaster (Neynar), and Voice (ElevenLabs)
 * to run an autonomous AI community manager for the SkillForge marketplace.
 *
 * Modes:
 *   - Interactive: Manual posting/replying via CLI
 *   - Autonomous: Scheduled posting + auto-reply to mentions
 *
 * Usage:
 *   node index.js              — Start autonomous mode
 *   node cli.js post           — Compose and post a cast
 *   node cli.js reply <hash>   — Reply to a specific cast
 *   node cli.js voice <topic>  — Generate voice content
 */

import 'dotenv/config';
import { Brain } from './personality.js';
import { FarcasterClient } from './farcaster.js';
import { VoiceEngine } from './voice.js';
import { CronJob } from 'cron';

// --- Initialize components ---

const brain = new Brain(process.env.ANTHROPIC_API_KEY);

const farcaster = new FarcasterClient({
  apiKey: process.env.NEYNAR_API_KEY,
  signerUuid: process.env.NEYNAR_SIGNER_UUID,
  agentFid: process.env.AGENT_FID,
});

const voice = new VoiceEngine({
  apiKey: process.env.ELEVENLABS_API_KEY,
  voiceId: process.env.ELEVENLABS_VOICE_ID,
});

// Track which casts we've already replied to (in-memory, resets on restart)
const repliedTo = new Set();

/**
 * Fetch live marketplace stats from SkillForge API.
 */
async function getMarketplaceContext() {
  try {
    const res = await fetch(`${process.env.SKILLFORGE_URL}/api/v1/stats`);
    if (res.ok) return await res.json();
  } catch {
    // Marketplace may be offline — that's fine
  }
  return { total_skills: '?', total_purchases: '?', note: 'marketplace offline' };
}

// --- Core behaviors ---

/**
 * Post a daily marketplace update.
 */
async function dailyUpdate() {
  console.log('[agent] Composing daily update...');
  const stats = await getMarketplaceContext();
  const text = await brain.composeCast('daily_update', {
    stats,
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
  });

  await farcaster.post(text);
  console.log('[agent] Daily update posted.');
}

/**
 * Announce a new skill listing.
 */
async function announceNewSkill(skillData) {
  console.log(`[agent] Announcing new skill: ${skillData.name}`);
  const text = await brain.composeCast('new_skill', skillData);
  await farcaster.post(text);
}

/**
 * Check mentions and reply to unanswered ones.
 */
async function engagementLoop() {
  console.log('[agent] Checking mentions...');

  try {
    const mentions = await farcaster.getMentions(10);
    const stats = await getMarketplaceContext();

    for (const notification of mentions) {
      const cast = notification.cast;
      if (!cast || repliedTo.has(cast.hash)) continue;

      console.log(`[agent] New mention from @${cast.author?.username}: "${cast.text?.substring(0, 60)}..."`);

      const replyText = await brain.composeReply(
        cast.text,
        cast.author?.username || 'anon',
        { stats }
      );

      await farcaster.reply(replyText, cast.hash);
      repliedTo.add(cast.hash);

      // Rate limit — wait 5s between replies
      await new Promise((r) => setTimeout(r, 5000));
    }
  } catch (err) {
    console.error('[agent] Engagement loop error:', err.message);
  }
}

/**
 * Generate a voice update and save to disk.
 */
async function generateVoiceUpdate(topic) {
  const stats = await getMarketplaceContext();
  const script = await brain.composeVoiceScript(topic, { stats });
  console.log(`[voice] Script:\n${script}\n`);

  const { filepath } = await voice.synthesize(script);
  console.log(`[voice] Audio saved: ${filepath}`);
  return { script, filepath };
}

// --- Autonomous mode ---

function startAutonomous() {
  console.log('='.repeat(50));
  console.log('  SkillForge Community Lead — Autonomous Mode');
  console.log('='.repeat(50));
  console.log(`  Farcaster: @${process.env.AGENT_USERNAME || 'skillforge'}`);
  console.log(`  Daily update: ${process.env.CRON_DAILY_UPDATE || '0 10 * * *'}`);
  console.log(`  Engagement check: ${process.env.CRON_ENGAGEMENT_CHECK || '*/15 * * * *'}`);
  console.log('='.repeat(50));

  // Daily marketplace update
  const dailyJob = new CronJob(
    process.env.CRON_DAILY_UPDATE || '0 10 * * *',
    dailyUpdate,
    null,
    true,
    'America/New_York'
  );

  // Engagement check every 15 minutes
  const engagementJob = new CronJob(
    process.env.CRON_ENGAGEMENT_CHECK || '*/15 * * * *',
    engagementLoop,
    null,
    true,
    'America/New_York'
  );

  console.log('[agent] Cron jobs started. Running initial engagement check...');
  engagementLoop();
}

// --- Export for CLI and programmatic use ---

export {
  brain,
  farcaster,
  voice,
  dailyUpdate,
  announceNewSkill,
  engagementLoop,
  generateVoiceUpdate,
  getMarketplaceContext,
};

// If run directly, start autonomous mode
if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  startAutonomous();
}
