import { EvacuationArea, FamilyMember, Message, WarningItem } from '../types/domain';

export const defaultFamilyMembers: FamilyMember[] = [
  {
    id: 'fam-1',
    name: 'Mara Dela Cruz',
    status: 'safe',
    location: { latitude: 14.6091, longitude: 121.0223 },
    lastUpdate: '5m ago',
  },
  {
    id: 'fam-2',
    name: 'Paolo Dela Cruz',
    status: 'needs-attention',
    location: { latitude: 14.6203, longitude: 121.0354 },
    lastUpdate: '2m ago',
  },
];

export const defaultEvacuationAreas: EvacuationArea[] = [
  {
    id: 'evac-1',
    name: 'Barangay Hall Gym',
    location: { latitude: 14.6131, longitude: 121.0277 },
    capacityLabel: '120 people',
  },
  {
    id: 'evac-2',
    name: 'City Sports Center',
    location: { latitude: 14.6178, longitude: 121.0208 },
    capacityLabel: '300 people',
  },
];

export const defaultWarnings: WarningItem[] = [
  {
    id: 'warn-1',
    kind: 'typhoon',
    level: 'critical',
    title: 'Typhoon path moving toward your district',
    details: 'Strong winds expected in 3 hours with intense rainfall.',
    eta: '3h',
  },
  {
    id: 'warn-2',
    kind: 'flood',
    level: 'high',
    title: 'Rising river levels near low-lying roads',
    details: 'Flood depth may reach knee level in vulnerable streets.',
    eta: '1h',
  },
];

export const starterMessages: Message[] = [
  {
    id: 'msg-1',
    role: 'assistant',
    content:
      'Ask me anything about flood prep, typhoon safety, aftershocks, and family checklists.',
    timestamp: 'now',
  },
];
