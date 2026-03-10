'use client';

import React, { useState, useEffect } from 'react';
import { Layout } from 'lucide-react';

export default function MobileEnforcer({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) {
    return (
      <div className="fixed inset-0 bg-wira-night z-[9999] flex flex-col items-center justify-center p-8 text-center space-y-8 wira-batik-bg">
        <div className="relative">
          <div className="absolute inset-0 bg-wira-gold/20 blur-3xl rounded-full"></div>
          <Layout className="text-wira-gold w-24 h-24 relative animate-pulse-slow" />
        </div>
        
        <div className="max-w-xs space-y-4">
          <h1 className="text-3xl font-display font-bold text-wira-ivory">WIRA</h1>
          <div className="space-y-2">
            <h2 className="text-2xl font-display font-bold text-wira-gold">Switch to Mobile</h2>
            <p className="text-xs font-body text-wira-ivory-dark/70 leading-relaxed">
              WIRA is designed as a specialized mobile experience for disaster response. 
              Please view this app on a mobile device or resize your browser to a mobile width.
            </p>
            <div className="pt-2">
              <div className="h-1 w-12 bg-wira-gold mx-auto rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
