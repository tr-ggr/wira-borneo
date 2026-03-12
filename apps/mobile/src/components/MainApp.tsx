'use client';

import React, { useState } from 'react';
import {
  useAuthControllerGetSession,
  useAuthControllerSignOut,
} from '@wira-borneo/api-client';
import Login from '../components/auth/Login';
import Register from '../components/auth/Register';
import LayoutWrapper from '../components/LayoutWrapper';
import MapForecast from '../components/screens/MapForecast';
import SagipHome from '../components/screens/SagipHome';
import type { EvacuationSite } from '../components/MapComponent';
import Warnings from '../components/screens/Warnings';
import Family from '../components/screens/Family';
import LLMAssistant from '../components/screens/LLMAssistant';
import HelpDashboard from '../components/screens/HelpDashboard';
import Profile from '../components/screens/Profile';
import SosPage from '../components/screens/SosPage';
import BlockchainPage from '../components/screens/BlockchainPage';
import FloodSimulation from '../components/screens/FloodSimulation';
import HealthOutbreaks from './screens/HealthOutbreaks';
import PinLocationScreen from '../components/screens/PinLocationScreen';

export default function MainApp() {
  const { data: session, isLoading } = useAuthControllerGetSession();
  const signOut = useAuthControllerSignOut();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentScreen, setCurrentScreen] = useState<string>('/');
  
  // Map and Routing State
  const [focusedHelpRequestId, setFocusedHelpRequestId] = useState<string | null>(null);
  const [mapFocus, setMapFocus] = useState<{ latitude: number, longitude: number } | null>(null);
  const [mapFocusLabel, setMapFocusLabel] = useState<string | null>(null); // e.g. 'Help Pin' or 'Evacuation site'
  const [mapFocusEvac, setMapFocusEvac] = useState<EvacuationSite | null>(null); // evac site when destination is an evac
  const [showAllPins, setShowAllPins] = useState(true); // Default to true as per request "Multiple help pins can also be enabled"

  // Form location (help request / hazard pin): default from geolocation in HelpDashboard, user can reselect via modal
  const [formLocation, setFormLocation] = useState<{ latitude: number; longitude: number } | null>(null);

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
        <SagipHome
          onOpenMap={() => setCurrentScreen('/map')}
          onOpenChat={() => setCurrentScreen('/assistant')}
          onOpenBlockchain={() => setCurrentScreen('/blockchain')}
        />
      );
      case '/map': return (
        <MapForecast 
          focusedHelpRequestId={focusedHelpRequestId}
          mapFocus={mapFocus}
          mapFocusLabel={mapFocusLabel}
          mapFocusEvac={mapFocusEvac}
          setMapFocus={setMapFocus}
          setMapFocusLabel={setMapFocusLabel}
          setMapFocusEvac={setMapFocusEvac}
          showAllPins={showAllPins}
          onCancelRouting={() => {
            setFocusedHelpRequestId(null);
            setMapFocus(null);
            setMapFocusLabel(null);
            setMapFocusEvac(null);
          }}
          onNavigateToFeature={setCurrentScreen}
        />
      );
      case '/map/flood-simulation':
        return (
          <FloodSimulation onNavigateToMap={() => setCurrentScreen('/map')} />
        );
      case '/map/health-outbreaks':
        return (
          <HealthOutbreaks onNavigateToMap={() => setCurrentScreen('/map')} />
        );
      case '/map/pin-location':
        return (
          <PinLocationScreen
            initialLocation={formLocation}
            onConfirm={(loc) => {
              setFormLocation(loc);
              setCurrentScreen('/map');
            }}
            onBack={() => setCurrentScreen('/map')}
          />
        );
      case '/map/building-vulnerability':
        return (
          <div className="flex flex-col flex-1 items-center justify-center px-6 py-10 bg-wira-ivory wira-batik-bg">
            <p className="text-wira-earth font-body text-center mb-4">Coming soon</p>
            <button
              type="button"
              onClick={() => setCurrentScreen('/map')}
              className="wira-btn-primary max-w-xs"
            >
              Back to Map
            </button>
          </div>
        );
      case '/warnings': return (
        <Warnings
          onViewSafeRoute={(evac) => {
            setMapFocus({ latitude: evac.latitude, longitude: evac.longitude });
            setMapFocusLabel('Evacuation site');
            setMapFocusEvac(evac);
            setCurrentScreen('/map');
          }}
          onOpenMap={() => setCurrentScreen('/map')}
          onReportIncident={() => setCurrentScreen('/help')}
        />
      );
      case '/family': return <Family />;
      case '/assistant': return (
        <LLMAssistant onOpenMap={() => setCurrentScreen('/map')} />
      );
      case '/sos': return (
        <SosPage
          onNavigateToMap={() => setCurrentScreen('/map')}
          onNavigateToRequest={(id, loc) => {
            setFocusedHelpRequestId(id);
            setMapFocus(loc);
            setMapFocusLabel('Help Pin');
            setCurrentScreen('/map');
          }}
          onNavigate={setCurrentScreen}
        />
      );
      case '/help': return (
        <HelpDashboard 
          onNavigateToRequest={(id, loc) => {
            setFocusedHelpRequestId(id);
            setMapFocus(loc);
            setMapFocusLabel('Help Pin');
            setCurrentScreen('/map');
          }}
          showAllPins={showAllPins}
          onToggleShowAllPins={setShowAllPins}
          formLocation={formLocation}
          setFormLocation={setFormLocation}
        />
      );
      case '/profile': return <Profile />;
      case '/blockchain': return (
        <BlockchainPage onBack={() => setCurrentScreen('/')} onNavigate={setCurrentScreen} />
      );
      default:
        return (
          <SagipHome
            onOpenMap={() => setCurrentScreen('/map')}
            onOpenChat={() => setCurrentScreen('/assistant')}
            onOpenBlockchain={() => setCurrentScreen('/blockchain')}
          />
        );
    }
  };

  return (
    <LayoutWrapper
      currentPath={currentScreen}
      onNavigate={setCurrentScreen}
      showNav={!!session?.user}
      onSignOut={() => signOut.mutate()}
    >
      {renderScreen()}
    </LayoutWrapper>
  );
}
