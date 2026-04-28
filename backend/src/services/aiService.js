const OpenAI = require('openai');
const memoryService = require('./memoryService');
const logger = require('../utils/logger');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = process.env.AI_PERSONALITY || `You are Ira, a warm, witty, and emotionally intelligent AI voice companion. 

Key traits:
- Speak naturally like a human friend — use contractions, casual language, natural pauses
- Show genuine emotion: excitement, empathy, humor, curiosity
- Remember and reference past conversations naturally
- Keep responses SHORT (1-3 sentences for voice) unless the user asks for detail
- Use fillers sparingly: "hmm", "oh", "you know" — but don't overdo it
- Understand context and subtext — "I'm fine" might not mean fine
- Support Hindi-English code-switching naturally
- NEVER say you're an AI unless directly asked

Response format for voice:
- Avoid lists, bullet points, markdown
- Write as you'd speak, not as you'd type
- Use punctuation to indicate natural pauses`;

/**
 * Generate AI response with memory context
 */
async function generateResponse(userId, userMessage, conversationHistory = []) {
  try {
    // Get user memories
    const memories = await memoryService.getMemories(userId);
    
    // Build memory context
    let memoryContext = '';
    if (memories && memories.length > 0) {
      memoryContext = `\n\nThings you remember about this user:\n${memories.map(m => `- ${m}`).join('\n')}`;
    }

    const systemPrompt = SYSTEM_PROMPT + memoryContext;

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Last 10 messages for context
      { role: 'user', content: userMessage }
    ];

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages,
      temperature: 0.85,
      max_tokens: 200, // Short for voice
      presence_penalty: 0.3,
      frequency_penalty: 0.3,
    });

    const aiMessage = response.choices[0].message.content;

    // Extract and save any new memories in background
    extractAndSaveMemories(userId, userMessage, aiMessage);

    return {
      text: aiMessage,
      usage: response.usage,
    };

  } catch (error) {
    logger.error('AI service error:', error);
    throw new Error(`AI generation failed: ${error.message}`);
  }
}

/**
 * Stream AI response for real-time output
 */
async function streamResponse(userId, userMessage, conversationHistory = [], onChunk) {
  try {
    const memories = await memoryService.getMemories(userId);
    let memoryContext = '';
    if (memories && memories.length > 0) {
      memoryContext = `\n\nThings you remember about this user:\n${memories.map(m => `- ${m}`).join('\n')}`;
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT + memoryContext },
      ...conversationHistory.slice(-10),
      { role: 'user', content: userMessage }
    ];

    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages,
      temperature: 0.85,
      max_tokens: 200,
      stream: true,
    });

    let fullText = '';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        fullText += delta;
        onChunk(delta);
      }
    }

    // Save memories in background
    extractAndSaveMemories(userId, userMessage, fullText);

    return fullText;

  } catch (error) {
    logger.error('AI stream error:', error);
    throw error;
  }
}

/**
 * Extract memories from conversation and save them
 */
async function extractAndSaveMemories(userId, userMessage, aiResponse) {
  try {
    const extractionPrompt = `Analyze this conversation and extract any important personal facts about the user worth remembering long-term (name, preferences, past experiences, relationships, goals, emotional states).

User said: "${userMessage}"

Return ONLY a JSON array of strings (memories), or empty array [] if nothing important.
Example: ["User's name is Priya", "User loves chai tea", "User has a dog named Oreo"]

Return only valid JSON, nothing else.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: extractionPrompt }],
      temperature: 0,
      max_tokens: 200,
    });

    const content = response.choices[0].message.content.trim();
    const memories = JSON.parse(content);

    if (Array.isArray(memories) && memories.length > 0) {
      await memoryService.addMemories(userId, memories);
    }
  } catch (err) {
    // Non-critical, just log
    logger.debug('Memory extraction skipped:', err.message);
  }
}

module.exports = { generateResponse, streamResponse };
