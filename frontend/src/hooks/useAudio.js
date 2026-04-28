import { useRef, useCallback, useState } from 'react';

export function useAudio() {
  const audioCtxRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const queueRef = useRef([]);
  const playingRef = useRef(false);

  const getCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const playBase64Audio = useCallback(async (base64) => {
    const ctx = getCtx();

    // Decode base64 → ArrayBuffer
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    queueRef.current.push(bytes.buffer);
    processQueue();
  }, []);

  const processQueue = useCallback(async () => {
    if (playingRef.current || queueRef.current.length === 0) return;

    playingRef.current = true;
    setIsPlaying(true);

    while (queueRef.current.length > 0) {
      const buffer = queueRef.current.shift();
      await playBuffer(buffer);
    }

    playingRef.current = false;
    setIsPlaying(false);
  }, []);

  const playBuffer = (arrayBuffer) => {
    return new Promise(async (resolve) => {
      try {
        const ctx = getCtx();

        // Resume if suspended (browser autoplay policy)
        if (ctx.state === 'suspended') await ctx.resume();

        const decoded = await ctx.decodeAudioData(arrayBuffer);
        const source = ctx.createBufferSource();
        source.buffer = decoded;
        source.connect(ctx.destination);
        source.onended = resolve;
        source.start(0);
      } catch (err) {
        console.error('Audio play error:', err);
        resolve();
      }
    });
  };

  const stop = useCallback(() => {
    queueRef.current = [];
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    playingRef.current = false;
    setIsPlaying(false);
  }, []);

  return { isPlaying, playBase64Audio, stop };
}
