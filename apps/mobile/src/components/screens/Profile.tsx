'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
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
import { useI18n } from '../../i18n/context';

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

type RegionalLanguageOption = 'ENg' | 'Cebuano';

export default function Profile() {
  const { t } = useI18n();
  const { data: session } = useAuthControllerGetSession();
  const { data: volunteerStatus } = useVolunteersControllerGetStatus();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [settingHome, setSettingHome] = useState(false);
  const [safeMode, setSafeMode] = useState(false);
  const [regionalLanguage, setRegionalLanguage] =
    useState<RegionalLanguageOption>('ENg');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isKinLoading, setIsKinLoading] = useState(true);
  const [kinContacts] = useState<
    Array<{ id: string; name: string; avatar?: string }>
  >(() => [
    { id: 'kin-1', name: 'Jane D.' },
    { id: 'kin-2', name: 'John K.' },
  ]);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const demographicsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => setIsKinLoading(false), 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  const user = session?.user as SessionUser | undefined;
  const updateProfile = useAuthControllerUpdateProfile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getAuthControllerGetSessionQueryKey(),
        });
      },
    },
  });

  const handleDemographicChange = (
    field: string,
    value: string | boolean | null,
  ) => {
    updateProfile.mutate({ data: { [field]: value } });
  };

  const signOut = useAuthControllerSignOut({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getAuthControllerGetSessionQueryKey(),
        });
        router.push('/');
        router.refresh();
      },
    },
  });

  const setHome = useVolunteersControllerSetHome({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getVolunteersControllerGetStatusQueryKey(),
        });
      },
    },
  });

  const status = volunteerStatus as
    | {
        profile?: {
          id?: string;
          baseLatitude?: number;
          baseLongitude?: number;
          status?: string;
        };
      }
    | null
    | undefined;
  const profile = status?.profile;
  const hasHome =
    profile?.baseLatitude != null && profile?.baseLongitude != null;
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
      { enableHighAccuracy: true },
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
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sagip-offline-id-${payload.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayId = profile?.id ?? 'SG-XXXX-2024-0000';

  useEffect(() => {
    const payload = JSON.stringify({
      id: displayId,
      name: user?.name ?? '',
      app: 'Sagip',
    });
    QRCode.toDataURL(payload, { width: 256, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [displayId, user?.name]);

  return (
    <div
      className="animate-fade-in pb-10 -mx-4"
      role="main"
      aria-label="Profile"
    >
      {/* Dark blue hero with cover area */}
      <section className="relative bg-asean-blue pt-10 pb-12 px-4 flex flex-col items-center gap-5 overflow-hidden">
        {/* Cover layer: gradient from darker blue to asean-blue */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background:
              'linear-gradient(180deg, rgba(0, 30, 70, 0.95) 0%, transparent 45%, #00368e 100%)',
          }}
        />
        <div className="relative flex flex-col items-center gap-5 w-full">
          <div className="relative">
            <div className="h-24 w-24 rounded-full border-4 border-asean-yellow bg-asean-blue flex items-center justify-center overflow-hidden shadow-lg ring-2 ring-white/20">
              {user?.image ? (
                <Image
                  src={user.image}
                  alt=""
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              ) : (
                <Image
                  src={`https://api.dicebear.com/7.x/avataaars/png?seed=profile&backgroundColor=1e3a5f`}
                  alt=""
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
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
              {user?.name || t('profile.wiraUser')}
            </h1>
            <p className="text-white/90 font-sagip text-xs uppercase tracking-widest">
              {isCommunityResponder
                ? t('profile.communityResponder')
                : t('profile.volunteer')}{' '}
              • {t('profile.regionPlaceholder')}
            </p>
          </div>
          <button
            type="button"
            onClick={scrollToDemographics}
            className="w-full max-w-[200px] py-2.5 rounded-xl bg-asean-blue border-2 border-white/40 text-white font-sagip font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            {t('profile.editProfile')}
          </button>
        </div>
      </section>

      <div className="px-4 space-y-4 mt-4">
        {/* Stats row */}
        <section
          className="grid grid-cols-2 gap-3"
          aria-label="User statistics"
        >
          <div className="wira-card p-4 rounded-xl">
            <p className="font-sagip font-bold text-[10px] uppercase tracking-wider text-sagip-muted">
              {t('profile.reportsFiled')}
            </p>
            <p className="text-2xl font-sagip font-bold text-asean-blue mt-1">
              {REPORTS_FILED}
            </p>
            <p className="text-xs font-sagip text-status-safe">
              {REPORTS_TREND}
            </p>
          </div>
          <div className="wira-card p-4 rounded-xl">
            <p className="font-sagip font-bold text-[10px] uppercase tracking-wider text-sagip-muted">
              {t('profile.aidVerified')}
            </p>
            <p className="text-2xl font-sagip font-bold text-status-critical mt-1">
              {AID_VERIFIED}
            </p>
            <p className="text-xs font-sagip text-sagip-muted">
              {t('profile.cases')}
            </p>
          </div>
        </section>

        {/* Emergency Digital Identity */}
        <section
          className="wira-card p-4 space-y-4"
          aria-labelledby="emergency-id-heading"
        >
          <h2
            id="emergency-id-heading"
            className="font-sagip font-bold text-sm uppercase tracking-widest text-sagip-heading flex items-center gap-2"
          >
            <Lock
              size={18}
              className="text-sagip-heading shrink-0"
              aria-hidden
            />
            {t('profile.emergencyDigitalIdentity')}
          </h2>
          <div className="flex flex-col items-center gap-2">
            <div className="w-32 h-32 rounded-lg bg-white border-2 border-sagip-border ring-2 ring-asean-blue/30 flex items-center justify-center p-1.5">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={t('profile.qrAlt')}
                  className="w-full h-full object-contain rounded"
                  width={128}
                  height={128}
                />
              ) : (
                <div className="w-full h-full rounded bg-sagip-border/50 animate-pulse flex items-center justify-center">
                  <span className="font-mono text-[10px] text-sagip-muted">
                    QR
                  </span>
                </div>
              )}
            </div>
            <p className="font-sagip text-sm text-sagip-muted">
              ID: {displayId}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={handleExportOfflineId}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-asean-blue/10 text-asean-blue font-sagip font-bold text-sm hover:bg-asean-blue/20 transition-colors focus:outline-none focus:ring-2 focus:ring-asean-blue/30"
            >
              <Download size={18} aria-hidden />
              {t('profile.exportOfflineId')}
            </button>
            <button
              type="button"
              onClick={handleSetHome}
              disabled={settingHome || setHome.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-status-safe/20 text-status-safe font-sagip font-bold text-sm hover:bg-status-safe/30 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-status-safe/30"
              aria-label={
                hasHome ? t('profile.ariaUpdateHome') : t('profile.ariaSetHome')
              }
            >
              <MapPin size={18} aria-hidden />
              {settingHome || setHome.isPending
                ? t('profile.setting')
                : t('profile.updateCurrentLocation')}
            </button>
          </div>
        </section>

        {/* Control Center */}
        <section
          className="wira-card p-4 space-y-4"
          aria-labelledby="control-center-heading"
        >
          <h2
            id="control-center-heading"
            className="font-sagip font-bold text-sm uppercase tracking-widest text-sagip-heading"
          >
            {t('profile.controlCenter')}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-asean-blue/10">
                  <Globe size={20} className="text-asean-blue" aria-hidden />
                </div>
                <div>
                  <p className="font-sagip font-bold text-sm text-sagip-heading">
                    {t('profile.regionalLanguage')}
                  </p>
                  <p className="font-sagip text-[10px] text-sagip-muted">
                    {t('profile.mcatlEnabled')}
                  </p>
                </div>
              </div>
              <select
                value={regionalLanguage}
                onChange={(e) =>
                  setRegionalLanguage(e.target.value as RegionalLanguageOption)
                }
                className="font-sagip text-sm text-sagip-heading bg-sagip-border/50 border border-sagip-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-asean-blue/30"
                aria-label={t('profile.ariaRegionalLanguage')}
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
                  <p className="font-sagip font-bold text-sm text-sagip-heading">
                    {t('profile.safeMode')}
                  </p>
                  <p className="font-sagip text-[10px] text-sagip-muted">
                    {t('profile.autoReportIdle')}
                  </p>
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
                <p className="font-sagip font-bold text-sm text-sagip-heading">
                  {t('profile.kinContacts')}
                </p>
                {isKinLoading ? (
                  <div
                    className="flex -space-x-2 mt-1.5"
                    aria-busy="true"
                    aria-label={t('profile.loadingKin')}
                  >
                    <div
                      className="w-8 h-8 rounded-full bg-sagip-border border-2 border-white animate-pulse"
                      aria-hidden
                    />
                    <div
                      className="w-8 h-8 rounded-full bg-sagip-border border-2 border-white animate-pulse"
                      aria-hidden
                    />
                  </div>
                ) : kinContacts.length === 0 ? (
                  <p className="font-sagip text-xs text-sagip-muted mt-1.5">
                    {t('profile.noKinYet')}
                  </p>
                ) : (
                  <div className="flex -space-x-2 mt-1.5">
                    {kinContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="w-8 h-8 rounded-full bg-asean-blue/20 border-2 border-white flex items-center justify-center text-asean-blue font-sagip font-bold text-[10px] shrink-0"
                        title={contact.name}
                        aria-hidden
                      >
                        {contact.name
                          .split(/\s+/)
                          .map((s) => s[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => console.log('Add contact')}
                className="flex items-center gap-1.5 font-sagip text-xs text-sagip-muted uppercase tracking-wider hover:text-asean-blue transition-colors"
              >
                {t('profile.addNewContact')}
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
                  <p className="font-sagip font-bold text-sm text-sagip-heading">
                    Response Assets
                  </p>
                  <p className="font-sagip text-[10px] text-sagip-muted">
                    VOLUNTEERED EQUIPMENT
                  </p>
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
        <section
          className="wira-card p-4 space-y-4"
          aria-labelledby="my-assets-heading"
        >
          <div className="flex items-center justify-between">
            <h2
              id="my-assets-heading"
              className="font-sagip font-bold text-sm uppercase tracking-widest text-sagip-heading flex items-center gap-2"
            >
              <Package
                size={18}
                className="text-asean-blue shrink-0"
                aria-hidden
              />
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
            {t('profile.demographicsNeeds')}
          </h2>
          <div className="space-y-3">
            <label className="flex flex-col gap-1.5">
              <span className="font-sagip font-bold text-[10px] uppercase tracking-wider text-sagip-muted">
                {t('profile.ageGroup')}
              </span>
              <select
                className="bg-sagip-border/50 border border-sagip-border rounded-xl text-sm p-3 font-body text-sagip-heading outline-none focus:ring-2 focus:ring-asean-blue/30 focus:border-asean-blue"
                value={user?.ageGroup ?? ''}
                onChange={(e) =>
                  handleDemographicChange('ageGroup', e.target.value || null)
                }
                disabled={updateProfile.isPending}
                aria-label={t('profile.ariaAgeGroup')}
              >
                <option value="">{t('profile.notSpecified')}</option>
                <option value="UNDER_12">{t('profile.under12')}</option>
                <option value="AGE_12_17">{t('profile.age12_17')}</option>
                <option value="AGE_18_59">{t('profile.age18_59')}</option>
                <option value="AGE_60_PLUS">{t('profile.age60Plus')}</option>
              </select>
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl bg-sagip-border/50 border border-sagip-border active:scale-[0.98] transition-all cursor-pointer">
              <span className="text-sm font-sagip font-medium text-sagip-heading">
                {t('profile.pregnant')}
              </span>
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-2 border-sagip-slate text-asean-blue accent-asean-blue focus:ring-asean-blue/30"
                checked={user?.pregnantStatus ?? false}
                onChange={(e) =>
                  handleDemographicChange('pregnantStatus', e.target.checked)
                }
                disabled={updateProfile.isPending}
                aria-label={t('profile.ariaPregnant')}
              />
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl bg-sagip-border/50 border border-sagip-border active:scale-[0.98] transition-all cursor-pointer">
              <span className="text-sm font-sagip font-medium text-sagip-heading">
                {t('profile.pwd')}
              </span>
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-2 border-sagip-slate text-asean-blue accent-asean-blue focus:ring-asean-blue/30"
                checked={user?.isPWD ?? false}
                onChange={(e) =>
                  handleDemographicChange('isPWD', e.target.checked)
                }
                disabled={updateProfile.isPending}
                aria-label={t('profile.ariaPwd')}
              />
            </label>
          </div>
        </section>

        {/* Volunteer Home (when profile exists) */}
        {profile && (
          <section
            className="wira-card p-4 space-y-3"
            aria-labelledby="volunteer-home-heading"
          >
            <h2
              id="volunteer-home-heading"
              className="font-sagip font-bold text-sm uppercase tracking-widest text-sagip-heading flex items-center gap-2"
            >
              <MapPin
                size={20}
                className="text-asean-blue shrink-0"
                aria-hidden
              />
              {t('profile.volunteerHome')}
            </h2>
            {hasHome ? (
              <p className="text-xs font-sagip text-sagip-muted flex items-center gap-1.5">
                <MapPin
                  size={14}
                  className="text-asean-blue shrink-0"
                  aria-hidden
                />
                {t('profile.setAt')} {profile.baseLatitude?.toFixed(5)},{' '}
                {profile.baseLongitude?.toFixed(5)}
              </p>
            ) : (
              <p className="text-xs font-sagip text-sagip-muted">
                {t('profile.notSet')}
              </p>
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
            aria-label={t('profile.ariaLogout')}
          >
            <LogOut size={18} aria-hidden />
            {t('profile.logout')}
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
