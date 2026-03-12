import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';

const PH_REGIONS_GEOJSON_URL =
  'https://raw.githubusercontent.com/faeldon/philippines-json-maps/master/2019/geojson/regions/lowres/regions.0.001.json';

/** Map GeoJSON region identifiers (ADM1_EN or ADM1ALT1EN, normalized) to risk data region_name. */
const GEOJSON_TO_RISK_ALIAS: Record<string, string> = {
  ARMM: 'BARMM',
  'AUTONOMOUS REGION IN MUSLIM MINDANAO': 'BARMM',
  CAR: 'CAR',
  'CORDILLERA ADMINISTRATIVE REGION': 'CAR',
  NCR: 'NATIONAL CAPITAL REGION',
  'NATIONAL CAPITAL REGION': 'NATIONAL CAPITAL REGION',
  'REGION I': 'REGION I-ILOCOS REGION',
  'ILOCOS REGION': 'REGION I-ILOCOS REGION',
  'REGION II': 'REGION II-CAGAYAN VALLEY',
  'CAGAYAN VALLEY': 'REGION II-CAGAYAN VALLEY',
  'REGION III': 'REGION III-CENTRAL LUZON',
  'CENTRAL LUZON': 'REGION III-CENTRAL LUZON',
  'REGION IV-A': 'REGION IV-A-CALABARZON',
  CALABARZON: 'REGION IV-A-CALABARZON',
  'REGION IV-B': 'REGION IVB-MIMAROPA',
  MIMAROPA: 'REGION IVB-MIMAROPA',
  'REGION V': 'REGION V-BICOL REGION',
  'BICOL REGION': 'REGION V-BICOL REGION',
  'REGION VI': 'REGION VI-WESTERN VISAYAS',
  'WESTERN VISAYAS': 'REGION VI-WESTERN VISAYAS',
  'REGION VII': 'REGION VII-CENTRAL VISAYAS',
  'CENTRAL VISAYAS': 'REGION VII-CENTRAL VISAYAS',
  'REGION VIII': 'REGION VII-EASTERN VISAYAS',
  'EASTERN VISAYAS': 'REGION VII-EASTERN VISAYAS',
  'REGION IX': 'REGION IX-ZAMBOANGA PENINSULA',
  'ZAMBOANGA PENINSULA': 'REGION IX-ZAMBOANGA PENINSULA',
  'REGION X': 'REGION X-NORTHERN MINDANAO',
  'NORTHERN MINDANAO': 'REGION X-NORTHERN MINDANAO',
  'REGION XI': 'REGION XI-DAVAO REGION',
  'DAVAO REGION': 'REGION XI-DAVAO REGION',
  'REGION XII': 'REGION XII-SOCCSKSARGEN',
  SOCCSKSARGEN: 'REGION XII-SOCCSKSARGEN',
  'REGION XIII': 'CARAGA',
  CARAGA: 'CARAGA',
};

interface RiskEntry {
  region_name: string;
  risk_score: number;
}

interface GeoJSONFeature {
  type: string;
  geometry: unknown;
  properties?: Record<string, unknown>;
}

interface GeoJSONInput {
  type: string;
  features: GeoJSONFeature[];
}

export interface DengueRegionFeature {
  type: 'Feature';
  geometry: unknown;
  properties: { risk_score: number; region_name: string; name: string };
}

export interface DengueRegionsGeoJSON {
  type: 'FeatureCollection';
  features: DengueRegionFeature[];
}

function normalizeRegionName(name: string): string {
  return (name ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, '-');
}

@Injectable()
export class HealthOutbreakService implements OnModuleInit {
  private readonly logger = new Logger(HealthOutbreakService.name);
  private regionsGeoJSON: GeoJSONInput | null = null;
  private regionRiskDataPath: string;

  constructor() {
    this.regionRiskDataPath = join(
      process.cwd(),
      'apps/api/data/health-outbreak/region_risk_data.json',
    );
  }

  async onModuleInit(): Promise<void> {
    try {
      const raw = await readFile(this.regionRiskDataPath, 'utf-8');
      const data = JSON.parse(raw) as RiskEntry[];
      if (!Array.isArray(data) || data.length === 0) {
        this.logger.warn('Region risk data is empty or invalid.');
      } else {
        this.logger.log(`Loaded ${data.length} region risk entries.`);
      }
    } catch (err) {
      this.logger.warn(
        `Could not load region risk data from ${this.regionRiskDataPath}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async getRegionsGeoJSON(): Promise<GeoJSONInput> {
    if (this.regionsGeoJSON) return this.regionsGeoJSON;
    const res = await fetch(PH_REGIONS_GEOJSON_URL, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Regions GeoJSON fetch failed: HTTP ${res.status}`);
    const data = (await res.json()) as GeoJSONInput;
    if (!data?.features?.length) throw new Error('Regions GeoJSON has no features');
    this.regionsGeoJSON = data;
    return data;
  }

  private async getRegionRiskData(): Promise<RiskEntry[]> {
    const raw = await readFile(this.regionRiskDataPath, 'utf-8');
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(
      (r): r is RiskEntry =>
        r != null && typeof r === 'object' && typeof (r as RiskEntry).region_name === 'string' && typeof (r as RiskEntry).risk_score === 'number',
    );
  }

  async getDengueRegionsGeoJSON(): Promise<DengueRegionsGeoJSON> {
    const [geojson, riskEntries] = await Promise.all([
      this.getRegionsGeoJSON(),
      this.getRegionRiskData(),
    ]);

    const riskByKey = new Map<string, number>();
    riskEntries.forEach((r) => {
      riskByKey.set(normalizeRegionName(r.region_name), r.risk_score);
    });

    const features: DengueRegionFeature[] = (geojson.features ?? []).map((f) => {
      const props = f.properties ?? {};
      const adm1En = (props.ADM1_EN as string) ?? '';
      const adm1Alt = (props.ADM1ALT1EN as string) ?? '';
      const normalizedEn = normalizeRegionName(adm1En);
      const normalizedAlt = normalizeRegionName(adm1Alt);

      const aliasAlt = normalizedAlt ? GEOJSON_TO_RISK_ALIAS[normalizedAlt] : undefined;
      const aliasEn = normalizedEn ? GEOJSON_TO_RISK_ALIAS[normalizedEn] : undefined;
      const riskRegion = aliasAlt ?? aliasEn;
      const riskScore =
        (riskRegion != null ? riskByKey.get(normalizeRegionName(riskRegion)) : undefined) ??
        riskByKey.get(normalizedAlt) ??
        riskByKey.get(normalizedEn);

      const regionName = adm1En || adm1Alt || '';

      return {
        type: 'Feature' as const,
        geometry: f.geometry,
        properties: {
          risk_score: typeof riskScore === 'number' ? riskScore : 0,
          region_name: regionName,
          name: regionName,
        },
      };
    });

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }
}
