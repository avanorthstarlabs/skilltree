#!/usr/bin/env node
/**
 * SkillForge Community Lead — CLI
 *
 * Manual controls for the Community Lead agent.
 *
 * Commands:
 *   node cli.js post [intent]        — Compose and post a cast
 *   node cli.js reply <hash>         — Reply to a specific cast
 *   node cli.js voice <topic>        — Generate a voice clip
 *   node cli.js mentions             — Check recent mentions
 *   node cli.js search <query>       — Search Farcaster for keywords
 *   node cli.js voices               — List available ElevenLabs voices
 *   node cli.js stats                — Show marketplace stats
 *   node cli.js dry <intent>         — Generate a cast without posting (preview only)
 */

import 'dotenv/config';
import {
  brain,
  farcaster,
  voice,
  getMarketplaceContext,
  generateVoiceUpdate,
} from './index.js';

const [,, command, ...args] = process.argv;

async function run() {
  switch (command) {
    case 'post': {
      const intent = args[0] || 'thought';
      const stats = await getMarketplaceContext();
      const text = await brain.composeCast(intent, { stats });
      console.log(`\nCast (${text.length} chars):\n${text}\n`);
      const result = await farcaster.post(text);
      console.log('Posted:', result?.cast?.hash || 'ok');
      break;
    }

    case 'reply': {
      const hash = args[0];
      if (!hash) {
        console.error('Usage: node cli.js reply <cast-hash>');
        process.exit(1);
      }
      const stats = await getMarketplaceContext();
      // Fetch the parent cast text for context
      const replyText = await brain.composeReply(
        `(cast hash: ${hash})`,
        'unknown',
        { stats, note: 'Reply generated from hash — fetch cast text for better context' }
      );
      console.log(`\nReply (${replyText.length} chars):\n${replyText}\n`);
      await farcaster.reply(replyText, hash);
      console.log('Replied.');
      break;
    }

    case 'voice': {
      const topic = args.join(' ') || 'weekly SkillForge marketplace update';
      console.log(`Generating voice for: "${topic}"...`);
      const { script, filepath } = await generateVoiceUpdate(topic);
      console.log(`\nScript:\n${script}\n\nAudio: ${filepath}`);
      break;
    }

    case 'mentions': {
      console.log('Fetching recent mentions...');
      const mentions = await farcaster.getMentions(10);
      if (mentions.length === 0) {
        console.log('No recent mentions.');
      } else {
        for (const n of mentions) {
          const c = n.cast;
          console.log(`  @${c?.author?.username}: "${c?.text?.substring(0, 80)}..." [${c?.hash?.substring(0, 10)}]`);
        }
      }
      break;
    }

    case 'search': {
      const query = args.join(' ') || 'skillforge';
      console.log(`Searching Farcaster for "${query}"...`);
      const casts = await farcaster.searchCasts(query, 5);
      for (const c of casts) {
        console.log(`  @${c.author?.username}: "${c.text?.substring(0, 80)}..."`);
      }
      break;
    }

    case 'voices': {
      console.log('Available ElevenLabs voices:');
      const voices = await voice.listVoices();
      for (const v of voices) {
        console.log(`  ${v.name} (${v.voice_id}) — ${JSON.stringify(v.labels)}`);
      }
      break;
    }

    case 'stats': {
      const stats = await getMarketplaceContext();
      console.log('Marketplace stats:', JSON.stringify(stats, null, 2));
      break;
    }

    case 'dry': {
      const intent = args[0] || 'thought';
      const stats = await getMarketplaceContext();
      const text = await brain.composeCast(intent, { stats });
      console.log(`\n[DRY RUN] Cast (${text.length} chars):\n${text}\n`);
      console.log('(Not posted — use "post" to send)');
      break;
    }

    default:
      console.log(`SkillForge Community Lead CLI

Commands:
  post [intent]     Post a cast (intents: daily_update, new_skill, milestone, thought)
  reply <hash>      Reply to a cast by hash
  voice <topic>     Generate voice content
  mentions          Check recent mentions
  search <query>    Search Farcaster
  voices            List ElevenLabs voices
  stats             Show marketplace stats
  dry [intent]      Preview a cast without posting`);
  }
}

run().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
