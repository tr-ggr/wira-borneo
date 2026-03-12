'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  User,
  Settings,
  LogOut,
  Shield,
  MapPin,
  Lock,
  Download,
  Globe,
  Plus,
  Wrench,
  Package,
} from 'lucide-react';
import { AssetRegistrationForm } from '../assets/AssetRegistrationForm';
import { MyAssets } from '../assets/MyAssets';
import {
  useAuthControllerGetSession,
  useAuthControllerSignOut,
  useAuthControllerUpdateProfile,
  getAuthControllerGetSessionQueryKey,
  useVolunteersControllerGetStatus,
  useVolunteersControllerSetHome,
  getVolunteersControllerGetStatusQueryKey,
} from '@wira-borneo/api-client';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  ageGroup?: string | null;
  pregnantStatus?: boolean | null;
  isPWD?: boolean | null;
};

// Placeholder stats until API exists
const REPORTS_FILED = 0;
const REPORTS_TREND = '+0%';
const AID_VERIFIED = 0;
const REGION_PLACEHOLDER = 'Philippines';

type RegionalLanguageOption = 'ENg' | 'Cebuano';

export default function Profile() {
  const { data: session } = useAuthControllerGetSession();
  const { data: volunteerStatus } = useVolunteersControllerGetStatus();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [settingHome, setSettingHome] = useState(false);
  const [safeMode, setSafeMode] = useState(false);
  const [regionalLanguage, setRegionalLanguage] = useState<RegionalLanguageOption>('ENg');
  const [showAssetForm, setShowAssetForm] = useState(false);
  const demographicsRef = useRef<HTMLDivElement>(null);

  const user = session?.user as SessionUser | undefined;
  const updateProfile = useAuthControllerUpdateProfile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAuthControllerGetSessionQueryKey() });
      },
    },
  });

  const handleDemographicChange = (field: string, value: string | boolean | null) => {
    updateProfile.mutate({ data: { [field]: value } });
  };

  const signOut = useAuthControllerSignOut({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAuthControllerGetSessionQueryKey() });
        router.push('/');
        router.refresh();
      },
    },
  });

  const setHome = useVolunteersControllerSetHome({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getVolunteersControllerGetStatusQueryKey() });
      },
    },
  });

  const status = volunteerStatus as {
    profile?: { id?: string; baseLatitude?: number; baseLongitude?: number; status?: string };
  } | null | undefined;
  const profile = status?.profile;
  const hasHome = profile?.baseLatitude != null && profile?.baseLongitude != null;
  const isCommunityResponder = profile?.status === 'APPROVED';

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

  const scrollToDemographics = () => {
    demographicsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleExportOfflineId = () => {
    const payload = {
      id: profile?.id ?? 'SG-XXXX-2024-0000',
      name: user?.name,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sagip-offline-id-${payload.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayId = profile?.id ?? 'SG-XXXX-2024-0000';

  return (
    <div className="animate-fade-in pb-10 -mx-4" role="main" aria-label="Profile">
      {/* Dark blue hero */}
      <section className="bg-asean-blue rounded-t-2xl pt-6 pb-8 px-4 flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-4 border-asean-yellow bg-asean-blue flex items-center justify-center overflow-hidden shadow-lg">
            {user?.image ? (
              <Image
                src={user.image}
                alt=""
                width={96}
                height={96}
                className="object-cover w-full h-full"
              />
            ) : (
              <User size={48} className="text-white" aria-hidden />
            )}
          </div>
          <div
            className="absolute -bottom-0.5 -right-0.5 h-8 w-8 rounded-full border-2 border-asean-yellow bg-asean-blue flex items-center justify-center shadow-md"
            aria-hidden
          >
            <Settings className="text-asean-yellow w-4 h-4" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-xl font-sagip font-bold text-white leading-tight">
            {user?.name || 'WIRA User'}
          </h1>
          <p className="text-white/90 font-sagip text-xs uppercase tracking-widest">
            {isCommunityResponder ? 'COMMUNITY RESPONDER' : 'Volunteer'} • {REGION_PLACEHOLDER}
          </p>
        </div>
        <button
          type="button"
          onClick={scrollToDemographics}
          className="w-full max-w-[200px] py-2.5 rounded-xl bg-asean-blue border-2 border-white/40 text-white font-sagip font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          EDIT PROFILE
        </button>
      </section>

      <div className="px-4 space-y-4 mt-4">
        {/* Stats row */}
        <section className="grid grid-cols-2 gap-3" aria-label="User statistics">
          <div className="wira-card p-4 rounded-xl">
            <p className="font-sagip font-bold text-[10px] uppercase tracking-wider text-sagip-muted">
              REPORTS FILED
            </p>
            <p className="text-2xl font-sagip font-bold text-asean-blue mt-1">{REPORTS_FILED}</p>
            <p className="text-xs font-sagip text-status-safe">{REPORTS_TREND}</p>
          </div>
          <div className="wira-card p-4 rounded-xl">
            <p className="font-sagip font-bold text-[10px] uppercase tracking-wider text-sagip-muted">
              AID VERIFIED
            </p>
            <p className="text-2xl font-sagip font-bold text-status-critical mt-1">{AID_VERIFIED}</p>
            <p className="text-xs font-sagip text-sagip-muted">Cases</p>
          </div>
        </section>

        {/* Emergency Digital Identity */}
        <section className="wira-card p-4 space-y-4" aria-labelledby="emergency-id-heading">
          <h2
            id="emergency-id-heading"
            className="font-sagip font-bold text-sm uppercase tracking-widest text-sagip-heading flex items-center gap-2"
          >
            <Lock size={18} className="text-sagip-heading shrink-0" aria-hidden />
            EMERGENCY DIGITAL IDENTITY
          </h2>
          <div className="flex flex-col items-center gap-2">
            <div className="w-32 h-32 rounded-lg bg-status-safe/90 border-2 border-white ring-2 ring-asean-blue/30 flex items-center justify-center">
              <div className="w-24 h-24 bg-white rounded flex items-center justify-center text-sagip-muted text-[10px] font-mono text-center px-1 break-all">
                QR
              </div>
            </div>
            <p className="font-sagip text-sm text-sagip-muted">ID: {displayId}</p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={handleExportOfflineId}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-asean-blue/10 text-asean-blue font-sagip font-bold text-sm hover:bg-asean-blue/20 transition-colors focus:outline-none focus:ring-2 focus:ring-asean-blue/30"
            >
              <Download size={18} aria-hidden />
              EXPORT OFFLINE ID
            </button>
            <button
              type="button"
              onClick={handleSetHome}
              disabled={settingHome || setHome.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-status-safe/20 text-status-safe font-sagip font-bold text-sm hover:bg-status-safe/30 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-status-safe/30"
              aria-label={hasHome ? 'Update home location' : 'Set home location'}
            >
              <MapPin size={18} aria-hidden />
              {settingHome || setHome.isPending ? 'Setting…' : 'UPDATE CURRENT LOCATION'}
            </button>
          </div>
        </section>

        {/* Control Center */}
        <section className="wira-card p-4 space-y-4" aria-labelledby="control-center-heading">
          <h2
            id="control-center-heading"
            className="font-sagip font-bold text-sm uppercase tracking-widest text-sagip-heading"
          >
            CONTROL CENTER
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-asean-blue/10">
                  <Globe size={20} className="text-asean-blue" aria-hidden />
                </div>
                <div>
                  <p className="font-sagip font-bold text-sm text-sagip-heading">
                    Regional Language
                  </p>
                  <p className="font-sagip text-[10px] text-sagip-muted">MCATL ENABLED</p>
                </div>
              </div>
              <select
                value={regionalLanguage}
                onChange={(e) => setRegionalLanguage(e.target.value as RegionalLanguageOption)}
                className="font-sagip text-sm text-sagip-heading bg-sagip-border/50 border border-sagip-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-asean-blue/30"
                aria-label="Regional language"
              >
                <option value="ENg">ENg</option>
                <option value="Cebuano">Cebuano</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-asean-blue/10">
                  <Shield size={20} className="text-asean-blue" aria-hidden />
                </div>
                <div>
                  <p className="font-sagip font-bold text-sm text-sagip-heading">Safe Mode</p>
                  <p className="font-sagip text-[10px] text-sagip-muted">AUTO-REPORT IF IDLE</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={safeMode}
                onClick={() => setSafeMode(!safeMode)}
                className={`relative w-12 h-7 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-asean-blue/30 ${
                  safeMode ? 'bg-asean-blue' : 'bg-sagip-border'
                }`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-colors ${
                    safeMode ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-sagip font-bold text-sm text-sagip-heading">Kin Contacts</p>
                <div className="flex -space-x-2 mt-1.5">
                  <div className="w-8 h-8 rounded-full bg-sagip-border border-2 border-white" aria-hidden />
                  <div className="w-8 h-8 rounded-full bg-sagip-border border-2 border-white" aria-hidden />
                </div>
              </div>
              <button
                type="button"
                onClick={() => console.log('Add contact')}
                className="flex items-center gap-1.5 font-sagip text-xs text-sagip-muted uppercase tracking-wider hover:text-asean-blue transition-colors"
              >
                ADD NEW CONTACT
                <span className="w-6 h-6 rounded-full bg-asean-blue/10 flex items-center justify-center">
                  <Plus size={14} className="text-asean-blue" aria-hidden />
                </span>
              </button>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-asean-yellow/10">
                  <Wrench size={20} className="text-asean-yellow" aria-hidden />
                </div>
                <div>
                  <p className="font-sagip font-bold text-sm text-sagip-heading">Response Assets</p>
                  <p className="font-sagip text-[10px] text-sagip-muted">VOLUNTEERED EQUIPMENT</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAssetForm(true)}
                className="flex items-center gap-1.5 font-sagip text-xs text-asean-blue underline uppercase tracking-wider hover:text-navy-900 transition-colors"
                aria-label="Register asset"
              >
                REGISTER ASSET
              </button>
            </div>
          </div>
        </section>

        {/* My Registered Assets */}
        <section className="wira-card p-4 space-y-4" aria-labelledby="my-assets-heading">
          <div className="flex items-center justify-between">
            <h2
              id="my-assets-heading"
              className="font-sagip font-bold text-sm uppercase tracking-widest text-sagip-heading flex items-center gap-2"
            >
              <Package size={18} className="text-asean-blue shrink-0" aria-hidden />
              My Registered Assets
            </h2>
          </div>
          <MyAssets />
        </section>

        {/* Demographics & Needs (scroll target for Edit Profile) */}
        <section
          ref={demographicsRef}
          className="wira-card p-4 space-y-4"
          aria-labelledby="demographics-heading"
        >
          <h2
            id="demographics-heading"
            className="font-sagip font-bold text-sm uppercase tracking-widest text-sagip-heading flex items-center gap-2"
          >
            <User size={18} className="text-asean-blue shrink-0" aria-hidden />
            Demographics & Needs
          </h2>
          <div className="space-y-3">
            <label className="flex flex-col gap-1.5">
              <span className="font-sagip font-bold text-[10px] uppercase tracking-wider text-sagip-muted">
                Age Group
              </span>
              <select
                className="bg-sagip-border/50 border border-sagip-border rounded-xl text-sm p-3 font-body text-sagip-heading outline-none focus:ring-2 focus:ring-asean-blue/30 focus:border-asean-blue"
                value={user?.ageGroup ?? ''}
                onChange={(e) =>
                  handleDemographicChange('ageGroup', e.target.value || null)
                }
                disabled={updateProfile.isPending}
                aria-label="Age group"
              >
                <option value="">Not specified</option>
                <option value="UNDER_12">Under 12</option>
                <option value="AGE_12_17">12 - 17</option>
                <option value="AGE_18_59">18 - 59</option>
                <option value="AGE_60_PLUS">60+</option>
              </select>
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl bg-sagip-border/50 border border-sagip-border active:scale-[0.98] transition-all cursor-pointer">
              <span className="text-sm font-sagip font-medium text-sagip-heading">Pregnant</span>
              <input
                type="checkbox"
                className="w-5 h-5 rounded text-asean-blue focus:ring-asean-blue/30 border-sagip-border"
                checked={user?.pregnantStatus ?? false}
                onChange={(e) => handleDemographicChange('pregnantStatus', e.target.checked)}
                disabled={updateProfile.isPending}
                aria-label="Pregnant"
              />
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl bg-sagip-border/50 border border-sagip-border active:scale-[0.98] transition-all cursor-pointer">
              <span className="text-sm font-sagip font-medium text-sagip-heading">
                Person with Disability (PWD)
              </span>
              <input
                type="checkbox"
                className="w-5 h-5 rounded text-asean-blue focus:ring-asean-blue/30 border-sagip-border"
                checked={user?.isPWD ?? false}
                onChange={(e) => handleDemographicChange('isPWD', e.target.checked)}
                disabled={updateProfile.isPending}
                aria-label="Person with disability"
              />
            </label>
          </div>
        </section>

        {/* Volunteer Home (when profile exists) */}
        {profile && (
          <section className="wira-card p-4 space-y-3" aria-labelledby="volunteer-home-heading">
            <h2
              id="volunteer-home-heading"
              className="font-sagip font-bold text-sm uppercase tracking-widest text-sagip-heading flex items-center gap-2"
            >
              <MapPin size={20} className="text-asean-blue shrink-0" aria-hidden />
              Volunteer Home
            </h2>
            {hasHome ? (
              <p className="text-xs font-sagip text-sagip-muted flex items-center gap-1.5">
                <MapPin size={14} className="text-asean-blue shrink-0" aria-hidden />
                Set at {profile.baseLatitude?.toFixed(5)}, {profile.baseLongitude?.toFixed(5)}
              </p>
            ) : (
              <p className="text-xs font-sagip text-sagip-muted">Not set</p>
            )}
          </section>
        )}

        {/* Logout - solid red */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => signOut.mutate()}
            disabled={signOut.isPending}
            className="w-full flex items-center justify-center gap-3 py-4 bg-status-critical text-white font-sagip font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-red-700 transition-colors active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-status-critical/50 disabled:opacity-50"
            aria-label="Log out"
          >
            <LogOut size={18} aria-hidden />
            LOGOUT
          </button>
        </div>
      </div>

      {/* Asset Registration Modal Overlay */}
      {showAssetForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl h-[90vh] overflow-hidden">
            <AssetRegistrationForm onClose={() => setShowAssetForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
