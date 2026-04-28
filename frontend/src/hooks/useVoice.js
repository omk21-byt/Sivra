import { useRef, useState, useCallback } from 'react';

export function useVoice() {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);

  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setHasPermission(true);
      return true;
    } catch {
      setHasPermission(false);
      return false;
    }
  }, []);

  const startRecording = useCallback(async (onChunk) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      streamRef.current = stream;

      // Pick best supported format
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg']
        .find(m => MediaRecorder.isTypeSupported(m)) || '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          onChunk(e.data);
        }
      };

      recorder.start(250); // chunk every 250ms
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setHasPermission(true);

      return mimeType || 'audio/webm';
    } catch (err) {
      console.error('Recording error:', err);
      setHasPermission(false);
      throw err;
    }
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve();
        return;
      }

      recorder.onstop = resolve;
      recorder.stop();

      streamRef.current?.getTracks().forEach(t => t.stop());
      setIsRecording(false);
    });
  }, []);

  return { isRecording, hasPermission, requestPermission, startRecording, stopRecording };
}
