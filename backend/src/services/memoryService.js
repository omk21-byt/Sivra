const { createClient } = require('redis');
const logger = require('../utils/logger');

let redisClient = null;

// In-memory fallback if Redis not available
const inMemoryStore = new Map();

async function getRedisClient() {
  if (redisClient) return redisClient;

  try {
    const client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    client.on('error', (err) => {
      logger.warn('Redis error (using in-memory fallback):', err.message);
      redisClient = null;
    });
    await client.connect();
    redisClient = client;
    logger.info('✅ Redis connected');
    return redisClient;
  } catch (err) {
    logger.warn('Redis unavailable, using in-memory store');
    return null;
  }
}

/**
 * Get all memories for a user
 */
async function getMemories(userId) {
  try {
    const client = await getRedisClient();
    const key = `memory:${userId}`;

    if (client) {
      const data = await client.get(key);
      return data ? JSON.parse(data) : [];
    } else {
      return inMemoryStore.get(key) || [];
    }
  } catch (err) {
    logger.error('getMemories error:', err);
    return [];
  }
}

/**
 * Add new memories (deduplicated)
 */
async function addMemories(userId, newMemories) {
  try {
    const existing = await getMemories(userId);
    const combined = [...new Set([...existing, ...newMemories])];
    // Keep only latest 50 memories
    const trimmed = combined.slice(-50);
    await saveMemories(userId, trimmed);
    return trimmed;
  } catch (err) {
    logger.error('addMemories error:', err);
  }
}

/**
 * Save memories for a user
 */
async function saveMemories(userId, memories) {
  const client = await getRedisClient();
  const key = `memory:${userId}`;
  const ttl = 60 * 60 * 24 * 90; // 90 days

  if (client) {
    await client.set(key, JSON.stringify(memories), { EX: ttl });
  } else {
    inMemoryStore.set(key, memories);
  }
}

/**
 * Clear all memories for a user
 */
async function clearMemories(userId) {
  const client = await getRedisClient();
  const key = `memory:${userId}`;

  if (client) {
    await client.del(key);
  } else {
    inMemoryStore.delete(key);
  }
}

/**
 * Save conversation history (last 20 messages)
 */
async function saveConversationHistory(userId, history) {
  const client = await getRedisClient();
  const key = `history:${userId}`;
  const trimmed = history.slice(-20);

  if (client) {
    await client.set(key, JSON.stringify(trimmed), { EX: 60 * 60 * 24 });
  } else {
    inMemoryStore.set(key, trimmed);
  }
}

/**
 * Get conversation history
 */
async function getConversationHistory(userId) {
  try {
    const client = await getRedisClient();
    const key = `history:${userId}`;

    if (client) {
      const data = await client.get(key);
      return data ? JSON.parse(data) : [];
    } else {
      return inMemoryStore.get(key) || [];
    }
  } catch (err) {
    return [];
  }
}

module.exports = {
  getMemories,
  addMemories,
  saveMemories,
  clearMemories,
  saveConversationHistory,
  getConversationHistory,
};
