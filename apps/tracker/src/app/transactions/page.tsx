'use client';

import { useState } from 'react';
import { Header } from '../../components/Header';
import { ShipmentTable } from './components/ShipmentTable';
import { TrustBanner } from './components/TrustBanner';
import { useTrackerControllerGetShipments } from '@wira-borneo/api-client';

type TabType = 'dispatched' | 'in_transit' | 'delivered';

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dispatched');

  const { data: dispatched = [] } = useTrackerControllerGetShipments(
    { status: 'DISPATCHED' },
    { query: { refetchInterval: 30000 } },
  );
  const { data: inTransit = [] } = useTrackerControllerGetShipments(
    { status: 'IN_TRANSIT' },
    { query: { refetchInterval: 30000 } },
  );
  const { data: delivered = [] } = useTrackerControllerGetShipments(
    { status: 'DELIVERED' },
    { query: { refetchInterval: 30000 } },
  );

  const tabs: { key: TabType; label: string; icon: string; count: number }[] = [
    {
      key: 'dispatched',
      label: 'Dispatched',
      icon: 'local_shipping',
      count: dispatched.length,
    },
    {
      key: 'in_transit',
      label: 'In Transit',
      icon: 'conversion_path',
      count: inTransit.length,
    },
    {
      key: 'delivered',
      label: 'Delivered',
      icon: 'task_alt',
      count: delivered.length,
    },
  ];

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen relative">
      <div className="fixed inset-0 batik-overlay pointer-events-none"></div>

      <div className="flex h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto relative z-0">
          <Header />

          <div className="p-8 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <nav className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">
                  <span>Systems</span>
                  <span className="material-symbols-outlined text-xs">
                    chevron_right
                  </span>
                  <span className="text-primary">Logistics Ledger</span>
                </nav>
                <h1 className="text-4xl font-black tracking-tight mb-2">
                  Transaction Management
                </h1>
                <p className="text-slate-500 max-w-xl">
                  Real-time blockchain-verified relief shipments across ASEAN
                  member states. Decentralized verification ensures transparency
                  and speed.
                </p>
              </div>
              <button className="flex items-center gap-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-slate-900/10">
                <span className="material-symbols-outlined text-lg">
                  cloud_download
                </span>
                Export Immutable Record
              </button>
            </div>

            {/* Tab System */}
            <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-8 py-4 text-sm font-bold transition-all flex items-center gap-2 ${
                      activeTab === tab.key
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border-b-2 border-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {tab.icon}
                    </span>
                    {tab.label}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        activeTab === tab.key
                          ? 'bg-primary/10'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              <ShipmentTable status={activeTab} />
            </div>

            <TrustBanner />
          </div>

          {/* Footer */}
          <footer className="border-t border-slate-200 dark:border-slate-800 px-6 lg:px-20 py-8 text-center text-slate-400 text-xs">
            <p>
              © 2023 ASEAN Humanitarian Assistance Centre. Blockchain verified
              relief logistics.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
