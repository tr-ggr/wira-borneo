'use client';

import React, { useState } from 'react';
import { useAuthControllerGetSession } from '@wira-borneo/api-client';
import Login from '../components/auth/Login';
import Register from '../components/auth/Register';
import LayoutWrapper from '../components/LayoutWrapper';
import MapForecast from '../components/screens/MapForecast';
import Warnings from '../components/screens/Warnings';
import Family from '../components/screens/Family';
import LLMAssistant from '../components/screens/LLMAssistant';
import HelpDashboard from '../components/screens/HelpDashboard';
import Profile from '../components/screens/Profile';

export default function MainApp() {
  const { data: session, isLoading } = useAuthControllerGetSession();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentScreen, setCurrentScreen] = useState<string>('/');
  
  // Map and Routing State
  const [focusedHelpRequestId, setFocusedHelpRequestId] = useState<string | null>(null);
  const [mapFocus, setMapFocus] = useState<{ latitude: number, longitude: number } | null>(null);
  const [showAllPins, setShowAllPins] = useState(true); // Default to true as per request "Multiple help pins can also be enabled"

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-wira-ivory">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-wira-gold shadow-lg shadow-wira-gold/20"></div>
          <span className="text-xs font-mono text-wira-teal uppercase tracking-widest font-bold">WIRA Loading...</span>
        </div>
      </div>
    );
  }

  const renderScreen = () => {
    if (!session?.user && !['/', '/warnings', '/family'].includes(currentScreen)) {
       return (
        <div className="flex flex-1 flex-col items-center justify-center bg-wira-ivory px-6 wira-batik-bg overflow-hidden py-10">
          {authView === 'login' ? (
            <Login onToggleRegister={() => setAuthView('register')} />
          ) : (
            <Register onToggleLogin={() => setAuthView('login')} />
          )}
        </div>
      );
    }

    switch (currentScreen) {
      case '/': return (
        <MapForecast 
          focusedHelpRequestId={focusedHelpRequestId}
          mapFocus={mapFocus}
          showAllPins={showAllPins}
          onCancelRouting={() => {
            setFocusedHelpRequestId(null);
            setMapFocus(null);
          }}
        />
      );
      case '/warnings': return <Warnings />;
      case '/family': return <Family />;
      case '/assistant': return <LLMAssistant />;
      case '/help': return (
        <HelpDashboard 
          onNavigateToRequest={(id, loc) => {
            setFocusedHelpRequestId(id);
            setMapFocus(loc);
            setCurrentScreen('/');
          }}
          showAllPins={showAllPins}
          onToggleShowAllPins={setShowAllPins}
        />
      );
      case '/profile': return <Profile />;
      default: return (
        <MapForecast 
          focusedHelpRequestId={focusedHelpRequestId}
          mapFocus={mapFocus}
          showAllPins={showAllPins}
          onCancelRouting={() => {
            setFocusedHelpRequestId(null);
            setMapFocus(null);
          }}
        />
      );
    }
  };

  return (
    <LayoutWrapper currentPath={currentScreen} onNavigate={setCurrentScreen}>
      {renderScreen()}
    </LayoutWrapper>
  );
}
