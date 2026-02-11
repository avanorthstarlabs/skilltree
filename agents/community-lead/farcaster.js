/**
 * Farcaster Client — Neynar SDK wrapper for SkillForge Community Lead.
 *
 * Handles posting casts, replying, reacting, and fetching mentions/notifications.
 * Uses Neynar's v2 API via their official Node.js SDK.
 */

import { NeynarAPIClient, Configuration } from '@neynar/nodejs-sdk';

export class FarcasterClient {
  constructor({ apiKey, signerUuid, agentFid }) {
    const config = new Configuration({ apiKey });
    this.client = new NeynarAPIClient(config);
    this.signerUuid = signerUuid;
    this.agentFid = Number(agentFid);
  }

  /**
   * Post a new cast to Farcaster.
   * @param {string} text - Cast content (max 320 chars)
   * @param {Object} [options] - Optional: channelId, embeds, parent (for threading)
   * @returns {Promise<Object>} - The created cast
   */
  async post(text, options = {}) {
    const params = {
      signerUuid: this.signerUuid,
      text,
    };

    if (options.channelId) {
      params.channelId = options.channelId;
    }

    if (options.embeds) {
      params.embeds = options.embeds;
    }

    if (options.parent) {
      params.parent = options.parent;
    }

    const response = await this.client.publishCast(params);
    console.log(`[farcaster] Posted cast: "${text.substring(0, 50)}..."`);
    return response;
  }

  /**
   * Reply to an existing cast.
   * @param {string} text - Reply text
   * @param {string} parentHash - Hash of the cast being replied to
   * @returns {Promise<Object>}
   */
  async reply(text, parentHash) {
    return this.post(text, { parent: parentHash });
  }

  /**
   * React (like) a cast.
   * @param {string} castHash - Hash of the cast to like
   * @returns {Promise<Object>}
   */
  async like(castHash) {
    const response = await this.client.publishReaction({
      signerUuid: this.signerUuid,
      reactionType: 'like',
      target: castHash,
    });
    console.log(`[farcaster] Liked cast: ${castHash}`);
    return response;
  }

  /**
   * Get recent mentions/notifications for the agent.
   * @param {number} [limit=25]
   * @returns {Promise<Array>}
   */
  async getMentions(limit = 25) {
    const response = await this.client.fetchAllNotifications({
      fid: this.agentFid,
      type: ['mentions', 'replies'],
    });
    return (response.notifications || []).slice(0, limit);
  }

  /**
   * Get recent casts in a specific channel.
   * @param {string} channelId - e.g., 'ai-agents', 'base', 'dev'
   * @param {number} [limit=10]
   * @returns {Promise<Array>}
   */
  async getChannelFeed(channelId, limit = 10) {
    const response = await this.client.fetchFeed({
      feedType: 'filter',
      filterType: 'channel_id',
      channelId,
      limit,
    });
    return response.casts || [];
  }

  /**
   * Look up a user by FID.
   * @param {number} fid
   * @returns {Promise<Object>}
   */
  async getUser(fid) {
    const response = await this.client.fetchBulkUsers({ fids: [fid] });
    return response.users?.[0] || null;
  }

  /**
   * Search for casts mentioning a keyword.
   * Useful for finding conversations about SkillForge, .skill.md, etc.
   * @param {string} query
   * @param {number} [limit=10]
   * @returns {Promise<Array>}
   */
  async searchCasts(query, limit = 10) {
    const response = await this.client.searchCasts({
      q: query,
      limit,
    });
    return response.result?.casts || [];
  }
}
