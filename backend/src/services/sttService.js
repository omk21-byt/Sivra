const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Transcribe audio buffer using OpenAI Whisper
 * @param {Buffer} audioBuffer - Raw audio data
 * @param {string} mimeType - Audio MIME type (audio/webm, audio/wav, etc.)
 * @returns {Promise<{text: string, language: string}>}
 */
async function transcribeAudio(audioBuffer, mimeType = 'audio/webm') {
  const tmpDir = path.join(__dirname, '../../temp');
  
  // Ensure temp dir exists
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const extension = getExtension(mimeType);
  const tmpFile = path.join(tmpDir, `${uuidv4()}.${extension}`);

  try {
    // Write buffer to temp file (Whisper needs a file)
    fs.writeFileSync(tmpFile, audioBuffer);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tmpFile),
      model: process.env.WHISPER_MODEL || 'whisper-1',
      response_format: 'verbose_json', // Get language detection too
      temperature: 0,
    });

    logger.debug(`Transcribed: "${transcription.text}" (lang: ${transcription.language})`);

    return {
      text: transcription.text,
      language: transcription.language,
      duration: transcription.duration,
    };

  } catch (error) {
    logger.error('STT error:', error);
    throw new Error(`Transcription failed: ${error.message}`);
  } finally {
    // Clean up temp file
    if (fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }
  }
}

function getExtension(mimeType) {
  const map = {
    'audio/webm': 'webm',
    'audio/wav': 'wav',
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
    'audio/m4a': 'm4a',
    'audio/mp4': 'mp4',
  };
  return map[mimeType] || 'webm';
}

module.exports = { transcribeAudio };
