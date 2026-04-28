# 🎙️ VoiceAI — Human-Like Conversational AI

> A real-time voice AI that feels genuinely human — it pauses, laughs, remembers you, and understands context.

![VoiceAI Demo](https://img.shields.io/badge/status-active-brightgreen) ![Node](https://img.shields.io/badge/node-18%2B-green) ![React](https://img.shields.io/badge/react-18-blue) ![License](https://img.shields.io/badge/license-MIT-purple)

---

## ✨ Features

- 🎤 **Real-time Voice** — Browser microphone → STT → AI → TTS pipeline
- 🧠 **Memory System** — Remembers user preferences, past conversations
- 💬 **Context Awareness** — Understands tone, emotion, and intent
- 🔊 **Expressive Voice** — Natural pauses, emphasis, emotional delivery
- ⚡ **WebSocket Streaming** — Low-latency real-time responses
- 🌐 **Multi-language** — Supports Hindi/English code-switching
- 📱 **Responsive UI** — Works on mobile and desktop

---

## 🏗️ Architecture

```
voice-ai-human/
├── backend/               # Node.js + Express + WebSocket
│   ├── src/
│   │   ├── routes/        # REST API routes
│   │   ├── services/      # STT, TTS, AI, Memory services
│   │   ├── middleware/    # Auth, rate limiting, CORS
│   │   └── utils/         # Helpers
│   ├── config/            # Environment configs
│   └── server.js          # Entry point
│
├── frontend/              # React 18 + Vite
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page components
│   │   └── utils/         # Frontend utilities
│   └── index.html
│
└── docker-compose.yml     # One-command deployment
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- OpenAI API key (for AI + Whisper STT)
- ElevenLabs API key (for TTS voice)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/voice-ai-human.git
cd voice-ai-human
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in your API keys in .env
npm run dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### 4. Open in browser
```
http://localhost:5173
```

---

## 🔑 Environment Variables

### Backend `.env`
```env
PORT=3001
NODE_ENV=development

# AI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# Voice (Text-to-Speech)
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...

# Speech-to-Text (Whisper via OpenAI)
WHISPER_MODEL=whisper-1

# Memory / DB
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-super-secret-key
CORS_ORIGIN=http://localhost:5173
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
VITE_APP_NAME=VoiceAI
```

---

## 📡 API Reference

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/text` | Send text message |
| POST | `/api/chat/audio` | Send audio blob → get response |
| GET | `/api/memory/:userId` | Get user memory |
| DELETE | `/api/memory/:userId` | Clear user memory |
| GET | `/api/voices` | List available voices |
| POST | `/api/tts` | Text → Speech audio |

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `audio_chunk` | Client → Server | Streaming audio data |
| `transcript` | Server → Client | Recognized speech text |
| `ai_response` | Server → Client | AI text response |
| `audio_response` | Server → Client | TTS audio chunk |
| `speaking_start` | Server → Client | AI started speaking |
| `speaking_end` | Server → Client | AI finished speaking |

---

## 🐳 Docker Deployment

```bash
docker-compose up --build
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend Runtime | Node.js 18 |
| Backend Framework | Express.js |
| Real-time | WebSocket (ws) |
| AI/LLM | OpenAI GPT-4o |
| Speech-to-Text | OpenAI Whisper |
| Text-to-Speech | ElevenLabs |
| Memory/Cache | Redis |
| Frontend | React 18 + Vite |
| Styling | CSS Modules + CSS Variables |
| Animations | Framer Motion |
| Audio | Web Audio API |

---

## 📁 Project Structure (detailed)

```
backend/src/
├── routes/
│   ├── chat.js          # Chat endpoints
│   ├── memory.js        # Memory CRUD
│   ├── voice.js         # TTS/STT endpoints
│   └── health.js        # Health check
├── services/
│   ├── aiService.js     # OpenAI GPT integration
│   ├── sttService.js    # Whisper STT
│   ├── ttsService.js    # ElevenLabs TTS
│   ├── memoryService.js # User memory management
│   └── wsService.js     # WebSocket handler
├── middleware/
│   ├── auth.js          # JWT auth
│   ├── rateLimit.js     # Rate limiting
│   └── errorHandler.js  # Global error handler
└── utils/
    ├── logger.js        # Winston logger
    └── audioUtils.js    # Audio processing helpers

frontend/src/
├── components/
│   ├── VoiceOrb/        # Animated voice visualizer
│   ├── ChatBubble/      # Message bubbles
│   ├── AudioWave/       # Waveform animation
│   ├── MemoryPanel/     # Shows AI memories
│   └── Controls/        # Mic, settings controls
├── hooks/
│   ├── useVoice.js      # Mic recording hook
│   ├── useWebSocket.js  # WS connection hook
│   ├── useAudio.js      # Audio playback hook
│   └── useMemory.js     # Memory state hook
└── pages/
    ├── Home.jsx         # Landing page
    └── Chat.jsx         # Main chat interface
```

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

Built with ❤️ — inspired by [rumik.ai](https://rumik.ai)
