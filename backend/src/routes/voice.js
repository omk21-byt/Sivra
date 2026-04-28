const express = require('express');
const router = express.Router();
const { textToSpeech, getVoices } = require('../services/ttsService');

// GET /api/voice/voices
router.get('/voices', async (req, res) => {
  try {
    const voices = await getVoices();
    res.json({ voices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/voice/tts
router.post('/tts', async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const audio = await textToSpeech(text, voiceId);
    res.set('Content-Type', 'audio/mpeg');
    res.send(audio);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
