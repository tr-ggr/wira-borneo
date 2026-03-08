import { AxiosResponse } from 'axios';

import { FamilyMember, WarningItem } from '../types/domain';
import { defaultFamilyMembers, defaultWarnings } from './mockData';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

export const readWarningsFromResponse = (
  response: AxiosResponse<unknown> | undefined,
): WarningItem[] => {
  const payload = response?.data;

  if (!isRecord(payload)) {
    return defaultWarnings;
  }

  const warnings = payload['warnings'];
  if (!Array.isArray(warnings)) {
    return defaultWarnings;
  }

  const parsed = warnings
    .map((item, index) => {
      if (!isRecord(item)) {
        return null;
      }

      const level = item['level'];
      const kind = item['kind'];
      if (
        (level !== 'low' && level !== 'medium' && level !== 'high' && level !== 'critical') ||
        (kind !== 'flood' && kind !== 'typhoon' && kind !== 'earthquake')
      ) {
        return null;
      }

      return {
        id: String(item['id'] ?? `warn-${index}`),
        level,
        kind,
        title: String(item['title'] ?? 'Hazard warning'),
        details: String(item['details'] ?? 'Stay alert and monitor updates.'),
        eta: String(item['eta'] ?? 'soon'),
      };
    })
    .filter((item): item is WarningItem => Boolean(item));

  return parsed.length > 0 ? parsed : defaultWarnings;
};

export const readFamilyMapFromResponse = (
  response: AxiosResponse<unknown> | undefined,
): FamilyMember[] => {
  const payload = response?.data;

  if (!isRecord(payload) || !Array.isArray(payload['members'])) {
    return defaultFamilyMembers;
  }

  const members = payload['members'] as unknown[];
  const parsed = members
    .map((member, index) => {
      if (!isRecord(member)) {
        return null;
      }

      const location = member['location'];
      if (!isRecord(location)) {
        return null;
      }

      const latitude = Number(location['latitude']);
      const longitude = Number(location['longitude']);
      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return null;
      }

      return {
        id: String(member['id'] ?? `member-${index}`),
        name: String(member['name'] ?? 'Family Member'),
        status: member['status'] === 'needs-attention' ? 'needs-attention' : 'safe',
        location: { latitude, longitude },
        lastUpdate: String(member['lastUpdate'] ?? 'now'),
      };
    })
    .filter((item): item is FamilyMember => Boolean(item));

  return parsed.length > 0 ? parsed : defaultFamilyMembers;
};
