/**
 * Webhook Handler — Receives events from the SkillForge marketplace
 * and triggers Community Lead actions.
 *
 * Events:
 *   - skill.listed     → Announce new skill on Farcaster
 *   - skill.purchased   → Celebrate milestone / thank buyer
 *   - milestone.reached → Post about marketplace milestones
 *
 * This can be run as a standalone server or imported into the main agent.
 */

import { createServer } from 'http';
import { brain, farcaster, getMarketplaceContext } from './index.js';

const PORT = process.env.WEBHOOK_PORT || 3099;

async function handleEvent(event) {
  console.log(`[webhook] Event: ${event.type}`);

  switch (event.type) {
    case 'skill.listed': {
      const { name, slug, description, price, creator } = event.data;
      const text = await brain.composeCast('new_skill', {
        name,
        slug,
        description,
        price,
        creator,
      });
      await farcaster.post(text);
      break;
    }

    case 'skill.purchased': {
      const { skill_name, buyer_short, chain } = event.data;
      const stats = await getMarketplaceContext();
      const text = await brain.composeCast('purchase_celebration', {
        skill_name,
        buyer_short,
        chain,
        stats,
      });
      await farcaster.post(text);
      break;
    }

    case 'milestone.reached': {
      const text = await brain.composeCast('milestone', event.data);
      await farcaster.post(text);
      break;
    }

    default:
      console.log(`[webhook] Unknown event type: ${event.type}`);
  }
}

function startWebhookServer() {
  const server = createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/webhook') {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', async () => {
        try {
          const event = JSON.parse(body);
          await handleEvent(event);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
        } catch (err) {
          console.error('[webhook] Error:', err.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    } else if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', agent: 'community-lead' }));
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  server.listen(PORT, () => {
    console.log(`[webhook] Listening on port ${PORT}`);
  });

  return server;
}

export { handleEvent, startWebhookServer };

// If run directly, start the webhook server
if (process.argv[1]?.endsWith('webhooks.js')) {
  startWebhookServer();
}
