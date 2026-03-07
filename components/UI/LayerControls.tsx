"use client";

export type MapLayer = "default" | "temp" | "rain" | "wind";

interface LayerControlsProps {
  active: MapLayer;
  onChange: (layer: MapLayer) => void;
}

const LAYERS: { id: MapLayer; label: string; icon: string }[] = [
  { id: "default", label: "Map",   icon: "🗺️" },
  { id: "temp",    label: "Temp",  icon: "🌡️" },
  { id: "rain",    label: "Rain",  icon: "🌧️" },
  { id: "wind",    label: "Wind",  icon: "💨" },
];

export default function LayerControls({ active, onChange }: LayerControlsProps) {
  return (
    <div className="flex gap-1 p-1 rounded-xl glass-sm">
      {LAYERS.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          title={label}
          className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold transition-all
            ${
              active === id
                ? "bg-[var(--asean-blue)] text-[var(--asean-yellow)] border border-[rgba(245,211,18,0.4)] shadow-md"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(0,56,147,0.2)]"
            }`}
        >
          <span>{icon}</span>
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
