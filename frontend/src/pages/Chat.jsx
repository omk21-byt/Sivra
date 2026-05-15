import React, {
  useState,
  useEffect,
  useRef,
  useCallback
} from "react";

import VoiceOrb from "../components/VoiceOrb/VoiceOrb.jsx";
import ChatBubble from "../components/ChatBubble/ChatBubble.jsx";
import { useWebSocket } from "../hooks/useWebSocket.js";
import { useVoice } from "../hooks/useVoice.js";
import { useAudio } from "../hooks/useAudio.js";
import styles from "./Chat.module.css";

export default function Chat({ userId, onBack }) {
  const [mode, setMode] = useState("idle");
  const [messages, setMessages] = useState([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      text: "Hey! I'm Ira. Tap the orb and let's talk 🎙️"
    }
  ]);
  const [streamingText, setStreamingText] = useState("");
  const [textInput, setTextInput] = useState("");
  const [showText, setShowText] = useState(false);

  const messagesEndRef = useRef(null);
  const mimeTypeRef = useRef("audio/webm");

  const { status, send, sendBinary, on } = useWebSocket(userId);
  const { startRecording, stopRecording } = useVoice();
  const { playBase64Audio } = useAudio();

  const isConnected = status === "connected";

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, scrollToBottom]);

  const addMessage = useCallback((role, text) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role,
        text
      }
    ]);
  }, []);

  const clearStreaming = () => setStreamingText("");

  useEffect(() => {
    const unsubscribers = [];

    unsubscribers.push(
      on("connected", () => console.log("WS connected")),

      on("listening", () => setMode("listening")),

      on("transcript", ({ text }) => {
        if (text?.trim()) addMessage("user", text);
        setMode("thinking");
      }),

      on("processing", () => {
        setMode("thinking");
      }),

      on("text_chunk", ({ chunk }) => {
        setStreamingText((prev) => prev + chunk);
      }),

      on("audio_chunk", async ({ audio }) => {
        setMode("speaking");
        await playBase64Audio(audio);
      }),

      on("speaking_end", ({ fullText }) => {
        if (fullText) addMessage("assistant", fullText);
        clearStreaming();
        setMode("idle");
      }),

      on("ai_response", ({ text }) => {
        clearStreaming();
        addMessage("assistant", text);
        setMode("idle");
      }),

      on("error", ({ message }) => {
        console.error(message);
        setMode("idle");
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub?.());
    };
  }, [on, addMessage, playBase64Audio]);

  const handleOrbClick = useCallback(async () => {
    if (!isConnected) return;

    try {
      if (mode === "listening") {
        await stopRecording();
        send("audio_end", {
          mimeType: mimeTypeRef.current
        });
        setMode("thinking");
        return;
      }

      if (mode === "idle") {
        const mime = await startRecording((chunk) => {
          chunk.arrayBuffer().then(sendBinary);
        });

        mimeTypeRef.current = mime;
        send("audio_start", {});
        setMode("listening");
      }
    } catch (err) {
      console.error(err);
      setMode("idle");
    }
  }, [
    isConnected,
    mode,
    startRecording,
    stopRecording,
    send,
    sendBinary
  ]);

  const handleSendText = useCallback(() => {
    const text = textInput.trim();

    if (!text || mode !== "idle" || !isConnected) return;

    addMessage("user", text);
    send("text_message", { text });

    setTextInput("");
    setMode("thinking");
  }, [
    textInput,
    mode,
    isConnected,
    addMessage,
    send
  ]);

  const clearHistory = async () => {
    try {
      await fetch(`/api/chat/history/${userId}`, {
        method: "DELETE"
      });

      setMessages([
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "Fresh start. What's on your mind?"
        }
      ]);

      clearStreaming();
      setMode("idle");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgMesh} />

      <header className={styles.header}>
        <button
          className={styles.back}
          onClick={onBack}
        >
          ← Back
        </button>

        <div className={styles.aiName}>Ira</div>

        <div
          className={`${styles.status} ${
            isConnected
              ? styles.online
              : styles.offline
          }`}
        >
          <span className={styles.statusDot} />
          {isConnected ? "Online" : status}
        </div>
      </header>

      <div className={styles.messages}>
        {messages.map((m) => (
          <ChatBubble
            key={m.id}
            role={m.role}
            text={m.text}
          />
        ))}

        {streamingText && (
          <ChatBubble
            role="assistant"
            text={streamingText}
            isStreaming
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className={styles.orbSection}>
        <VoiceOrb
          mode={mode}
          onClick={handleOrbClick}
          disabled={!isConnected}
        />
      </div>

      <div className={styles.controls}>
        {showText && (
          <div className={styles.textInputWrap}>
            <input
              className={styles.textInput}
              value={textInput}
              onChange={(e) =>
                setTextInput(e.target.value)
              }
              onKeyDown={(e) =>
                e.key === "Enter" &&
                handleSendText()
              }
              placeholder="Type instead..."
              autoFocus
            />

            <button
              className={styles.sendBtn}
              onClick={handleSendText}
              disabled={
                !textInput.trim() ||
                mode !== "idle"
              }
            >
              ↑
            </button>
          </div>
        )}

        <div className={styles.bottomBtns}>
          <button
            className={`${styles.iconBtn} ${
              showText ? styles.active : ""
            }`}
            onClick={() =>
              setShowText((s) => !s)
            }
          >
            ⌨
          </button>

          <button
            className={styles.iconBtn}
            onClick={clearHistory}
          >
            ↺
          </button>
        </div>

        {!isConnected && (
          <div className={styles.disconnected}>
            Reconnecting...
          </div>
        )}
      </div>
    </div>
  );
}
