import React, { useState, useEffect, useRef, useCallback } from 'react';
import VoiceOrb from '../components/VoiceOrb/VoiceOrb.jsx';
import ChatBubble from '../components/ChatBubble/ChatBubble.jsx';
import { useWebSocket } from '../hooks/useWebSocket.js';
import { useVoice } from '../hooks/useVoice.js';
import { useAudio } from '../hooks/useAudio.js';
import styles from './Chat.module.css';

// mode: 'idle' | 'listening' | 'thinking' | 'speaking'
export default function Chat({ userId, onBack }) {
  const [mode, setMode] = useState('idle');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'hey! i\'m ira. tap the orb and let\'s talk 🎙️' }
  ]);
  const [streamingText, setStreamingText] = useState('');
  const [textInput, setTextInput] = useState('');
  const [showText, setShowText] = useState(false);
  const messagesEndRef = useRef(null);
  const mimeTypeRef = useRef('audio/webm');

  const { status, send, sendBinary, on } = useWebSocket(userId);
  const { isRecording, startRecording, stopRecording } = useVoice();
  const { isPlaying, playBase64Audio } = useAudio();

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Register WS event handlers
  useEffect(() => {
    on('connected', () => console.log('WS connected'));

    on('listening', () => setMode('listening'));

    on('transcript', ({ text }) => {
      if (text.trim()) {
        addMessage('user', text);
      }
      setMode('thinking');
    });

    on('processing', ({ stage }) => {
      if (stage === 'thinking') setMode('thinking');
    });

    on('text_chunk', ({ chunk }) => {
      setStreamingText(prev => prev + chunk);
    });

    on('audio_chunk', async ({ audio, text }) => {
      setMode('speaking');
      await playBase64Audio(audio);
    });

    on('speaking_end', ({ fullText }) => {
      if (fullText) {
        addMessage('assistant', fullText);
        setStreamingText('');
      }
      setMode('idle');
    });

    on('ai_response', ({ text }) => {
      setStreamingText('');
      addMessage('assistant', text);
    });

    on('error', ({ message }) => {
      console.error('WS error:', message);
      setMode('idle');
    });
  }, [on, playBase64Audio]);

  const addMessage = useCallback((role, text) => {
    setMessages(prev => [...prev, { role, text, id: Date.now() }]);
  }, []);

  const handleOrbClick = useCallback(async () => {
    if (mode === 'listening') {
      // Stop recording
      await stopRecording();
      send('audio_end', { mimeType: mimeTypeRef.current });
      setMode('thinking');
    } else if (mode === 'idle') {
      // Start recording
      try {
        const mime = await startRecording((chunk) => {
          chunk.arrayBuffer().then(buf => sendBinary(buf));
        });
        mimeTypeRef.current = mime;
        send('audio_start', {});
        setMode('listening');
      } catch (err) {
        alert('Microphone access denied. Please allow mic access.');
      }
    }
  }, [mode, startRecording, stopRecording, send, sendBinary]);

  const handleSendText = useCallback(() => {
    const text = textInput.trim();
    if (!text || mode !== 'idle') return;
    addMessage('user', text);
    send('text_message', { text });
    setTextInput('');
    setMode('thinking');
  }, [textInput, mode, send, addMessage]);

  const isConnected = status === 'connected';

  return (
    <div className={styles.page}>
      {/* BG */}
      <div className={styles.bgMesh} />

      {/* Header */}
      <header className={styles.header}>
        <button className={styles.back} onClick={onBack}>← back</button>
        <div className={styles.aiName}>ira</div>
        <div className={`${styles.status} ${isConnected ? styles.online : styles.offline}`}>
          <span className={styles.statusDot} />
          {isConnected ? 'online' : status}
        </div>
      </header>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.map((m, i) => (
          <ChatBubble key={m.id || i} role={m.role} text={m.text} />
        ))}
        {streamingText && (
          <ChatBubble role="assistant" text={streamingText} isStreaming />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Center Orb */}
      <div className={styles.orbSection}>
        <VoiceOrb mode={mode} onClick={handleOrbClick} />
      </div>

      {/* Bottom controls */}
      <div className={styles.controls}>
        {showText ? (
          <div className={styles.textInputWrap}>
            <input
              className={styles.textInput}
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendText()}
              placeholder="type instead..."
              autoFocus
            />
            <button
              className={styles.sendBtn}
              onClick={handleSendText}
              disabled={!textInput.trim() || mode !== 'idle'}
            >↑</button>
          </div>
        ) : null}

        <div className={styles.bottomBtns}>
          <button
            className={`${styles.iconBtn} ${showText ? styles.active : ''}`}
            onClick={() => setShowText(s => !s)}
            title="Type instead"
          >⌨</button>

          <button
            className={styles.iconBtn}
            onClick={() => {
              if (confirm('Clear conversation history?')) {
                setMessages([{ role: 'assistant', text: 'fresh start! what\'s on your mind?' }]);
                fetch(`/api/chat/history/${userId}`, { method: 'DELETE' });
              }
            }}
            title="Clear history"
          >↺</button>
        </div>

        {!isConnected && (
          <div className={styles.disconnected}>reconnecting...</div>
        )}
      </div>
    </div>
  );
}
