'use client';

import React from 'react';
import { AlertCircle, ChevronRight, Map } from 'lucide-react';

export default function Warnings() {
  const warnings = [
    {
      id: 1,
      type: 'CRITICAL',
      title: 'Flash Flood Warning',
      location: 'Sarawak River, Kuching',
      time: '10 minutes ago',
      description: 'Water levels have significantly exceeded danger thresholds. Residents are advised to prepare for evacuation.',
      color: 'status-critical',
    },
    {
      id: 2,
      type: 'ADVISORY',
      title: 'Heavy Rain Forecast',
      location: 'Kuching Region',
      time: '1 hour ago',
      description: 'Persistent heavy rain is expected to continue until this evening.',
      color: 'status-advisory',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-wira-night">Current Warnings</h1>
        <span className="bg-status-critical/10 text-status-critical text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest border border-status-critical/20">
          2 Active
        </span>
      </header>

      <div className="space-y-4">
        {warnings.map((warning) => (
          <div key={warning.id} className="wira-card relative overflow-hidden group active:scale-[0.98] transition-all">
            <div className={`absolute top-0 left-0 w-1.5 h-full bg-${warning.color}`}></div>
            
            <div className="flex gap-4">
              <div className={`shrink-0 h-10 w-10 rounded-xl bg-${warning.color}/10 flex items-center justify-center`}>
                <AlertCircle className={`text-${warning.color} w-5 h-5`} />
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold font-mono text-${warning.color} uppercase tracking-tighter`}>
                    {warning.type}
                  </span>
                  <span className="text-[10px] font-body text-wira-earth/50 italic">{warning.time}</span>
                </div>
                <h2 className="text-base font-display font-bold text-wira-night">{warning.title}</h2>
                <p className="text-xs font-body text-wira-earth/70 line-clamp-2">{warning.description}</p>
                
                <div className="pt-3 flex items-center justify-between border-t border-wira-ivory-dark/50 mt-2">
                  <div className="flex items-center gap-1.5 text-wira-teal">
                    <Map size={12} />
                    <span className="text-[10px] font-body font-semibold uppercase">{warning.location}</span>
                  </div>
                  <ChevronRight size={14} className="text-wira-gold" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="wira-card bg-wira-teal text-white border-none p-6 space-y-4">
        <h3 className="text-lg font-display font-bold">Automated Evacuation Route</h3>
        <p className="text-xs font-body text-white/80 leading-relaxed">
          WIRA has identified the safest path to the nearest evacuation center based on active alerts.
        </p>
        <button className="w-full bg-white text-wira-teal py-3 rounded-xl font-body font-bold text-sm uppercase tracking-widest transition-transform active:scale-95 shadow-lg">
          View Safe Route
        </button>
      </div>
    </div>
  );
}
