'use client';

import { useTrackerControllerGetDonationDistribution } from '@wira-borneo/api-client';

export function DonationDistribution() {
  const { data: distribution, isLoading } =
    useTrackerControllerGetDonationDistribution({
      query: { refetchInterval: 30000 },
    });

  const categories = distribution
    ? Object.entries(distribution).map(([name, percentage]) => ({
        name,
        percentage,
        color: getCategoryColor(name),
      }))
    : [];

  function getCategoryColor(name: string): string {
    if (
      name.toLowerCase().includes('food') ||
      name.toLowerCase().includes('water')
    )
      return 'bg-primary';
    if (name.toLowerCase().includes('medical')) return 'bg-accent-red';
    if (
      name.toLowerCase().includes('cash') ||
      name.toLowerCase().includes('grant')
    )
      return 'bg-yellow-400';
    return 'bg-slate-400';
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        Loading...
      </div>
    );
  }
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
      <h3 className="font-bold mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">
          pie_chart
        </span>
        Donation Distribution
      </h3>

      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category.name}>
            <div className="flex justify-between text-xs mb-1.5 font-medium">
              <span>{category.name}</span>
              <span>{category.percentage}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`${category.color} h-full rounded-full transition-all duration-500`}
                style={{ width: `${category.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
