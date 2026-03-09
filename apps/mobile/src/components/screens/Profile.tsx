'use client';

import React, { useState } from 'react';
import { User, Settings, LogOut, Bell, Shield, Heart, ChevronRight, Home, MapPin } from 'lucide-react';
import {
  useAuthControllerGetSession,
  useAuthControllerSignOut,
  getAuthControllerGetSessionQueryKey,
  useVolunteersControllerGetStatus,
  useVolunteersControllerSetHome,
  getVolunteersControllerGetStatusQueryKey,
} from '@wira-borneo/api-client';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

export default function Profile() {
  const { data: session } = useAuthControllerGetSession();
  const { data: volunteerStatus } = useVolunteersControllerGetStatus();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [settingHome, setSettingHome] = useState(false);

  const signOut = useAuthControllerSignOut({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAuthControllerGetSessionQueryKey() });
        router.push('/');
        router.refresh();
      }
    }
  });

  const setHome = useVolunteersControllerSetHome({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getVolunteersControllerGetStatusQueryKey() });
      },
    },
  });

  const status = volunteerStatus as { profile?: { baseLatitude?: number; baseLongitude?: number } } | null | undefined;
  const profile = status?.profile;
  const hasHome = profile?.baseLatitude != null && profile?.baseLongitude != null;

  const handleSetHome = () => {
    if (!('geolocation' in navigator)) {
      return;
    }
    setSettingHome(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setHome.mutate({
          data: {
            baseLatitude: pos.coords.latitude,
            baseLongitude: pos.coords.longitude,
          },
        });
        setSettingHome(false);
      },
      () => setSettingHome(false),
      { enableHighAccuracy: true }
    );
  };

  const menuItems = [
    { icon: Bell, label: 'Notification Settings', color: 'text-wira-gold' },
    { icon: Shield, label: 'Security & Privacy', color: 'text-wira-teal' },
    { icon: Heart, label: 'Your Contributions', color: 'text-status-critical' },
    { icon: Settings, label: 'General Settings', color: 'text-wira-earth' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col items-center gap-4 py-4">
        <div className="relative group">
            <div className="h-24 w-24 rounded-[32px] bg-gradient-to-tr from-wira-teal to-wira-teal-light flex items-center justify-center border-4 border-white shadow-xl shadow-wira-teal/20">
              <User size={48} className="text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-wira-gold rounded-xl border-4 border-white flex items-center justify-center p-1.5 shadow-sm">
                <Shield className="text-white w-full h-full" />
            </div>
        </div>
        
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-display font-bold text-wira-night leading-none">{session?.user?.name || 'WIRA User'}</h1>
          <p className="text-xs font-body text-wira-earth/60 font-medium uppercase tracking-widest">{session?.user?.email}</p>
        </div>
      </header>

      {profile && (
        <div className="wira-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Home size={20} className="text-wira-teal" />
            <span className="text-sm font-body font-bold wira-card-title">Volunteer Home</span>
          </div>
          {hasHome ? (
            <p className="text-xs font-body text-wira-earth/80 flex items-center gap-1.5">
              <MapPin size={14} />
              Set at {profile.baseLatitude?.toFixed(5)}, {profile.baseLongitude?.toFixed(5)}
            </p>
          ) : (
            <p className="text-xs font-body text-wira-earth/60">Not set</p>
          )}
          <button
            type="button"
            onClick={handleSetHome}
            disabled={settingHome || setHome.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-wira-teal/10 text-wira-teal font-body font-bold text-sm hover:bg-wira-teal/20 disabled:opacity-50 transition-colors"
          >
            <MapPin size={16} />
            {settingHome || setHome.isPending ? 'Setting…' : hasHome ? 'Update Home Location' : 'Set Home'}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {menuItems.map((item, i) => (
          <button key={i} className="wira-card w-full flex items-center justify-between p-4 active:scale-[0.98] transition-all group">
            <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl bg-gray-50 transition-colors group-hover:bg-white`}>
                    <item.icon size={20} className={item.color} />
                </div>
                <span className="text-sm font-body font-bold wira-card-title">{item.label}</span>
            </div>
            <ChevronRight size={18} className="text-wira-ivory-dark" />
          </button>
        ))}
      </div>

      <div className="pt-4">
        <button 
          onClick={() => signOut.mutate()}
          className="w-full flex items-center justify-center gap-3 p-4 text-status-critical font-body font-bold text-sm uppercase tracking-widest bg-status-critical/5 rounded-2xl hover:bg-status-critical/10 transition-colors active:scale-95"
        >
          <LogOut size={18} />
          Log Out
        </button>
        <p className="text-[10px] font-mono text-center text-wira-earth/30 mt-6 uppercase tracking-widest">WIRA v0.1.0 — Empowered by AI</p>
      </div>
    </div>
  );
}
