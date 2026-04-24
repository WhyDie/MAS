import React, { useState, useRef, useEffect } from 'react';
import { aiChat } from '@services/api';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const quickQuestions = [
  'Як змінити пароль?',
  'Де переглянути розпорядок?',
  'Які є навчальні модулі?',
  'Як редагувати профіль?',
  'Що таке онбординг?',
  'Як додати подію?',
];

export const AIChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Привіт! 👋 Я AI-помічник системи адаптації. Можу допомогти з питаннями щодо навчання, розпорядку, профілю та інших функцій системи. Чим можу допомогти?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      console.log('[AI Chat] Sending message:', text.trim());
      const response = await aiChat(text.trim());
      console.log('[AI Chat] Full response:', response);
      
      // Backend returns: { success: true, data: { message: "..." } }
      const aiText = response?.data?.message 
        || response?.message 
        || 'На жаль, я не зміг отримати відповідь. Спробуйте ще раз.';

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('[AI Chat] Error:', error);
      // Network error or timeout - show user-friendly message
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'На разі я працюю в офлайн-режимі. Запитайте мене про розпорядок, навчання, профіль або безпеку — я маю базові відповіді!',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="animate-fade-in-up flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-heading font-bold mb-2" style={{ color: 'var(--text-primary)', fontSize: '32px', letterSpacing: '1px' }}>
          🤖 AI Помічник
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6' }}>
          Запитайте про будь-яку функцію системи або отримайте допомогу
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 p-4 rounded-2xl space-y-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[80%] p-4 rounded-2xl animate-scale-in"
              style={{
                background: msg.sender === 'user' ? 'var(--gradient-gold)' : 'var(--bg-glass)',
                color: msg.sender === 'user' ? 'var(--ab3-black)' : 'var(--text-primary)',
                borderBottomRightRadius: msg.sender === 'user' ? '4px' : '16px',
                borderBottomLeftRadius: msg.sender === 'ai' ? '4px' : '16px',
              }}
            >
              {msg.sender === 'ai' && (
                <div className="flex items-center gap-2 mb-2 pb-2 border-b" style={{ borderColor: msg.sender === 'ai' ? 'var(--border-subtle)' : 'transparent' }}>
                  <span className="text-lg">🤖</span>
                  <span className="text-xs font-bold" style={{ color: 'var(--ab3-gold)' }}>AI Помічник</span>
                </div>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              <p className="text-xs mt-2 opacity-50" style={{ color: msg.sender === 'user' ? 'var(--ab3-black)' : 'var(--text-muted)' }}>
                {msg.timestamp.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-glass)' }}>
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--ab3-gold)', animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--ab3-gold)', animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--ab3-gold)', animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      <div className="mb-3">
        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Швидкі запитання:</p>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              disabled={loading}
              className="btn disabled:opacity-50"
              style={{
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                padding: '6px 14px',
                fontSize: '12px',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Напишіть повідомлення..."
          className="input flex-1"
          style={{ fontSize: '15px' }}
          disabled={loading}
        />
        <button type="submit" disabled={!input.trim() || loading} className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed" style={{ padding: '14px 24px' }}>
          {loading ? '⏳' : '📤'}
        </button>
      </form>
    </div>
  );
};
