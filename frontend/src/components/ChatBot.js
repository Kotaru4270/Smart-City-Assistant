import React, { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../utils/api';

export default function ChatBot({ city }) {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', content: '👋 Hi! I\'m CityBot. Ask me about weather, hospitals, tourist spots, or AQI in your city!' },
  ]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    // Build history for context (last 8 messages)
    const history = messages.slice(-8).map((m) => ({
      role:    m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));

    try {
      const res = await aiAPI.chat({ message: msg, city, history });
      setMessages((prev) => [...prev, { role: 'bot', content: res.data.reply }]);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Sorry, I encountered an error. Please try again.';
      setMessages((prev) => [...prev, { role: 'bot', content: `❌ ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Voice input
  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser.');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onstart  = () => setListening(true);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
      sendMessage(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend   = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const quickActions = [
    `What's the weather in ${city || 'my city'}?`,
    `AQI advice for today`,
    `Best hospitals nearby`,
    `Top tourist spots`,
  ];

  return (
    <>
      {/* Chat Window */}
      {open && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>CityBot</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent4)' }}>● Online — AI Powered</div>
            </div>
            <button onClick={() => setMessages([{ role: 'bot', content: '👋 Hi! Ask me anything about your city!' }])} title="Clear chat" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', marginRight: '0.25rem' }}>🗑️</button>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`} style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
            ))}
            {loading && <div className="chat-msg bot typing">CityBot is typing…</div>}

            {/* Quick actions on first message */}
            {messages.length === 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                {quickActions.map((q, i) => (
                  <button
                    key={i}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
                    onClick={() => sendMessage(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chatbot-input">
            <button
              onClick={toggleVoice}
              title="Voice input"
              style={{
                background: listening ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border)', borderRadius: '8px',
                color: listening ? '#f87171' : 'var(--text-secondary)',
                cursor: 'pointer', padding: '0.6rem', fontSize: '1rem', flexShrink: 0,
                animation: listening ? 'spin 1s linear infinite' : 'none',
              }}
            >🎤</button>
            <input
              placeholder="Ask about weather, hospitals, tourism…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{ flexShrink: 0 }}
            >
              {loading ? '…' : '➤'}
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button className="chatbot-bubble" onClick={() => setOpen((o) => !o)} title="Open CityBot">
        {open ? '✕' : '🤖'}
      </button>
    </>
  );
}
