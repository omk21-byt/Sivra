const express = require('express');
const router = express.Router();
const multer = require('multer');
const { generateResponse } = require('../services/aiService');
const { transcribeAudio } = require('../services/sttService');
const { textToSpeech } = require('../services/ttsService');
const memoryService = require('../services/memoryService');
const logger = require('../utils/logger');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// POST /api/chat/text
router.post('/text', async (req, res) => {
  try {
    const { userId = 'anonymous', message } = req.body;

    if (!message) return res.status(400).json({ error: 'Message is required' });

    const history = await memoryService.getConversationHistory(userId);
    const { text, usage } = await generateResponse(userId, message, history);

    const updatedHistory = [
      ...history,
      { role: 'user', content: message },
      { role: 'assistant', content: text },
    ];
    await memoryService.saveConversationHistory(userId, updatedHistory);

    res.json({ text, usage });
  } catch (err) {
    logger.error('Chat text error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat/audio — upload audio, get text response
router.post('/audio', upload.single('audio'), async (req, res) => {
  try {
    const { userId = 'anonymous' } = req.body;

    if (!req.file) return res.status(400).json({ error: 'Audio file is required' });

    const { text: transcript } = await transcribeAudio(req.file.buffer, req.file.mimetype);
    const history = await memoryService.getConversationHistory(userId);
    const { text: aiResponse } = await generateResponse(userId, transcript, history);

    // Generate TTS
    const audioBuffer = await textToSpeech(aiResponse);

    const updatedHistory = [
      ...history,
      { role: 'user', content: transcript },
      { role: 'assistant', content: aiResponse },
    ];
    await memoryService.saveConversationHistory(userId, updatedHistory);

    res.json({
      transcript,
      text: aiResponse,
      audio: audioBuffer.toString('base64'),
    });
  } catch (err) {
    logger.error('Chat audio error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chat/history/:userId
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await memoryService.getConversationHistory(userId);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/chat/history/:userId
router.delete('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await memoryService.saveConversationHistory(userId, []);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
