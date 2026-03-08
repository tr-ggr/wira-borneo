'use client';

import React, { useState } from 'react';
import { Users, UserPlus, Copy, Map as MapIcon, ShieldCheck } from 'lucide-react';
import { useFamiliesControllerGetMyFamilyMap } from '@wira-borneo/api-client';

export default function Family() {
  const [familyCode] = useState('WIRA-7788-XY');
  
  const members = [
    { id: 1, name: 'Siti Aminah', role: 'Head of Family', status: 'Safe', lastSeen: '2 mins ago', lat: 1.5540, lng: 110.3595 },
    { id: 2, name: 'Ahmad Faiz', role: 'Member', status: 'Warning Zone', lastSeen: 'Just now', lat: 1.5520, lng: 110.3580 },
    { id: 3, name: 'Nurul Izzah', role: 'Member', status: 'Safe', lastSeen: '5 mins ago', lat: 1.5530, lng: 110.3590 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="space-y-1">
        <h1 className="text-2xl font-display font-bold text-wira-night leading-tight">Family Party</h1>
        <p className="text-xs font-body text-wira-earth/70">WIRA ensures the safety of your loved ones.</p>
      </header>

      {/* Family Code Card */}
      <div className="wira-card bg-gradient-to-br from-wira-gold to-wira-gold-dark border-none p-6 space-y-4 relative overflow-hidden group">
        <div className="absolute top-0 right-0 opacity-10 wira-batik-bg w-24 h-24 -mr-4 -mt-4 rotate-12"></div>
        <div className="space-y-1 relative">
          <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Your Family Code</p>
          <div className="flex items-center justify-between bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20">
            <span className="text-xl font-mono font-bold text-white">{familyCode}</span>
            <button className="text-white/80 active:scale-90 transition-transform">
              <Copy size={20} />
            </button>
          </div>
        </div>
        <p className="text-[10px] font-body text-white/60 italic">Share this code to invite family members to your WIRA party.</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-display font-bold text-wira-night">Family on Map</h3>
            <button className="text-xs font-body font-bold text-wira-teal uppercase tracking-widest flex items-center gap-1">
                <MapIcon size={14} /> View All
            </button>
        </div>

        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="wira-card flex items-center gap-4 active:scale-[0.98] transition-all">
               <div className="relative shrink-0">
                  <div className="h-12 w-12 rounded-full bg-wira-ivory-dark flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                      <Users className="text-wira-teal-light w-6 h-6" />
                  </div>
                  <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${member.status === 'Selamat' ? 'bg-status-safe' : 'bg-status-warning'}`}></span>
               </div>
               
               <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-display font-bold text-wira-night truncate">{member.name}</h4>
                  <p className="text-[10px] font-body text-wira-earth/60 uppercase font-bold tracking-tighter">{member.role} — <span className="opacity-70">{member.lastSeen}</span></p>
               </div>

               <div className="text-right space-y-1">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter bg-opacity-10 ${member.status === 'Selamat' ? 'bg-status-safe text-status-safe' : 'bg-status-warning text-status-warning'}`}>
                    {member.status}
                  </span>
               </div>
            </div>
          ))}
        </div>
      </div>

      <button className="w-full border-2 border-dashed border-wira-teal-light text-wira-teal-light py-4 rounded-2xl flex items-center justify-center gap-2 font-body font-bold text-sm active:bg-wira-teal-light/5 transition-colors">
        <UserPlus size={18} />
        Join Another Family
      </button>
    </div>
  );
}
