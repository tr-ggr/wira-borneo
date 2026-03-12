'use client';

import React, { useState } from 'react';
import {
  Package,
  Plane,
  Truck,
  Search,
  FileText,
  Shield,
  Filter,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Globe,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';

type BlockchainPageProps = {
  onBack?: () => void;
  onNavigate?: (path: string) => void;
};

type BlockchainView = 'impact' | 'shipments';
type ShipmentTab = 'dispatched' | 'in_transit' | 'delivered';

const RELIEF_PROGRESS_KEYS = [
  { icon: Package, statusKey: 'blockchain.dispatchConfirmed', locationKey: 'blockchain.reliefLocation1', time: '14:20' },
  { icon: Plane, statusKey: 'blockchain.inTransitAir', locationKey: 'blockchain.reliefLocation2', time: '11:05' },
  { icon: Truck, statusKey: 'blockchain.regionalDistribution', locationKey: 'blockchain.reliefLocation3', time: 'Est. 18:00' },
];

const DEMOGRAPHICS_KEYS = [
  { labelKey: 'blockchain.emergencyShelters', percent: 45 },
  { labelKey: 'blockchain.medicalRelief', percent: 30 },
  { labelKey: 'blockchain.waterAndFood', percent: 25 },
];

const NETWORK_TRUST_ORGS = [
  { name: 'Indo Red Cross', verified: true },
  { name: 'WHO SE-Asia', verified: true },
  { name: 'ASEAN AHA Centre', verified: true },
];

const BLOCKCHAIN_LOGS_KEYS = [
  { typeKey: 'blockchain.transactionConfirmed', hash: '0x7a2...4f91', description: '500 Food Kits Distributed', time: '2m ago' },
  { typeKey: 'blockchain.contractExecuted', hash: '0xb14...e221', description: 'Logistic Node Handover', time: '15m ago' },
];

const MOCK_SHIPMENTS = [
  { id: 'AR-8821', origin: 'JKT', destination: 'MNL', status: 'verified' as const, date: '2023-10-24', hash: '0x7a2...f93e' },
  { id: 'SG-4412', origin: 'SIN', destination: 'MNL', status: 'pending' as const, date: '2023-10-24', hash: '0x461...0128' },
  { id: 'VN-2290', origin: 'HAN', destination: 'JKT', status: 'verified' as const, date: '2023-10-23', hash: '0x22a...e221' },
  { id: 'MY-1123', origin: 'KUL', destination: 'MNL', status: 'pending' as const, date: '2023-10-23', hash: '0x99e...a5f1' },
];

function TrackYourImpactView() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-6 pb-6 min-w-0">
      <section className="bg-asean-blue rounded-t-2xl rounded-b-xl px-4 pt-6 pb-5 flex flex-col gap-4">
        <h2 className="font-sagip font-bold text-white text-xl leading-tight">
          {t('blockchain.trackImpact')}
        </h2>
        <p className="font-sagip font-normal text-white/90 text-sm">
          {t('blockchain.realTimeLogistics')}
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="search"
            placeholder={t('blockchain.searchMissionPlaceholder')}
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/95 text-sagip-heading font-sagip text-sm placeholder:text-slate-400 border-0"
            aria-label={t('blockchain.searchMissionAria')}
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-sagip font-bold text-asean-blue text-base uppercase tracking-tight">
            {t('blockchain.reliefProgress')}
          </h3>
          <button
            type="button"
            className="font-sagip font-bold text-asean-blue text-xs hover:underline"
          >
            {t('blockchain.liveUpdates')}
          </button>
        </div>
        <ul className="flex flex-col gap-0 divide-y divide-sagip-border bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
          {RELIEF_PROGRESS_KEYS.map((item, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="shrink-0 flex items-center justify-center size-10 rounded-lg bg-slate-100 text-asean-blue">
                <item.icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-sagip font-bold text-sagip-heading text-sm">{t(item.statusKey)}</p>
                <p className="font-sagip font-normal text-sagip-muted text-xs truncate">{t(item.locationKey)}</p>
              </div>
              <span className="font-sagip font-medium text-sagip-muted text-xs shrink-0">{item.time}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="min-w-0">
        <h3 className="font-sagip font-bold text-asean-blue text-base uppercase tracking-tight mb-3">
          {t('blockchain.impactAnalytics')}
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-4 min-w-0">
          <div className="bg-white rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <p className="font-sagip font-bold text-[10px] uppercase text-sagip-muted tracking-wider">{t('blockchain.beneficiaries')}</p>
            <p className="font-sagip font-bold text-sagip-heading text-2xl mt-1">12.4k</p>
            <div className="flex items-center gap-1 mt-1 text-[#22c55e]">
              <TrendingUp className="size-3" />
              <span className="font-sagip text-xs">{t('blockchain.vsLastWeek')}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <p className="font-sagip font-bold text-[10px] uppercase text-sagip-muted tracking-wider">{t('blockchain.resources')}</p>
            <p className="font-sagip font-bold text-sagip-heading text-2xl mt-1">$1.2M</p>
            <div className="flex items-center gap-1 mt-1 text-sagip-muted">
              <Calendar className="size-3" />
              <span className="font-sagip text-xs">{t('blockchain.quarterLabel')}</span>
            </div>
          </div>
        </div>
        <div className="bg-[#f1f5f9] rounded-xl h-32 flex items-center justify-center border border-sagip-border mb-4">
          <span className="font-sagip text-sm text-sagip-muted">{t('blockchain.mapActiveZone')}</span>
        </div>
        <div className="space-y-2 min-w-0">
          <p className="font-sagip font-bold text-sagip-heading text-sm">{t('blockchain.demographicsServed')}</p>
          {DEMOGRAPHICS_KEYS.map((d, i) => (
            <div key={i} className="min-w-0">
              <div className="flex justify-between text-xs font-sagip text-sagip-muted mb-0.5">
                <span className="min-w-0 truncate">{t(d.labelKey)}</span>
                <span className="shrink-0">{d.percent}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden min-w-0">
                <div
                  className="h-full rounded-full bg-asean-red max-w-full"
                  style={{ width: `${d.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="min-w-0 overflow-hidden">
        <h3 className="font-sagip font-bold text-asean-blue text-base uppercase tracking-tight mb-3">
          {t('blockchain.networkTrust')}
        </h3>
        <div className="flex gap-3 overflow-x-auto overflow-y-hidden pb-2 min-w-0 [&::-webkit-scrollbar]:h-1">
          {NETWORK_TRUST_ORGS.map((org, i) => (
            <div
              key={i}
              className="shrink-0 w-[140px] bg-white rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-sagip-border"
            >
              <div className="flex items-center justify-center size-10 rounded-lg bg-slate-100 text-asean-blue mb-2">
                <Globe className="size-5" />
              </div>
              <p className="font-sagip font-bold text-sagip-heading text-xs truncate">{org.name}</p>
              {org.verified && (
                <span className="inline-flex items-center gap-1 mt-1 font-sagip text-[10px] text-[#22c55e]">
                  <CheckCircle2 className="size-3" />
                  {t('blockchain.verified')}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-sagip font-bold text-asean-blue text-base uppercase tracking-tight">
            {t('blockchain.blockchainLogs')}
          </h3>
          <button
            type="button"
            className="font-sagip font-bold text-asean-blue text-xs hover:underline"
          >
            {t('blockchain.viewExplorer')}
          </button>
        </div>
        <ul className="flex flex-col gap-0 divide-y divide-sagip-border bg-white rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
          {BLOCKCHAIN_LOGS_KEYS.map((log, i) => (
            <li key={i} className="flex items-start gap-3 px-4 py-3">
              <div className="shrink-0 mt-0.5 text-asean-blue">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="font-sagip font-medium text-sagip-heading text-xs">{t(log.typeKey)}</p>
                <p className="font-sagip font-normal text-sagip-muted text-xs truncate">
                  {log.hash} | {log.description}
                </p>
              </div>
              <span className="font-sagip text-xs text-sagip-muted shrink-0">{log.time}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ShipmentsView() {
  const { t } = useI18n();
  const [shipmentTab, setShipmentTab] = useState<ShipmentTab>('in_transit');
  const tabs: { id: ShipmentTab; labelKey: string }[] = [
    { id: 'dispatched', labelKey: 'blockchain.dispatched' },
    { id: 'in_transit', labelKey: 'blockchain.inTransit' },
    { id: 'delivered', labelKey: 'blockchain.delivered' },
  ];

  return (
    <div className="flex flex-col gap-6 pb-6 min-w-0">
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setShipmentTab(tab.id)}
            className={`flex-1 py-2 rounded-md font-sagip font-bold text-sm transition-colors ${
              shipmentTab === tab.id
                ? 'bg-white text-asean-blue shadow-sm'
                : 'text-sagip-muted hover:text-sagip-heading'
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="search"
            placeholder={t('blockchain.searchShipmentPlaceholder')}
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-sagip-border text-sagip-heading font-sagip text-sm placeholder:text-slate-400"
            aria-label={t('blockchain.searchShipmentAria')}
          />
        </div>
        <button
          type="button"
          className="shrink-0 flex items-center justify-center size-12 rounded-lg bg-white border border-sagip-border text-sagip-muted hover:bg-slate-50"
          aria-label={t('blockchain.filterAria')}
        >
          <Filter className="size-5" />
        </button>
      </div>

      <button
        type="button"
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-asean-blue text-white font-sagip font-bold text-sm hover:opacity-90"
      >
        <Shield className="size-4" />
        {t('blockchain.exportImmutableRecord')}
      </button>

      <section className="min-w-0">
        <h3 className="font-sagip font-bold text-asean-blue text-base uppercase tracking-tight mb-3">
          {t('blockchain.activeShipments')}
        </h3>
        <ul className="flex flex-col gap-3 min-w-0">
          {MOCK_SHIPMENTS.map((s) => (
            <li
              key={s.id}
              className="bg-white rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-sagip-border min-w-0 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-sagip font-bold text-sagip-heading">{s.id}</span>
                <span
                  className={`font-sagip font-bold text-[10px] uppercase px-2 py-0.5 rounded-full ${
                    s.status === 'verified'
                      ? 'bg-[#dcfce7] text-[#166534]'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {s.status === 'verified' ? t('blockchain.verified') : t('blockchain.pending')}
                </span>
              </div>
              <p className="font-sagip text-sm text-sagip-muted mb-1">
                {s.origin} → {s.destination}
              </p>
              <p className="font-sagip text-xs text-sagip-muted mb-2">{s.date}</p>
              <p className="font-mono text-xs text-sagip-muted mb-2 truncate">{s.hash}</p>
              <button
                type="button"
                className="font-sagip font-bold text-asean-blue text-xs hover:underline"
              >
                {t('blockchain.viewDetail')}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-sagip-border">
        <h3 className="font-sagip font-bold text-asean-blue text-base uppercase tracking-tight mb-4 flex items-center gap-2">
          <Shield className="size-4" />
          {t('blockchain.regionalMutualTrust')}
        </h3>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="flex flex-col items-center">
            <div className="size-14 rounded-full bg-[#dcfce7] flex items-center justify-center text-[#166534] font-sagip font-bold text-sm">
              14.2k
            </div>
            <span className="font-sagip text-[10px] uppercase text-sagip-muted mt-1">{t('blockchain.secured')}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="size-14 rounded-full bg-[#dbeafe] flex items-center justify-center text-asean-blue font-sagip font-bold text-sm">
              88.5%
            </div>
            <span className="font-sagip text-[10px] uppercase text-sagip-muted mt-1">{t('blockchain.distrib')}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="size-14 rounded-full bg-[#dcfce7] flex items-center justify-center text-[#166534] font-sagip font-bold text-sm">
              100%
            </div>
            <span className="font-sagip text-[10px] uppercase text-sagip-muted mt-1">{t('blockchain.audited')}</span>
          </div>
        </div>
        <p className="font-sagip text-xs text-sagip-muted italic">
          {t('blockchain.consensusFootnote')}
        </p>
      </section>
    </div>
  );
}

export default function BlockchainPage({ onBack, onNavigate }: BlockchainPageProps) {
  const { t } = useI18n();
  const [view, setView] = useState<BlockchainView>('impact');

  return (
    <div className="flex flex-col w-full min-w-0 min-h-full overflow-x-hidden">
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg mb-4 shrink-0 min-w-0">
        <button
          type="button"
          onClick={() => setView('impact')}
          className={`flex-1 py-2.5 rounded-md font-sagip font-bold text-sm transition-colors ${
            view === 'impact'
              ? 'bg-white text-asean-blue shadow-sm'
              : 'text-sagip-muted hover:text-sagip-heading'
          }`}
        >
          {t('blockchain.trackImpact')}
        </button>
        <button
          type="button"
          onClick={() => setView('shipments')}
          className={`flex-1 py-2.5 rounded-md font-sagip font-bold text-sm transition-colors ${
            view === 'shipments'
              ? 'bg-white text-asean-blue shadow-sm'
              : 'text-sagip-muted hover:text-sagip-heading'
          }`}
        >
          {t('blockchain.shipments')}
        </button>
      </div>

      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
        {view === 'impact' ? <TrackYourImpactView /> : <ShipmentsView />}
      </div>
    </div>
  );
}
