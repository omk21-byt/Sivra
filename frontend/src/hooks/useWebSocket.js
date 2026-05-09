import { useEffect, useRef, useCallback, useState } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
const RECONNECT_DELAY = 3000;

export function useWebSocket(userId) {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const listenersRef = useRef({});
  const mountedRef = useRef(true);

  const [status, setStatus] = useState('disconnected');

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
    if (!userId || !mountedRef.current) return;

    if (
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    setStatus('connecting');

    const ws = new WebSocket(
      `${WS_URL}/ws?userId=${encodeURIComponent(userId)}`
    );

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setStatus('connected');
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;

      setStatus('disconnected');

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, RECONNECT_DELAY);
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      setStatus('error');
    };

    ws.onmessage = (event) => {
      try {
        const { type, payload } = JSON.parse(event.data);
        listenersRef.current[type]?.(payload);
      } catch (err) {
        console.error('WebSocket parse error:', err);
      }
    };

    wsRef.current = ws;
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;

    connect();

    return () => {
      mountedRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      wsRef.current?.close();
    };
  }, [connect]);

  return {
    status,
    send,
    sendBinary,
    on,
  };
}
