'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, ShieldCheck, Sparkle } from 'lucide-react';
import { useAssistantControllerInquire } from '@wira-borneo/api-client';

export default function LLMAssistant() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Welcome to WIRA Assistant. I am here to help you with disaster information, safety tips, or any emergency inquiries. How can I assist you today?' }
  ]);

  const inquire = useAssistantControllerInquire({
    mutation: {
      onSuccess: (data: any) => {
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer || 'Sorry, I cannot process that information right now.' }]);
      },
      onError: () => {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, the system is experiencing some issues. Please try again in a moment.' }]);
      }
    }
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || inquire.isPending) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    inquire.mutate({ data: { question: userMessage } });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in -mx-4">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-wira-ivory-dark bg-white/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-wira-teal flex items-center justify-center p-2 shadow-sm">
            <Sparkle className="text-wira-gold w-full h-full animate-pulse-slow" />
          </div>
          <div>
            <h1 className="text-base font-display font-bold text-wira-night leading-none mb-1">WIRA Smart</h1>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-status-safe"></span>
              <span className="text-[10px] font-body text-wira-earth/60 uppercase tracking-widest font-bold">Artificial Intelligence</span>
            </div>
          </div>
        </div>
        <ShieldCheck className="text-wira-gold w-5 h-5" />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm font-body leading-relaxed shadow-sm ${msg.role === 'user'
                ? 'bg-wira-teal text-white rounded-br-none'
                : 'bg-white text-wira-night border border-wira-ivory-dark rounded-bl-none'
              }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {inquire.isPending && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-wira-ivory-dark h-8 w-24 rounded-2xl"></div>
          </div>
        )}
      </div>

      {/* Input Zone */}
      <div className="px-4 py-4 shrink-0 bg-white">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={inquire.isPending}
            placeholder="Ask about safety..."
            className="wira-card w-full pr-12 py-3.5 focus:border-wira-gold focus:ring-1 focus:ring-wira-gold transition-all duration-200 outline-none text-sm font-body bg-wira-ivory/50"
          />
          <button
            type="submit"
            disabled={!input.trim() || inquire.isPending}
            className={`absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl flex items-center justify-center transition-all ${input.trim() ? 'bg-wira-gold text-white' : 'bg-wira-ivory-dark text-wira-earth/30'
              }`}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
