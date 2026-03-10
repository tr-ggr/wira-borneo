export function TrustBanner() {
  const features = [
    { icon: 'shield_person', label: 'Secured' },
    { icon: 'grid_view', label: 'Distributed' },
    { icon: 'history', label: 'Audited' },
  ];

  return (
    <div className="mt-12 p-8 rounded-2xl asean-gradient relative overflow-hidden text-white flex flex-col md:flex-row items-center justify-between gap-8">
      <div className="absolute inset-0 batik-overlay opacity-20"></div>

      <div className="relative z-10 text-center md:text-left">
        <h3 className="text-2xl font-bold mb-2">Regional Mutual Trust</h3>
        <p className="text-white/80 max-w-lg text-sm leading-relaxed">
          Every transaction recorded on the ASEAN Relief system is audited by
          independent nodes in Jakarta, Singapore, and Bangkok to ensure
          humanitarian aid reaches its intended recipients without interference.
        </p>
      </div>

      <div className="relative z-10 flex gap-4 shrink-0">
        {features.map((feature) => (
          <div key={feature.label} className="flex flex-col items-center">
            <div className="size-14 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-2 border border-white/20">
              <span className="material-symbols-outlined text-2xl">
                {feature.icon}
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
              {feature.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
