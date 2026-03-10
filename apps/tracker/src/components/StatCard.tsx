interface StatCardProps {
  title: string;
  value: string | number;
  icon?: string;
  change?: string;
  changeType?: 'positive' | 'neutral';
  accentColor?: 'primary' | 'red' | 'gradient';
}

export function StatCard({
  title,
  value,
  icon,
  change,
  changeType = 'positive',
  accentColor = 'primary',
}: StatCardProps) {
  const accentColorClasses = {
    primary: 'bg-primary/5',
    red: 'bg-accent-red/5',
    gradient: '',
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 subtle-glow relative overflow-hidden">
      <div
        className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 ${
          accentColor !== 'gradient' ? accentColorClasses[accentColor] : ''
        }`}
      ></div>

      <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold">{value}</h3>

      {change && (
        <div
          className={`mt-4 flex items-center gap-2 text-sm font-bold ${
            changeType === 'positive' ? 'text-green-500' : 'text-primary'
          }`}
        >
          {icon && (
            <span className="material-symbols-outlined text-sm">{icon}</span>
          )}
          {change}
        </div>
      )}

      {accentColor === 'gradient' && (
        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-accent-red"></div>
      )}
    </div>
  );
}
