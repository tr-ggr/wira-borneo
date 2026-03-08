'use client';

import React from 'react';
import { Shield, MapPin, Wind, Thermometer, CloudRain } from 'lucide-react';
import { useRiskIntelligenceControllerGetForecast } from '@wira-borneo/api-client';

export default function MapForecast() {
  // Mock coordinates for demo (Kuching, Sarawak)
  const { data: forecast, isLoading } = useRiskIntelligenceControllerGetForecast({
    latitude: 1.5533,
    longitude: 110.3592
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="space-y-1">
        <h1 className="text-2xl font-display font-bold text-wira-night leading-tight">Kuching, Sarawak</h1>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-status-safe"></span>
          <p className="text-xs font-body font-medium text-wira-earth/70 uppercase tracking-wider">Status: Secure</p>
        </div>
      </header>

      {/* Map Placeholder */}
      <div className="relative w-full aspect-square rounded-3xl overflow-hidden bg-wira-teal-dark shadow-wira border border-wira-teal flex items-center justify-center group">
        <div className="absolute inset-0 opacity-10 wira-batik-bg"></div>
        
        {/* Mock Map Markers */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
           <div className="relative">
              <div className="absolute inset-0 bg-wira-gold rounded-full animate-ping opacity-75"></div>
              <div className="relative h-4 w-4 bg-wira-gold rounded-full border-2 border-white shadow-lg"></div>
           </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20">
          <p className="text-[10px] font-mono text-white/60 uppercase tracking-widest text-center">Smart Map Visualization</p>
        </div>
        
        <MapPin className="text-white/20 w-32 h-32" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ForecastCard 
          icon={CloudRain} 
          label="Flood Risk" 
          value="LOW" 
          color="status-safe"
        />
        <ForecastCard 
          icon={Wind} 
          label="Wind Speed" 
          value="12 km/h" 
          color="wira-teal"
        />
        <ForecastCard 
          icon={Thermometer} 
          label="Temperature" 
          value="29°C" 
          color="wira-gold"
        />
        <ForecastCard 
          icon={Shield} 
          label="Air Quality" 
          value="EXCELLENT" 
          color="status-safe"
        />
      </div>

      <div className="wira-card space-y-3">
        <h3 className="text-sm font-display font-bold text-wira-night">Risk Intelligence Analysis</h3>
        <p className="text-xs font-body text-wira-earth leading-relaxed">
          No secondary flood or typhoon threats detected within the next 24 hours. 
          Your current area is in a safe zone.
        </p>
        <button className="text-xs font-body font-bold text-wira-gold uppercase tracking-wider">Download Full Report</button>
      </div>
    </div>
  );
}

function ForecastCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="wira-card flex flex-col gap-2">
      <div className={`p-2 rounded-lg bg-${color}/10 w-fit`}>
        <Icon className={`text-${color} w-4 h-4`} />
      </div>
      <div>
        <p className="text-[10px] font-body font-bold text-wira-earth/60 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className={`text-sm font-display font-bold text-${color}`}>{value}</p>
      </div>
    </div>
  );
}
