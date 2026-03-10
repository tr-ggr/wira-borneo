'use client';

import Link from 'next/link';
import { Header } from '../components/Header';
import { StatCard } from '../components/StatCard';
import { NodeValidators } from '../components/NodeValidators';
import { ReliefZonesMap } from './components/ReliefZonesMap';
import { RecentImpactLogs } from './components/RecentImpactLogs';
import { DonationDistribution } from './components/DonationDistribution';
import { useNetworkStats } from '../lib/blockchain/hooks';
import {
  useTrackerControllerGetStats,
  useTrackerControllerGetValidators,
} from '@wira-borneo/api-client';

export default function DashboardPage() {
  const { validatorCount } = useNetworkStats();
  const { data: stats } = useTrackerControllerGetStats({
    query: { refetchInterval: 30000 },
  });
  const { data: validators } = useTrackerControllerGetValidators({
    query: { refetchInterval: 30000 },
  });

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen relative">
      <div className="fixed inset-0 batik-overlay pointer-events-none"></div>

      <div className="flex h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto relative z-0">
          <Header />

          <div className="p-8 space-y-8">
            <section>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                  <h2 className="text-4xl font-bold tracking-tight mb-2">
                    Track Your Impact
                  </h2>
                  <p className="text-slate-500 max-w-lg">
                    Transparent humanitarian aid delivery secured by ASEAN
                    blockchain validation nodes.
                  </p>
                </div>
                <Link
                  href="/transactions"
                  className="bg-gradient-to-r from-primary to-accent-red text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center gap-2"
                >
                  View Transactions
                  <span className="material-symbols-outlined text-sm">
                    arrow_forward
                  </span>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  title="Total Aid Disbursed"
                  value={`$${stats?.totalAidDisbursed?.toLocaleString() || '0'}`}
                  icon="trending_up"
                  change="+12.4% from last month"
                  changeType="positive"
                  accentColor="primary"
                />
                <StatCard
                  title="Verified Payouts"
                  value={stats?.verifiedPayouts?.toLocaleString() || '0'}
                  icon="verified"
                  change="100% On-chain Audit"
                  changeType="positive"
                  accentColor="red"
                />
                <StatCard
                  title="Network Trust Index"
                  value={`${stats?.networkTrustIndex?.toFixed(2) || '99.98'}%`}
                  icon="security"
                  change={`${validators?.length || validatorCount || 42} Active Validators`}
                  changeType="neutral"
                  accentColor="gradient"
                />
              </div>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 space-y-6">
                <ReliefZonesMap />
                <RecentImpactLogs />
              </div>

              <div className="space-y-8">
                <NodeValidators />
                <DonationDistribution />
              </div>
            </div>
          </div>

          <footer className="p-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-xs font-medium">
            <div className="flex items-center gap-4">
              <span>© 2024 ASEAN Relief Foundation</span>
              <a href="#" className="hover:text-primary transition-colors">
                Privacy Protocol
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Network Governance
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">
                language
              </span>
              <span>Consensus Layer: Proof of Impact (PoI)</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
