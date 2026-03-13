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
import { Circle as CircleGeom, Point } from 'ol/geom';
import { Feature } from 'ol';
import { Style, Stroke, Fill } from 'ol/style';
import 'ol/ol.css';

export type DrawMode = 'pin' | 'box' | 'polygon';

export interface WarningCoordinatePoint {
  latitude: number;
  longitude: number;
}

interface WarningMapSupportProps {
  drawMode?: DrawMode;
  onTargetChange: (data: {
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
    polygonGeoJson?: string;
    coordinates?: WarningCoordinatePoint[];
  }) => void;
  onDrawModeChange?: (mode: DrawMode) => void;
  radiusKm?: number;
}

function parsePolygonCoordinates(geoJsonStr: string): WarningCoordinatePoint[] {
  try {
    const geometry = JSON.parse(geoJsonStr);
    if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates[0])) {
      const ring = geometry.coordinates[0] as number[][];
      const openRing = ring.slice(0, -1);
      return openRing.map(([longitude, latitude]) => ({ latitude, longitude }));
    }
  } catch (error) {
    console.error('Error parsing box coordinates:', error);
  }
  return [];
}

export default function WarningMapSupport({
  drawMode: controlledDrawMode = 'pin',
  onTargetChange,
  onDrawModeChange,
  radiusKm = 5,
}: WarningMapSupportProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const olMap = useRef<Map | null>(null);
  const vectorSource = useRef(new VectorSource());
  const radiusLayerSource = useRef(new VectorSource());
  const [drawMode, setDrawMode] = useState<DrawMode>(controlledDrawMode);

  useEffect(() => {
    setDrawMode(controlledDrawMode);
  }, [controlledDrawMode]);

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
        new VectorLayer({
          source: radiusLayerSource.current,
          style: new Style({
            stroke: new Stroke({
              color: 'rgba(100, 150, 200, 0.4)',
              width: 2,
              lineDash: [5, 5],
            }),
            fill: new Fill({
              color: 'rgba(100, 150, 200, 0.1)',
            }),
          }),
        }),
      ],
      view: new View({
        center: fromLonLat([115, 5]), // ASEAN-centered view
        zoom: 4,
      }),
    });

    olMap.current = map;

    return () => map.setTarget(undefined);
  }, []);

  useEffect(() => {
    if (drawMode !== 'pin') return;

    const features = vectorSource.current.getFeatures();
    if (features.length === 0) return;

    const pinFeature = features[0];
    const geometry = pinFeature.getGeometry();
    if (!(geometry instanceof Point)) return;

    radiusLayerSource.current.clear();

    const coords = geometry.getCoordinates();
    const radiusCircle = new CircleGeom(coords, radiusKm * 1000);
    const radiusFeature = new Feature(radiusCircle);
    radiusLayerSource.current.addFeature(radiusFeature);
  }, [radiusKm, drawMode]);

  useEffect(() => {
    if (!olMap.current) return;
    const map = olMap.current;

    map.getInteractions().forEach((interaction) => {
      if (interaction instanceof Draw) {
        map.removeInteraction(interaction);
      }
    });

    radiusLayerSource.current.clear();
    vectorSource.current.clear();

    if (drawMode === 'pin') {
      const draw = new Draw({
        source: vectorSource.current,
        type: 'Point',
      });
      const snap = new Snap({ source: vectorSource.current });

      draw.on('drawstart', () => {
        vectorSource.current.clear();
        radiusLayerSource.current.clear();
      });

      draw.on('drawend', (event) => {
        const feature = event.feature;
        const geometry = feature.getGeometry();
        if (!(geometry instanceof Point)) return;

        const coords = toLonLat(geometry.getCoordinates());
        const longitude = coords[0];
        const latitude = coords[1];

        const radiusCircle = new CircleGeom(
          geometry.getCoordinates(),
          radiusKm * 1000,
        );
        const radiusFeature = new Feature(radiusCircle);
        radiusLayerSource.current.addFeature(radiusFeature);

        onTargetChange({
          latitude,
          longitude,
          radiusKm,
        });
      });

      map.addInteraction(draw);
      map.addInteraction(snap);

      return () => {
        map.removeInteraction(draw);
        map.removeInteraction(snap);
      };
    } else if (drawMode === 'box') {
      const draw = new Draw({
        source: vectorSource.current,
        type: 'Circle',
        geometryFunction: createBox(),
      });
      const snap = new Snap({ source: vectorSource.current });

      draw.on('drawstart', () => {
        vectorSource.current.clear();
        radiusLayerSource.current.clear();
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

        const extent = geometry.getExtent();
        const center = toLonLat([
          (extent[0] + extent[2]) / 2,
          (extent[1] + extent[3]) / 2,
        ]);

        onTargetChange({
          latitude: center[1],
          longitude: center[0],
          polygonGeoJson: geoJsonStr,
          coordinates: parsePolygonCoordinates(geoJsonStr),
        });
      });

      map.addInteraction(draw);
      map.addInteraction(snap);

      return () => {
        map.removeInteraction(draw);
        map.removeInteraction(snap);
      };
    } else if (drawMode === 'polygon') {
      const draw = new Draw({
        source: vectorSource.current,
        type: 'Polygon',
      });
      const snap = new Snap({ source: vectorSource.current });

      draw.on('drawstart', () => {
        vectorSource.current.clear();
        radiusLayerSource.current.clear();
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

        const extent = geometry.getExtent();
        const center = toLonLat([
          (extent[0] + extent[2]) / 2,
          (extent[1] + extent[3]) / 2,
        ]);

        onTargetChange({
          latitude: center[1],
          longitude: center[0],
          polygonGeoJson: geoJsonStr,
          coordinates: parsePolygonCoordinates(geoJsonStr),
        });
      });

      map.addInteraction(draw);
      map.addInteraction(snap);

      return () => {
        map.removeInteraction(draw);
        map.removeInteraction(snap);
      };
    }
    return undefined;
  }, [drawMode, radiusKm, onTargetChange]);

  const handleModeChange = (mode: DrawMode) => {
    setDrawMode(mode);
    onDrawModeChange?.(mode);
  };

  return (
    <div className="warning-map-support card" style={{ padding: '0', overflow: 'hidden' }}>
      <div
        className="map-toolbar-row"
        style={{
          padding: '0.5rem',
          background: '#ffffff',
          borderBottom: '1px solid var(--wira-earth-muted)',
        }}
      >
        <button
          type="button"
          className={`btn ${drawMode === 'pin' ? 'btn-warning' : 'btn-neutral'}`}
          onClick={() => handleModeChange('pin')}
        >
          Draw Pin
        </button>
        <button
          type="button"
          className={`btn ${drawMode === 'box' ? 'btn-warning' : 'btn-neutral'}`}
          onClick={() => handleModeChange('box')}
        >
          Draw Box
        </button>
        <button
          type="button"
          className={`btn ${drawMode === 'polygon' ? 'btn-warning' : 'btn-neutral'}`}
          onClick={() => handleModeChange('polygon')}
        >
          Draw Polygon
        </button>
        <button
          className="btn btn-neutral"
          type="button"
          onClick={() => {
            vectorSource.current.clear();
            radiusLayerSource.current.clear();
            handleModeChange('pin');
            onTargetChange({});
          }}
        >
          Clear
        </button>
      </div>
      <div ref={mapRef} style={{ width: '100%', height: '300px' }} />
      <p className="small muted" style={{ padding: '0.5rem' }}>
        {drawMode === 'pin' &&
          'Click on the map to place a pin. The dashed circle shows the warning radius.'}
        {drawMode === 'box' && 'Click and drag to draw a box.'}
        {drawMode === 'polygon' &&
          'Click points to draw a polygon (double-click to finish).'}
      </p>
    </div>
  );
}
