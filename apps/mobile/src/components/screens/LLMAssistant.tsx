'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  MapPin,
  Siren,
  CloudRain,
  Heart,
  MessageSquare,
  Mic,
  Maximize2,
} from 'lucide-react';
import { useAssistantControllerInquire } from '@wira-borneo/api-client';
import { useI18n } from '../../i18n/context';

type LLMAssistantProps = {
  onOpenMap?: () => void;
};

export type MapCardData = {
  destination: string;
  distance: string;
  durationMinutes?: number;
  routeImageUrl?: string;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  disclaimer?: string;
  structuredData?: { summary: string; steps: string[]; safetyReminder: string };
  mapCard?: MapCardData;
};

const sendQuickQuestion = (
  inquire: { mutate: (opts: { data: { question: string; location: string; hazardType: string } }) => void },
  question: string,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
) => {
  setMessages((prev) => [...prev, { role: 'user', content: question }]);
  inquire.mutate({
    data: { question, location: 'Kuching', hazardType: 'FLOOD' },
  });
};

export default function LLMAssistant({ onOpenMap }: LLMAssistantProps) {
  const { t } = useI18n();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: t('assistant.welcome') },
  ]);

  const inquire = useAssistantControllerInquire({
    mutation: {
      onSuccess: (data) => {
        const mapCard = (data as { mapCard?: MapCardData }).mapCard;
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.answer,
            disclaimer: data.disclaimer,
            structuredData: data.structuredData,
            ...(mapCard && { mapCard }),
          },
        ]);
      },
      onError: () => {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: t('assistant.error') },
        ]);
      },
    },
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
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    inquire.mutate({
      data: { question: userMessage, location: 'Kuching', hazardType: 'FLOOD' },
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#ececee] animate-fade-in">
      <div className="flex-1 flex flex-col gap-2.5 overflow-hidden py-4 px-4 pb-5 min-h-0">
        {/* Greeting */}
        <div className="flex flex-col gap-2 items-center py-4 shrink-0">
          <p className="font-sagip font-medium text-[#64748b] text-xs tracking-widest uppercase text-center">
            Karon nga adlaw
          </p>
          <h2 className="font-sagip font-bold text-sagip-heading text-xl text-center leading-7">
            Maayong adlaw!
          </h2>
          <p className="font-sagip font-normal text-sagip-muted text-sm text-center leading-5 max-w-[260px]">
            Unsaon nako pagtabang nimo karon sa imong kaluwasan?
          </p>
        </div>

        {/* Quick actions 2x2 */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-[356px] mx-auto shrink-0">
          {[
            {
              label: 'Find Shelter',
              icon: MapPin,
              className: 'bg-[rgba(25,60,230,0.1)] text-asean-blue',
              action: () => {
                sendQuickQuestion(inquire, 'Where is the nearest evacuation shelter?', setMessages);
                onOpenMap?.();
              },
            },
            {
              label: 'Request Aid',
              icon: Siren,
              className: 'bg-asean-red/10 text-asean-red',
              action: () => sendQuickQuestion(inquire, 'How do I request emergency aid?', setMessages),
            },
            {
              label: 'Weather Update',
              icon: CloudRain,
              className: 'bg-asean-yellow/20 text-asean-blue',
              action: () => sendQuickQuestion(inquire, 'What is the weather and flood forecast?', setMessages),
            },
            {
              label: 'Medical Tips',
              icon: Heart,
              className: 'bg-[#22c55e]/10 text-[#22c55e]',
              action: () =>
                sendQuickQuestion(
                  inquire,
                  'What are important medical and safety tips during a flood?',
                  setMessages
                ),
            },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              disabled={inquire.isPending}
              className="bg-white border border-[#f1f5f9] flex gap-3 items-center pl-3 pr-4 py-3 rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_4px_6px_-2px_rgba(0,0,0,0.05)] hover:bg-slate-50"
            >
              <div className={`rounded-lg size-8 flex items-center justify-center shrink-0 ${item.className}`}>
                <item.icon className="size-4" />
              </div>
              <span className="font-sagip font-bold text-sagip-heading text-xs text-center">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col gap-4 min-h-0 py-2">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end pl-10' : 'items-start pr-10'} space-y-1`}
            >
              {msg.role === 'assistant' ? (
                <div className="flex gap-2 items-start max-w-[302px]">
                  <div className="bg-asean-blue rounded-full size-8 flex items-center justify-center shrink-0 text-white mt-0.5">
                    <MessageSquare className="size-4" />
                  </div>
                  <div className="bg-white border border-[#f1f5f9] rounded-bl-[16px] rounded-br-[16px] rounded-tr-[16px] pl-3 pr-5 py-3 shadow-sm flex-1">
                    {msg.structuredData ? (
                      <div className="space-y-2">
                        <p className="font-sagip font-bold text-sagip-heading text-sm leading-tight">
                          {msg.structuredData.summary}
                        </p>
                        {msg.structuredData.steps?.length > 0 && (
                          <ul className="list-decimal pl-4 space-y-1 text-sagip-muted text-sm marker:text-asean-blue">
                            {msg.structuredData.steps.map((step: string, j: number) => (
                              <li key={j}>{step}</li>
                            ))}
                          </ul>
                        )}
                        {msg.structuredData.safetyReminder && (
                          <div className="bg-asean-red/5 border-l-2 border-asean-red/40 p-2 rounded-r-lg mt-2">
                            <p className="text-asean-red/90 font-sagip font-medium text-xs">
                              ⚠️ {msg.structuredData.safetyReminder}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="font-sagip font-normal text-sagip-heading text-sm leading-[23px]">
                        {msg.content}
                      </p>
                    )}
                    {msg.mapCard && (
                      <div className="mt-3 rounded-2xl border border-sagip-border overflow-hidden shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_4px_6px_-2px_rgba(0,0,0,0.05)]">
                        <div className="bg-sagip-border h-[192px] relative flex flex-col justify-end p-3">
                          {msg.mapCard.routeImageUrl ? (
                            <img
                              src={msg.mapCard.routeImageUrl}
                              alt="Route"
                              className="absolute inset-0 w-full h-full object-cover opacity-80"
                            />
                          ) : null}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" aria-hidden />
                          <div className="relative flex flex-col gap-1">
                            <span className="bg-[#193ce6] font-sagip font-bold text-white text-[10px] px-2 py-0.5 rounded-full w-fit">
                              ACTIVE ROUTE
                            </span>
                            <p className="font-sagip font-bold text-white text-xs leading-tight">
                              To: {msg.mapCard.destination}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="absolute right-3 top-3 bg-white rounded-full size-8 flex items-center justify-center shadow-md"
                            aria-label="Expand map"
                          >
                            <Maximize2 className="size-4 text-sagip-muted" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white">
                          <div>
                            <p className="font-sagip font-bold text-sagip-heading text-xs">
                              Distance: {msg.mapCard.distance}
                            </p>
                            <p className="font-sagip font-normal text-sagip-muted text-[10px]">
                              Estimated walk: {msg.mapCard.durationMinutes ?? 15} mins
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onOpenMap?.()}
                            className="bg-asean-blue font-sagip font-bold text-white text-xs px-4 py-1.5 rounded-lg hover:opacity-90"
                          >
                            Navigate
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-asean-blue rounded-bl-[16px] rounded-br-[16px] rounded-tl-[16px] px-3 py-3 max-w-[302px]">
                  <p className="font-sagip font-normal text-white text-sm leading-[23px]">{msg.content}</p>
                </div>
              )}
              {msg.disclaimer && (
                <p className="text-[10px] text-sagip-muted max-w-[80%] italic px-1 font-sagip">
                  {msg.disclaimer}
                </p>
              )}
            </div>
          ))}
          {inquire.isPending && (
            <div className="flex justify-start pl-10">
              <div className="bg-slate-200 h-8 w-24 rounded-2xl animate-pulse" />
            </div>
          )}
        </div>

        {/* Bottom input bar */}
        <div className="flex gap-2 items-center p-3 shrink-0 w-full">
          <form onSubmit={handleSend} className="flex-1 relative flex items-center shadow-md rounded-full">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={inquire.isPending}
              placeholder="I-type imong pangutana..."
              className="w-full bg-white rounded-full pl-5 pr-12 py-3 text-sm font-sagip text-sagip-heading placeholder:text-slate-400 outline-none border border-[#f1f5f9]"
            />
            <button
              type="submit"
              disabled={!input.trim() || inquire.isPending}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-asean-blue flex items-center justify-center rounded-full size-8 text-white disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="size-3" />
            </button>
          </form>
          <button
            type="button"
            className="bg-asean-blue/10 flex items-center justify-center rounded-full size-10 text-asean-blue shrink-0"
            aria-label="Voice input"
          >
            <Mic className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
