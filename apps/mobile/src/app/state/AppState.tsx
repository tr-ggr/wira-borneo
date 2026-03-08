import { PropsWithChildren, createContext, useContext, useMemo, useState } from 'react';

import { defaultEvacuationAreas, defaultFamilyMembers, defaultWarnings, starterMessages } from '../utils/mockData';
import { EvacuationArea, FamilyMember, Message, SessionProfile, WarningItem } from '../types/domain';

interface AppStateValue {
  profile: SessionProfile;
  familyMembers: FamilyMember[];
  evacuationAreas: EvacuationArea[];
  warnings: WarningItem[];
  messages: Message[];
  setLoggedIn: (value: boolean) => void;
  setVolunteer: (value: boolean) => void;
  setFamilyCode: (value: string) => void;
  setDisplayName: (value: string) => void;
  addEvacuationArea: (area: EvacuationArea) => void;
  addMessage: (message: Message) => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

const initialProfile: SessionProfile = {
  displayName: 'Local Resident',
  location: { latitude: 14.6091, longitude: 121.0223 },
  isLoggedIn: false,
  isVolunteer: false,
  familyCode: 'TEAM-AGILA',
};

export const AppStateProvider = ({ children }: PropsWithChildren) => {
  const [profile, setProfile] = useState<SessionProfile>(initialProfile);
  const [familyMembers] = useState(defaultFamilyMembers);
  const [evacuationAreas, setEvacuationAreas] = useState(defaultEvacuationAreas);
  const [warnings] = useState(defaultWarnings);
  const [messages, setMessages] = useState(starterMessages);

  const value = useMemo<AppStateValue>(
    () => ({
      profile,
      familyMembers,
      evacuationAreas,
      warnings,
      messages,
      setLoggedIn: (value) => setProfile((prev) => ({ ...prev, isLoggedIn: value })),
      setVolunteer: (value) => setProfile((prev) => ({ ...prev, isVolunteer: value })),
      setFamilyCode: (value) => setProfile((prev) => ({ ...prev, familyCode: value })),
      setDisplayName: (value) => setProfile((prev) => ({ ...prev, displayName: value })),
      addEvacuationArea: (area) => setEvacuationAreas((prev) => [area, ...prev]),
      addMessage: (message) => setMessages((prev) => [message, ...prev]),
    }),
    [profile, familyMembers, evacuationAreas, warnings, messages],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }

  return context;
};
