/**
 * ElevenLabs Voice Module — Text-to-speech for SkillForge Community Lead.
 *
 * Converts text scripts into spoken audio using ElevenLabs' API.
 * Used for voice updates, audio explainers, and Farcaster audio casts.
 */

import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

export class VoiceEngine {
  constructor({ apiKey, voiceId }) {
    this.apiKey = apiKey;
    this.voiceId = voiceId;
    this.outputDir = join(dirname(new URL(import.meta.url).pathname), 'output', 'audio');
  }

  /**
   * Synthesize speech from text.
   * @param {string} text - The script to speak
   * @param {Object} [options] - Voice settings overrides
   * @returns {Promise<{ audioBuffer: Buffer, filename: string, filepath: string }>}
   */
  async synthesize(text, options = {}) {
    const voiceSettings = {
      stability: options.stability ?? 0.5,
      similarity_boost: options.similarity_boost ?? 0.75,
      style: options.style ?? 0.4,
      use_speaker_boost: true,
    };

    const response = await fetch(
      `${ELEVENLABS_API_BASE}/text-to-speech/${this.voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: options.model || 'eleven_multilingual_v2',
          voice_settings: voiceSettings,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs API error (${response.status}): ${error}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `skillforge-${timestamp}.mp3`;

    await mkdir(this.outputDir, { recursive: true });
    const filepath = join(this.outputDir, filename);
    await writeFile(filepath, audioBuffer);

    console.log(`[voice] Synthesized ${audioBuffer.length} bytes → ${filepath}`);

    return { audioBuffer, filename, filepath };
  }

  /**
   * List available voices from ElevenLabs account.
   * Useful for picking the right voice during setup.
   * @returns {Promise<Array<{ voice_id: string, name: string, labels: Object }>>}
   */
  async listVoices() {
    const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
      headers: { 'xi-api-key': this.apiKey },
    });

    if (!response.ok) {
      throw new Error(`Failed to list voices: ${response.status}`);
    }

    const data = await response.json();
    return data.voices.map((v) => ({
      voice_id: v.voice_id,
      name: v.name,
      labels: v.labels,
      preview_url: v.preview_url,
    }));
  }

  /**
   * Get current API usage/quota info.
   * @returns {Promise<Object>}
   */
  async getUsage() {
    const response = await fetch(`${ELEVENLABS_API_BASE}/user/subscription`, {
      headers: { 'xi-api-key': this.apiKey },
    });

    if (!response.ok) {
      throw new Error(`Failed to get usage: ${response.status}`);
    }

    const data = await response.json();
    return {
      tier: data.tier,
      character_count: data.character_count,
      character_limit: data.character_limit,
      remaining: data.character_limit - data.character_count,
    };
  }
}
