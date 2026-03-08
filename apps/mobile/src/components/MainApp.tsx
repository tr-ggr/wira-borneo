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

  if (!session?.user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-wira-ivory px-6 wira-batik-bg overflow-hidden">
        {authView === 'login' ? (
          <Login onToggleRegister={() => setAuthView('register')} />
        ) : (
          <Register onToggleLogin={() => setAuthView('login')} />
        )}
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case '/': return <MapForecast />;
      case '/warnings': return <Warnings />;
      case '/family': return <Family />;
      case '/assistant': return <LLMAssistant />;
      case '/help': return <HelpDashboard />;
      case '/profile': return <Profile />;
      default: return <MapForecast />;
    }
  };

  return (
    <LayoutWrapper currentPath={currentScreen} onNavigate={setCurrentScreen}>
      {renderScreen()}
    </LayoutWrapper>
  );
}
