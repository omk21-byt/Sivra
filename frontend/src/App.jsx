import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Chat from './pages/Chat.jsx';

// Safe userId hook
function useUserId() {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let stored = localStorage.getItem('voiceai_userid');

    if (!stored) {
      stored = `user_${Date.now()}`;
      localStorage.setItem('voiceai_userid', stored);
    }

    setUserId(stored);
  }, []);

  return userId;
}

// Wrapper to use navigation
function AppRoutes() {
  const navigate = useNavigate();
  const userId = useUserId();

  if (!userId) return null; // prevent render flicker

  return (
    <Routes>
      <Route
        path="/"
        element={<Home onStart={() => navigate('/chat')} />}
      />
      <Route
        path="/chat"
        element={<Chat userId={userId} onBack={() => navigate('/')} />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
