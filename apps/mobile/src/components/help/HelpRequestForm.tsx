'use client';

import React, { useState } from 'react';
import { AlertTriangle, MapPin, Send, Loader2 } from 'lucide-react';
import { useHelpRequestsControllerCreate } from '@wira-borneo/api-client';

interface HelpRequestFormProps {
  initialLocation?: { latitude: number; longitude: number };
  onSuccess: () => void;
  onChangeLocation?: () => void;
}

export default function HelpRequestForm({ initialLocation, onSuccess, onChangeLocation }: HelpRequestFormProps) {
  const [hazardType, setHazardType] = useState<'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK'>('FLOOD');
  const [urgency, setUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [description, setDescription] = useState('');
  
  const { mutate: createRequest, isPending } = useHelpRequestsControllerCreate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialLocation) {
      alert('Location is required. Please enable GPS or select on map.');
      return;
    }

    createRequest({
      data: {
        hazardType,
        urgency,
        description,
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
      } as any // CreateHelpRequestDto is generated as [key: string]: any in some cases
    }, {
      onSuccess: () => {
        onSuccess();
      },
      onError: (error) => {
        console.error('Failed to create help request:', error);
        alert('Failed to submit request. Please try again.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up">
      <div className="space-y-4">
        <label className="block space-y-2">
          <span className="form-label">Type of Emergency</span>
          <div className="grid grid-cols-2 gap-2">
            {(['FLOOD', 'TYPHOON', 'EARTHQUAKE', 'AFTERSHOCK'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setHazardType(type)}
                className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all ${hazardType === type ? 'bg-wira-teal text-white border-wira-teal shadow-md' : 'bg-white text-wira-earth border-wira-ivory-dark hover:border-wira-teal/30'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </label>

        <label className="block space-y-2">
          <span className="form-label">Urgency Level</span>
          <div className="flex gap-2">
            {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setUrgency(level)}
                className={`flex-1 py-2 rounded-lg border text-[10px] font-bold transition-all ${
                  urgency === level 
                    ? level === 'CRITICAL' ? 'bg-status-critical text-white border-status-critical shadow-sm' 
                    : level === 'HIGH' ? 'bg-wira-gold text-wira-earth border-wira-gold shadow-sm'
                    : 'bg-wira-teal text-white border-wira-teal shadow-sm'
                    : 'bg-white text-wira-earth/50 border-wira-ivory-dark'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </label>

        <label className="block space-y-2">
          <span className="form-label">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell us what's happening and what you need..."
            className="form-input-placeholder w-full bg-wira-ivory-dark/30 border border-wira-ivory-dark rounded-xl p-4 text-sm font-body text-wira-night focus:outline-none focus:ring-2 focus:ring-wira-teal/20 min-h-[120px]"
            required
          />
        </label>

        <div className="wira-card p-4 bg-wira-ivory-dark/20 border-dashed border-wira-earth/10 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-wira-teal/10 flex items-center justify-center">
                 <MapPin size={18} className="text-wira-teal" />
              </div>
              <div className="space-y-0.5">
                 <p className="form-label text-[11px] tracking-wider">Location Context</p>
                 <p className="form-hint">
                    {initialLocation ? `${initialLocation.latitude.toFixed(4)}, ${initialLocation.longitude.toFixed(4)}` : 'Detecting...'}
                 </p>
              </div>
           </div>
           {onChangeLocation && (
             <button type="button" onClick={onChangeLocation} className="text-[10px] font-bold text-wira-teal underline shrink-0 hover:text-wira-teal-dark">
               Change location
             </button>
           )}
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isPending || !initialLocation}
        className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-display font-bold uppercase tracking-widest transition-all ${
            urgency === 'CRITICAL' ? 'wira-btn-emergency shadow-lg shadow-status-critical/20' : 'wira-btn-primary shadow-lg shadow-wira-teal/20'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isPending ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send size={18} />
            Submit Help Request
          </>
        )}
      </button>

      <div className="flex items-start gap-3 p-4 bg-status-critical/5 rounded-xl border border-status-critical/10">
         <AlertTriangle size={16} className="text-status-critical shrink-0 mt-0.5" />
         <p className="text-[10px] font-body text-wira-earth/70 leading-relaxed italic">
            Fraudulent emergency requests are strictly prohibited and may result in permanent suspension of access.
         </p>
      </div>
    </form>
  );
}
