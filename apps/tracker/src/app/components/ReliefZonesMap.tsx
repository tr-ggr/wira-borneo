'use client';

import { useState } from 'react';
import { useTrackerControllerGetReliefZones } from '@wira-borneo/api-client';

export function ReliefZonesMap() {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const { data: zones = [] } = useTrackerControllerGetReliefZones({
    query: { refetchInterval: 30000 },
  });

  // Transform API data to include position information
  const reliefZones = zones.map((zone, index) => ({
    ...zone,
    // Generate positions based on index (simplified - in production, use actual coordinates)
    position:
      index % 2 === 0
        ? { top: `${25 + index * 10}%`, left: `${33 + index * 5}%` }
        : { bottom: `${33 - index * 10}%`, right: `${25 + index * 5}%` },
    type: zone.familyCount > 0 ? 'evacuation' : 'supply',
  }));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">public</span>
          Relief Zones Map
        </h3>
        <div className="flex gap-2">
          <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold">
            Active
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold">
            View All
          </span>
        </div>
      </div>

      <div className="h-[400px] bg-slate-200 dark:bg-slate-800 relative">
        <img
          className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-500"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuArJNo_eplxPlJl79zJZ5zmGgDfHN_4zxBWO3dQUotSyaK2fEyL55wGO-2roIUqIHshB80MbFi6HRNK-6OK2oLZEQV-zBkqyotqY7SdkX402BOVFSDBhyL3zrJwQfVXvF_iogQNHFQZdtbIiH00mjoe3eeDDb56p9vuVAQXR27lNfGMmBLtZx3_MCYnPOUJZFN9JF19rg5zBO01gFnE51IMEGE4ejdDLbAeORONVD_RMxltnEDAHLAoZAGGqSePBxvVkzTL26sqJh8"
          alt="Satellite map view of Southeast Asian region with relief markers"
        />

        {/* Map Pins Overlay */}
        {reliefZones.map((zone) => (
          <div
            key={zone.id}
            className="absolute group"
            style={zone.position}
            onMouseEnter={() => setHoveredZone(zone.id)}
            onMouseLeave={() => setHoveredZone(null)}
          >
            <div
              className={`size-4 ${
                zone.type === 'evacuation' ? 'bg-primary' : 'bg-accent-red'
              } rounded-full animate-ping absolute`}
            ></div>
            <div
              className={`size-4 ${
                zone.type === 'evacuation' ? 'bg-primary' : 'bg-accent-red'
              } rounded-full relative ${
                zone.type === 'evacuation'
                  ? 'shadow-lg shadow-primary/50'
                  : 'shadow-lg shadow-accent-red/50'
              }`}
            ></div>

            <div
              className={`absolute left-6 top-0 bg-white dark:bg-slate-900 p-2 rounded-lg shadow-xl text-xs font-bold border border-slate-200 dark:border-slate-700 w-32 z-10 transition-opacity duration-200 ${
                hoveredZone === zone.id
                  ? 'opacity-100'
                  : 'opacity-0 pointer-events-none'
              }`}
            >
              {zone.name}
              <br />
              <span className="text-slate-500 font-normal">
                {zone.familyCount > 0
                  ? `${zone.familyCount} Families`
                  : zone.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
