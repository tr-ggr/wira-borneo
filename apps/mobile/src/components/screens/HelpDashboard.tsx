'use client';

import React, { useState } from 'react';
import { LifeBuoy, HandHeart, AlertCircle, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';
import { useVolunteersControllerApply, useVolunteersControllerGetStatus } from '@wira-borneo/api-client';

export default function HelpDashboard() {
  const [activeTab, setActiveTab] = useState<'request' | 'volunteer'>('request');
  const { data: volunteerStatus } = useVolunteersControllerGetStatus();

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold text-wira-night">Help Center</h1>
            <HelpCircle size={20} className="text-wira-gold" />
          </div>
          
          <div className="flex bg-wira-ivory-dark rounded-xl p-1">
            <button 
              onClick={() => setActiveTab('request')}
              className={`flex-1 py-2 text-xs font-body font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'request' ? 'bg-white text-wira-teal shadow-sm' : 'text-wira-earth/50'}`}
            >
              Request Help
            </button>
            <button 
              onClick={() => setActiveTab('volunteer')}
              className={`flex-1 py-2 text-xs font-body font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'volunteer' ? 'bg-white text-wira-teal shadow-sm' : 'text-wira-earth/50'}`}
            >
              Volunteer
            </button>
          </div>
      </header>

      {activeTab === 'request' ? (
        <div className="space-y-6 animate-slide-up">
           <div className="wira-card p-6 border-status-critical/20 bg-status-critical/5 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-status-critical/10 flex items-center justify-center">
                <AlertCircle className="text-status-critical w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-display font-bold text-wira-night">Send Emergency Signal</h3>
                <p className="text-xs font-body text-wira-earth/70">
                    Use this only if you require immediate assistance. Your location will be sent to authorities and nearby volunteers.
                </p>
              </div>
              <button className="wira-btn-emergency">
                Request Help NOW
              </button>
           </div>

           <div className="space-y-3">
              <h3 className="text-sm font-display font-bold text-wira-night px-1">Active Requests</h3>
              <div className="wira-card flex items-center justify-between p-4">
                 <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-status-safe/10 flex items-center justify-center">
                        <CheckCircle2 className="text-status-safe w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-display font-bold text-wira-night line-clamp-1">Water Supply Emergency</p>
                        <p className="text-[10px] font-body text-wira-earth/50">Completed — 2 hours ago</p>
                    </div>
                 </div>
                 <ChevronRight size={16} className="text-wira-ivory-dark" />
              </div>
           </div>
        </div>
      ) : (
        <div className="space-y-6 animate-slide-up">
           <div className="wira-card p-6 border-wira-teal/20 bg-wira-teal/5 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-wira-teal/10 flex items-center justify-center">
                <HandHeart className="text-wira-teal w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-display font-bold text-wira-night">Become a WIRA Volunteer</h3>
                <p className="text-xs font-body text-wira-earth/70">
                    Only registered volunteers can respond to emergency signals. Help your community build resilience.
                </p>
              </div>
              <button className="wira-btn-primary">
                Register as Volunteer
              </button>
           </div>

           <div className="wira-card bg-wira-earth text-white border-none p-5 space-y-3">
              <div className="flex items-center gap-2">
                 <LifeBuoy size={16} className="text-wira-gold" />
                 <h4 className="text-xs font-display font-bold uppercase tracking-widest text-wira-ivory-dark">Safety Guidelines</h4>
              </div>
              <p className="text-[11px] font-body text-white/70 leading-relaxed italic">
                "Personal safety is the first priority before helping others."
              </p>
           </div>
        </div>
      )}
    </div>
  );
}
