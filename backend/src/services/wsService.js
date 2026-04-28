const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { transcribeAudio } = require('./sttService');
const { generateResponse, streamResponse } = require('./aiService');
const { textToSpeech } = require('./ttsService');
const memoryService = require('./memoryService');

const clients = new Map();

function init(wss) {
  wss.on('connection', (ws, req) => {
    const clientId = uuidv4();
    const userId = new URL(req.url, 'http://localhost').searchParams.get('userId') || clientId;

    clients.set(clientId, { ws, userId, audioChunks: [] });
    logger.info(`WS client connected: ${clientId} (user: ${userId})`);

    send(ws, 'connected', { clientId, userId });

    ws.on('message', async (data) => {
      try {
        // Try JSON first (text events)
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          // Binary = audio chunk
          const client = clients.get(clientId);
          if (client) client.audioChunks.push(data);
          return;
        }

        await handleMessage(clientId, userId, ws, parsed);

      } catch (err) {
        logger.error(`WS message error [${clientId}]:`, err);
        send(ws, 'error', { message: err.message });
      }
    });

    ws.on('close', () => {
      clients.delete(clientId);
      logger.info(`WS client disconnected: ${clientId}`);
    });

    ws.on('error', (err) => {
      logger.error(`WS error [${clientId}]:`, err);
    });
  });

  logger.info('🔌 WebSocket service initialized');
}

async function handleMessage(clientId, userId, ws, message) {
  const { type, payload } = message;

  switch (type) {

    case 'audio_start':
      // User started recording
      clients.get(clientId).audioChunks = [];
      send(ws, 'listening', {});
      break;

    case 'audio_end': {
      // User stopped — process audio
      const client = clients.get(clientId);
      if (!client || client.audioChunks.length === 0) {
        send(ws, 'error', { message: 'No audio data received' });
        return;
      }

      const audioBuffer = Buffer.concat(client.audioChunks);
      client.audioChunks = [];

      send(ws, 'processing', { stage: 'transcribing' });

      // STT
      const { text: transcript, language } = await transcribeAudio(audioBuffer, payload?.mimeType);
      send(ws, 'transcript', { text: transcript, language });

      if (!transcript.trim()) {
        send(ws, 'error', { message: 'Could not understand audio' });
        return;
      }

      // Get conversation history
      const history = await memoryService.getConversationHistory(userId);

      send(ws, 'processing', { stage: 'thinking' });

      // Stream AI response
      let fullResponse = '';
      let buffer = '';

      await streamResponse(userId, transcript, history, async (chunk) => {
        fullResponse += chunk;
        buffer += chunk;
        send(ws, 'text_chunk', { chunk });

        // Send TTS when we have a sentence
        if (endsWithSentence(buffer) && buffer.trim().length > 20) {
          const sentenceText = buffer.trim();
          buffer = '';

          try {
            send(ws, 'speaking_start', {});
            const audio = await textToSpeech(sentenceText);
            send(ws, 'audio_chunk', {
              audio: audio.toString('base64'),
              text: sentenceText,
            });
          } catch (ttsErr) {
            logger.error('TTS chunk error:', ttsErr);
          }
        }
      });

      // Send any remaining buffer
      if (buffer.trim()) {
        try {
          const audio = await textToSpeech(buffer.trim());
          send(ws, 'audio_chunk', {
            audio: audio.toString('base64'),
            text: buffer.trim(),
          });
        } catch (ttsErr) {
          logger.error('TTS final error:', ttsErr);
        }
      }

      send(ws, 'speaking_end', { fullText: fullResponse });

      // Save conversation history
      const updatedHistory = [
        ...history,
        { role: 'user', content: transcript },
        { role: 'assistant', content: fullResponse },
      ];
      await memoryService.saveConversationHistory(userId, updatedHistory);

      break;
    }

    case 'text_message': {
      // Text-only mode (no voice)
      const { text } = payload;
      const history = await memoryService.getConversationHistory(userId);

      send(ws, 'processing', { stage: 'thinking' });

      const { text: response } = await generateResponse(userId, text, history);
      send(ws, 'ai_response', { text: response });

      // TTS for text messages too
      try {
        send(ws, 'speaking_start', {});
        const audio = await textToSpeech(response);
        send(ws, 'audio_chunk', { audio: audio.toString('base64'), text: response });
        send(ws, 'speaking_end', { fullText: response });
      } catch (ttsErr) {
        logger.error('TTS error:', ttsErr);
      }

      const updatedHistory = [
        ...history,
        { role: 'user', content: text },
        { role: 'assistant', content: response },
      ];
      await memoryService.saveConversationHistory(userId, updatedHistory);
      break;
    }

    case 'ping':
      send(ws, 'pong', { timestamp: Date.now() });
      break;

    default:
      logger.warn(`Unknown WS event type: ${type}`);
  }
}

function send(ws, type, payload) {
  if (ws.readyState === 1) { // OPEN
    ws.send(JSON.stringify({ type, payload, timestamp: Date.now() }));
  }
}

function endsWithSentence(text) {
  return /[.!?…]\s*$/.test(text.trim());
}

module.exports = { init };
