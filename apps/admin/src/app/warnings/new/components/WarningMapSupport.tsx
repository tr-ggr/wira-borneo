'use client';

import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Draw, Snap } from 'ol/interaction';
import { createBox } from 'ol/interaction/Draw';
import { fromLonLat, toLonLat } from 'ol/proj';
import { useEffect, useRef, useState } from 'react';
import { GeoJSON } from 'ol/format';
import { useI18n } from '../../../../i18n/context';
import 'ol/ol.css';

interface WarningMapSupportProps {
  onTargetChange: (data: {
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
    polygonGeoJson?: string;
  }) => void;
}

export default function WarningMapSupport({ onTargetChange }: WarningMapSupportProps) {
  const { t } = useI18n();
  const mapRef = useRef<HTMLDivElement>(null);
  const olMap = useRef<Map | null>(null);
  const vectorSource = useRef(new VectorSource());
  const [drawMode, setDrawMode] = useState<'none' | 'box' | 'polygon'>('none');

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        new VectorLayer({
          source: vectorSource.current,
        }),
      ],
      view: new View({
        center: fromLonLat([110.3592, 1.5533]), // Default to Kuching/ASEAN region
        zoom: 12,
      }),
    });

    olMap.current = map;

    return () => map.setTarget(undefined);
  }, []);

  useEffect(() => {
    if (!olMap.current) return;
    const map = olMap.current;

    // Remove existing interactions
    map.getInteractions().forEach((interaction) => {
      if (interaction instanceof Draw) {
        map.removeInteraction(interaction);
      }
    });

    if (drawMode === 'none') return;

    let draw: Draw;
    if (drawMode === 'box') {
      draw = new Draw({
        source: vectorSource.current,
        type: 'Circle',
        geometryFunction: createBox(),
      });
    } else {
      draw = new Draw({
        source: vectorSource.current,
        type: 'Polygon',
      });
    }

    draw.on('drawstart', () => {
      vectorSource.current.clear();
    });

    draw.on('drawend', (event) => {
      const feature = event.feature;
      const geometry = feature.getGeometry();
      if (!geometry) return;

      const format = new GeoJSON();
      const geoJsonStr = format.writeGeometry(geometry, {
        featureProjection: 'EPSG:3857',
        dataProjection: 'EPSG:4326',
      });

      // If it's a box or polygon, we primary report the GeoJSON and center for convenience
      const extent = geometry.getExtent();
      const lonLat = toLonLat([(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2]);

      onTargetChange({
        latitude: lonLat[1],
        longitude: lonLat[0],
        polygonGeoJson: geoJsonStr,
      });
    });

    map.addInteraction(draw);
    map.addInteraction(new Snap({ source: vectorSource.current }));

    return () => {
      map.removeInteraction(draw);
    };
  }, [drawMode, onTargetChange]);

  return (
    <div className="warning-map-support card" style={{ padding: '0', overflow: 'hidden' }}>
      <div className="map-toolbar-row" style={{ padding: '0.5rem', background: 'var(--wira-ivory-dark)', borderBottom: '1px solid var(--wira-earth-muted)' }}>
        <button
          className={`btn ${drawMode === 'box' ? 'btn-warning' : 'btn-neutral'}`}
          onClick={() => setDrawMode('box')}
        >
          {t('warnings.map.drawBox')}
        </button>
        <button
          className={`btn ${drawMode === 'polygon' ? 'btn-warning' : 'btn-neutral'}`}
          onClick={() => setDrawMode('polygon')}
        >
          {t('warnings.map.drawPolygon')}
        </button>
        <button
          className="btn btn-neutral"
          onClick={() => {
            vectorSource.current.clear();
            setDrawMode('none');
            onTargetChange({});
          }}
        >
          {t('warnings.map.clear')}
        </button>
      </div>
      <div ref={mapRef} style={{ width: '100%', height: '300px' }} />
      <p className="small muted" style={{ padding: '0.5rem' }}>
        {t('warnings.map.hint')}
      </p>
    </div>
  );
}
