import { useEffect, useRef, useCallback, useState } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export function useWebSocket(userId) {
  const wsRef = useRef(null);
  const [status, setStatus] = useState('disconnected'); // disconnected | connecting | connected | error
  const listenersRef = useRef({});

  const on = useCallback((event, handler) => {
    listenersRef.current[event] = handler;
  }, []);

  const send = useCallback((type, payload = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const sendBinary = useCallback((buffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(buffer);
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus('connecting');
    const ws = new WebSocket(`${WS_URL}/ws?userId=${userId}`);

    ws.onopen = () => {
      setStatus('connected');
    };

    ws.onclose = () => {
      setStatus('disconnected');
      // Auto-reconnect after 3s
      setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      setStatus('error');
    };

    ws.onmessage = (event) => {
      try {
        const { type, payload } = JSON.parse(event.data);
        const handler = listenersRef.current[type];
        if (handler) handler(payload);
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    wsRef.current = ws;
  }, [userId]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  return { status, send, sendBinary, on };
}
