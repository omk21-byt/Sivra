const axios = require('axios');
const logger = require('../utils/logger');

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1';

/**
 * Convert text to speech using ElevenLabs
 * @param {string} text - Text to convert
 * @param {string} voiceId - ElevenLabs voice ID
 * @returns {Promise<Buffer>} - MP3 audio buffer
 */
async function textToSpeech(text, voiceId = null) {
  const vid = voiceId || process.env.ELEVENLABS_VOICE_ID;

  if (!vid) {
    throw new Error('No ElevenLabs voice ID configured');
  }

  try {
    const response = await axios.post(
      `${ELEVENLABS_BASE}/text-to-speech/${vid}/stream`,
      {
        text,
        model_id: 'eleven_turbo_v2', // Fastest model
        voice_settings: {
          stability: 0.45,        // More expressive
          similarity_boost: 0.82,
          style: 0.35,            // Style exaggeration
          use_speaker_boost: true,
        },
      },
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        responseType: 'arraybuffer',
      }
    );

    logger.debug(`TTS generated: ${text.length} chars → ${response.data.byteLength} bytes`);
    return Buffer.from(response.data);

  } catch (error) {
    logger.error('TTS error:', error.response?.data || error.message);
    throw new Error(`TTS failed: ${error.message}`);
  }
}

/**
 * Get list of available voices
 */
async function getVoices() {
  try {
    const response = await axios.get(`${ELEVENLABS_BASE}/voices`, {
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
    });
    return response.data.voices;
  } catch (error) {
    logger.error('Get voices error:', error.message);
    throw error;
  }
}

/**
 * Stream TTS audio in chunks
 */
async function streamTextToSpeech(text, voiceId, onChunk) {
  const vid = voiceId || process.env.ELEVENLABS_VOICE_ID;

  const response = await axios.post(
    `${ELEVENLABS_BASE}/text-to-speech/${vid}/stream`,
    {
      text,
      model_id: 'eleven_turbo_v2',
      voice_settings: { stability: 0.45, similarity_boost: 0.82 },
    },
    {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      responseType: 'stream',
    }
  );

  return new Promise((resolve, reject) => {
    const chunks = [];
    response.data.on('data', (chunk) => {
      chunks.push(chunk);
      onChunk(chunk);
    });
    response.data.on('end', () => resolve(Buffer.concat(chunks)));
    response.data.on('error', reject);
  });
}

module.exports = { textToSpeech, getVoices, streamTextToSpeech };
