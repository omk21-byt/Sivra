import React from 'react';
import styles from './ChatBubble.module.css';

export default function ChatBubble({ role, text, isStreaming }) {
  const isAI = role === 'assistant';

  return (
    <div className={`${styles.wrap} ${isAI ? styles.ai : styles.user}`}>
      {isAI && <div className={styles.avatar}>✦</div>}
      <div className={`${styles.bubble} ${isStreaming ? styles.streaming : ''}`}>
        {text}
        {isStreaming && <span className={styles.cursor} />}
      </div>
    </div>
  );
}
