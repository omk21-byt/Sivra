// memory.js
const express = require('express');
const router = express.Router();
const memoryService = require('../services/memoryService');

// GET /api/memory/:userId
router.get('/:userId', async (req, res) => {
  const memories = await memoryService.getMemories(req.params.userId);
  res.json({ memories });
});

// DELETE /api/memory/:userId
router.delete('/:userId', async (req, res) => {
  await memoryService.clearMemories(req.params.userId);
  res.json({ success: true });
});

module.exports = router;
