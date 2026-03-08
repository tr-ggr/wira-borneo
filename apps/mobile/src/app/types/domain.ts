export type AppTab = 'map' | 'warnings' | 'llm' | 'profile' | 'help';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  status: 'safe' | 'needs-attention';
  location: GeoPoint;
  lastUpdate: string;
}

export interface EvacuationArea {
  id: string;
  name: string;
  location: GeoPoint;
  capacityLabel: string;
}

export interface WarningItem {
  id: string;
  kind: 'flood' | 'typhoon' | 'earthquake';
  level: RiskLevel;
  title: string;
  details: string;
  eta: string;
}

export interface RouteStep {
  id: string;
  instruction: string;
  distanceKm: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface HelpRequestDraft {
  title: string;
  details: string;
}

export interface SessionProfile {
  displayName: string;
  location: GeoPoint;
  isLoggedIn: boolean;
  isVolunteer: boolean;
  familyCode: string;
}
