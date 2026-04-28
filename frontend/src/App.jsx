import React, { useState } from 'react';
import Home from './pages/Home.jsx';
import Chat from './pages/Chat.jsx';

export default function App() {
  const [page, setPage] = useState('home');
  const [userId] = useState(() => {
    const stored = localStorage.getItem('voiceai_userid');
    if (stored) return stored;
    const id = `user_${Date.now()}`;
    localStorage.setItem('voiceai_userid', id);
    return id;
  });

  return page === 'home'
    ? <Home onStart={() => setPage('chat')} />
    : <Chat userId={userId} onBack={() => setPage('home')} />;
}
