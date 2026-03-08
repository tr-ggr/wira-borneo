'use client';

import {
  useAdminOperationsControllerPinStatuses,
  useAdminOperationsControllerVulnerableRegions,
} from '@wira-borneo/api-client';
import Feature from 'ol/Feature';
import Map from 'ol/Map';
import View from 'ol/View';
import { Point, Polygon } from 'ol/geom';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { useEffect, useMemo, useRef, useState } from 'react';
import 'ol/ol.css';
import { filterPinStatuses, filterRiskLayers } from './map-filters.utils';

interface RegionRisk {
  id: string;
  hazardType: 'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK';
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  latitude?: number | null;
  longitude?: number | null;
  radiusKm?: number | null;
}

interface PinStatus {
  id: string;
  title: string;
  hazardType: 'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'BLOCKED';
  latitude: number;
  longitude: number;
  region?: string | null;
  note?: string | null;
  updatedAt?: string;
}

function toRisks(raw: unknown): RegionRisk[] {
  return Array.isArray(raw) ? (raw as RegionRisk[]) : [];
}

function toPins(raw: unknown): PinStatus[] {
  return Array.isArray(raw) ? (raw as PinStatus[]) : [];
}

function ringPolygon(lon: number, lat: number, radiusKm: number): Polygon {
  const points: number[][] = [];
  const earthRadiusKm = 6371;
  for (let i = 0; i <= 64; i += 1) {
    const angle = (i / 64) * (Math.PI * 2);
    const latOffset = (radiusKm / earthRadiusKm) * (180 / Math.PI) * Math.sin(angle);
    const lonOffset =
      ((radiusKm / earthRadiusKm) * (180 / Math.PI) * Math.cos(angle)) /
      Math.cos((lat * Math.PI) / 180);
    points.push(fromLonLat([lon + lonOffset, lat + latOffset]));
  }
  return new Polygon([points]);
}

export function OperationsMapPage() {
  const mapTargetRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const hazardSourceRef = useRef(new VectorSource());
  const pinSourceRef = useRef(new VectorSource());

  const [hazardFilter, setHazardFilter] = useState<Record<string, boolean>>({
    TYPHOON: true,
    FLOOD: true,
    AFTERSHOCK: true,
    EARTHQUAKE: false,
  });
  const [pinStatusFilter, setPinStatusFilter] = useState<Record<string, boolean>>({
    OPEN: true,
    IN_PROGRESS: true,
    BLOCKED: true,
    RESOLVED: false,
  });
  const [selectedPin, setSelectedPin] = useState<PinStatus | null>(null);

  const riskQuery = useAdminOperationsControllerVulnerableRegions({
    query: { select: (response) => toRisks(response.data) },
  });
  const pinsQuery = useAdminOperationsControllerPinStatuses({
    query: { select: (response) => toPins(response.data) },
  });

  const filteredRisks = useMemo(
    () => filterRiskLayers(riskQuery.data ?? [], hazardFilter),
    [riskQuery.data, hazardFilter],
  );
  const filteredPins = useMemo(
    () => filterPinStatuses(pinsQuery.data ?? [], pinStatusFilter),
    [pinsQuery.data, pinStatusFilter],
  );

  useEffect(() => {
    if (!mapTargetRef.current || mapRef.current) {
      return;
    }

    const hazardLayer = new VectorLayer({ source: hazardSourceRef.current });
    const pinLayer = new VectorLayer({ source: pinSourceRef.current });

    mapRef.current = new Map({
      target: mapTargetRef.current,
      layers: [new TileLayer({ source: new OSM() }), hazardLayer, pinLayer],
      view: new View({
        center: fromLonLat([110.3592, 1.5533]),
        zoom: 6,
      }),
    });

    mapRef.current.on('singleclick', (event) => {
      const found = mapRef.current
        ?.getFeaturesAtPixel(event.pixel)
        .find((feature) => feature.get('featureType') === 'pin');

      if (found) {
        const pinId = String(found.get('pinId'));
        const pin = filteredPins.find((item) => item.id === pinId) ?? null;
        setSelectedPin(pin);
      }
    });

    return () => {
      mapRef.current?.setTarget(undefined);
      mapRef.current = null;
    };
  }, [filteredPins]);

  useEffect(() => {
    const hazardSource = hazardSourceRef.current;
    hazardSource.clear();

    filteredRisks.forEach((risk) => {
      if (!risk.latitude || !risk.longitude || !risk.radiusKm) {
        return;
      }

      const feature = new Feature({
        geometry: ringPolygon(risk.longitude, risk.latitude, risk.radiusKm),
        featureType: 'hazard',
      });
      feature.setStyle(
        new Style({
          stroke: new Stroke({ color: '#1B5FA8', width: 2 }),
          fill: new Fill({ color: 'rgba(27, 95, 168, 0.2)' }),
        }),
      );
      hazardSource.addFeature(feature);
    });
  }, [filteredRisks]);

  useEffect(() => {
    const pinSource = pinSourceRef.current;
    pinSource.clear();

    filteredPins.forEach((pin) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([pin.longitude, pin.latitude])),
        featureType: 'pin',
        pinId: pin.id,
      });
      feature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 8,
            fill: new Fill({ color: pin.status === 'BLOCKED' ? '#D72B2B' : '#2E7D32' }),
            stroke: new Stroke({ color: '#F5F0E8', width: 2 }),
          }),
        }),
      );
      pinSource.addFeature(feature);
    });
  }, [filteredPins]);

  return (
    <section className="page-shell">
      <header className="section-header">
        <p className="eyebrow">OpenLayers Operations Map</p>
        <h1 className="title">Hazard & Pin Monitoring / Pemantauan Peta</h1>
        <p className="subtitle">Toggle hazard layers and inspect map pin statuses.</p>
      </header>

      <div className="map-layout">
        <aside className="card sidebar">
          <h2 className="card-title">Hazard Layers</h2>
          {Object.keys(hazardFilter).map((key) => (
            <label className="checkbox-row" key={key}>
              <input
                type="checkbox"
                checked={hazardFilter[key]}
                onChange={(event) =>
                  setHazardFilter((current) => ({ ...current, [key]: event.target.checked }))
                }
              />
              <span>{key}</span>
            </label>
          ))}

          <h2 className="card-title">Pin Status Filters</h2>
          {Object.keys(pinStatusFilter).map((key) => (
            <label className="checkbox-row" key={key}>
              <input
                type="checkbox"
                checked={pinStatusFilter[key]}
                onChange={(event) =>
                  setPinStatusFilter((current) => ({ ...current, [key]: event.target.checked }))
                }
              />
              <span>{key}</span>
            </label>
          ))}
        </aside>

        <div className="card map-card">
          <div ref={mapTargetRef} className="map-canvas" />
        </div>

        <aside className="card sidebar">
          <h2 className="card-title">Pin Details</h2>
          {selectedPin ? (
            <dl className="summary-grid">
              <dt>Title</dt>
              <dd>{selectedPin.title}</dd>
              <dt>Status</dt>
              <dd>{selectedPin.status}</dd>
              <dt>Region</dt>
              <dd>{selectedPin.region ?? 'Unknown'}</dd>
              <dt>Hazard</dt>
              <dd>{selectedPin.hazardType}</dd>
              <dt>Updated</dt>
              <dd>{selectedPin.updatedAt ?? 'N/A'}</dd>
            </dl>
          ) : (
            <p className="muted">Select a pin on the map to inspect details.</p>
          )}
        </aside>
      </div>
    </section>
  );
}
