'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import Feature from 'ol/Feature';
import { fromLonLat, toLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Fill, Stroke, Style } from 'ol/style';
import Geolocation from 'ol/Geolocation';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import Icon from 'ol/style/Icon';
import Polygon, { circular } from 'ol/geom/Polygon';
import Overlay from 'ol/Overlay';
import { boundingExtent } from 'ol/extent';

interface RiskRegion {
  id: string;
  latitude: number | null;
  longitude: number | null;
  radiusKm: number | null;
  severity: number;
}

interface HelpRequest {
  id: string;
  latitude: number;
  longitude: number;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  hazardType: string;
}

export interface EvacuationSite {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type?: string | null;
  capacity?: string | null;
  population?: string | null;
  source?: string | null;
}

interface MapComponentProps {
  weatherLocation?: { latitude: number; longitude: number };
  vulnerableRegions?: RiskRegion[];
  helpRequests?: HelpRequest[];
  focusedHelpRequestId?: string | null;
  mapFocus?: { latitude: number; longitude: number } | null;
  homeLocation?: { latitude: number; longitude: number } | null;
  evacuationSites?: EvacuationSite[];
  onEvacClick?: (evac: EvacuationSite) => void;
  /** OSRM route geometry (GeoJSON [lon, lat][]). When set, drawn instead of straight line. */
  routeGeometry?: [number, number][] | null;
  routeEta?: { durationSeconds: number; distanceMeters: number } | null;
  /** When set, map click returns lat/lon for location picker (e.g. hazard pin / help request). */
  onMapClick?: (latitude: number, longitude: number) => void;
}

/** Returns SVG markup for the evac marker based on type so not all look like churches. */
function getEvacIconSvg(type: string | null | undefined): string {
  const t = (type ?? '').toLowerCase();
  const fill = '#0D9488';
  const stroke = 'white';
  switch (t) {
    case 'campus':
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16v12H4V6z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/><path d="M8 10h8M8 14h5" stroke="${stroke}" stroke-width="1.2" stroke-linecap="round"/></svg>`;
    case 'church':
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/><path d="M12 8v8M9 11h6" stroke="${stroke}" stroke-width="1.2" stroke-linecap="round"/></svg>`;
    case 'shelter':
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/><path d="M9 22V12h6v10" fill="${stroke}" opacity="0.5"/></svg>`;
    case 'hospital':
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/><path d="M12 7v10M8 11h8" stroke="${stroke}" stroke-width="1.5" stroke-linecap="round"/></svg>`;
    case 'sports center':
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/><path d="M12 5v14M5 12h14" stroke="${stroke}" stroke-width="1.2"/></svg>`;
    case 'barangay hall':
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4h6v16H4V4zM14 4h6v8h-6V4z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/><path d="M7 8h2M7 11h2M16 6h2" stroke="${stroke}" stroke-width="1"/></svg>`;
    case 'field':
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="12" cy="12" rx="10" ry="8" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/><path d="M12 8v8M8 12h8" stroke="${stroke}" stroke-width="1.2" stroke-linecap="round"/></svg>`;
    default:
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6l-8-4z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/><circle cx="12" cy="11" r="3" fill="${stroke}" opacity="0.9"/></svg>`;
  }
}

export default function MapComponent({ 
  weatherLocation, 
  vulnerableRegions = [],
  helpRequests = [],
  focusedHelpRequestId,
  mapFocus,
  homeLocation,
  evacuationSites = [],
  onEvacClick,
  routeGeometry,
  onMapClick,
}: MapComponentProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const regionsLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const helpLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const homeLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const evacLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const routeLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const userLocationRef = useRef<HTMLDivElement>(null);
  const onEvacClickRef = useRef(onEvacClick);
  onEvacClickRef.current = onEvacClick;
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const [error, setError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<number[] | null>(null);

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;

    // 1. Initialize Base Map
    const initialCoords = weatherLocation 
      ? fromLonLat([weatherLocation.longitude, weatherLocation.latitude]) 
      : fromLonLat([110.3592, 1.5533]); // Default to Kuching

    const view = new View({
      center: initialCoords,
      zoom: 12,
    });

    const map = new Map({
      target: mapElement.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: view,
    });
    mapRef.current = map;

    // 2. Setup Location Overlay (Current User Position)
    const locationOverlay = new Overlay({
      element: userLocationRef.current!,
      positioning: 'bottom-center',
      stopEvent: false,
    });
    map.addOverlay(locationOverlay);

    // 3. Setup Geolocation
    const geolocation = new Geolocation({
      trackingOptions: {
        enableHighAccuracy: true,
      },
      projection: view.getProjection(),
    });

    geolocation.on('change:position', () => {
      const coordinates = geolocation.getPosition();
      if (coordinates) {
        setUserCoords(coordinates);
        locationOverlay.setPosition(coordinates);
        // Only auto-animate if NOT focused on something specific
        if (!mapFocus) {
          view.animate({ center: coordinates, zoom: 14 });
        }
      }
    });

    geolocation.on('error', (error) => {
      console.warn('Geolocation error:', error.message);
      setError('Could not access device location. Using standard map view.');
    });
    
    // Auto-start tracking explicitly asking for permission first
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Once permission is granted and position found, enable tracking on the map
          const coords = fromLonLat([pos.coords.longitude, pos.coords.latitude]);
          setUserCoords(coords);
          locationOverlay.setPosition(coords);
          view.animate({ center: coords, zoom: 14 });
          geolocation.setTracking(true);
        },
        (err) => {
          console.warn('Geolocation prompt error:', err.message);
          setError('Location access denied or unavailable. Using standard view.');
        },
        { enableHighAccuracy: true }
      );
    } else {
        setError("Geolocation is not supported by this browser.");
    }

    // 4. Setup Regions Layer
    const regionsSource = new VectorSource();
    const regionsLayer = new VectorLayer({
      source: regionsSource,
      zIndex: 5,
    });
    map.addLayer(regionsLayer);
    regionsLayerRef.current = regionsLayer;

    // 5. Setup Help Requests Layer
    const helpSource = new VectorSource();
    const helpLayer = new VectorLayer({
      source: helpSource,
      zIndex: 10,
    });
    map.addLayer(helpLayer);
    helpLayerRef.current = helpLayer;

    // 6. Setup Home Layer
    const homeSource = new VectorSource();
    const homeLayer = new VectorLayer({
      source: homeSource,
      zIndex: 9,
    });
    map.addLayer(homeLayer);
    homeLayerRef.current = homeLayer;

    // 7. Setup Evacuation Sites Layer
    const evacSource = new VectorSource();
    const evacLayer = new VectorLayer({
      source: evacSource,
      zIndex: 7,
    });
    map.addLayer(evacLayer);
    evacLayerRef.current = evacLayer;

    map.on('click', (evt) => {
      if (onMapClickRef.current) {
        const coord = map.getCoordinateFromPixel(evt.pixel);
        if (coord) {
          const [lon, lat] = toLonLat(coord);
          onMapClickRef.current(lat, lon);
        }
        return;
      }
      const hit = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
      const evac = hit?.get('evac') as EvacuationSite | undefined;
      if (evac && onEvacClickRef.current) onEvacClickRef.current(evac);
    });

    // 8. Setup Route Layer
    const routeSource = new VectorSource();
    const routeLayer = new VectorLayer({
      source: routeSource,
      zIndex: 8,
      style: [
        new Style({
          stroke: new Stroke({
            color: 'rgba(250, 204, 21, 0.4)', // bright yellow glow
            width: 12,
          }),
        }),
        new Style({
          stroke: new Stroke({
            color: '#FDE047', // bright solid yellow
            width: 4,
            lineDash: [6, 6],
          }),
        })
      ],
    });
    map.addLayer(routeLayer);
    routeLayerRef.current = routeLayer;

    return () => {
      geolocation.setTracking(false);
      map.setTarget(undefined);
      mapRef.current = null;
    };
  }, [weatherLocation]);

  // Update Regions Layer when data changes
  useEffect(() => {
    if (!regionsLayerRef.current || !vulnerableRegions.length) return;

    const source = regionsLayerRef.current.getSource();
    if (!source) return;

    source.clear();

    const features = vulnerableRegions.map(region => {
      if (!region.latitude || !region.longitude || !region.radiusKm) return null;

      // Create circular polygon for the risk area
      const circlePolygon = circular(
        [region.longitude, region.latitude],
        region.radiusKm * 1000, 
        64 
      ).transform('EPSG:4326', 'EPSG:3857');

      const feature = new Feature({
          geometry: circlePolygon
      });

      // Style based on severity
      const getFillColor = (severity: number) => {
          if (severity > 80) return 'rgba(220, 38, 38, 0.4)'; // Red (Critical)
          if (severity > 50) return 'rgba(234, 179, 8, 0.4)'; // Yellow (Warning)
          return 'rgba(56, 189, 248, 0.4)'; // Blue (Informational)
      };

      feature.setStyle(
        new Style({
          fill: new Fill({ color: getFillColor(region.severity) }),
          stroke: new Stroke({ color: getFillColor(region.severity).replace('0.4', '0.8'), width: 2 })
        })
      );

      return feature;
    }).filter(Boolean) as Feature<Polygon>[];

    source.addFeatures(features);
  }, [vulnerableRegions]);

  // Update Help Requests Layer
  useEffect(() => {
    if (!helpLayerRef.current) return;
    const source = helpLayerRef.current.getSource();
    if (!source) return;

    source.clear();

    const features = helpRequests.map(req => {
      const isFocused = req.id === focusedHelpRequestId;
      const point = new Point(fromLonLat([req.longitude, req.latitude]));
      const feature = new Feature({
        geometry: point,
      });

      const color = req.urgency === 'CRITICAL' ? '#DC2626' : '#EAB308';
      
      feature.setStyle(new Style({
        image: new Icon({
          src: `data:image/svg+xml;utf8,${encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 30L16 30C12 26 6 18 6 12C6 6.47715 10.4772 2 16 2C21.5228 2 26 6.47715 26 12C26 18 20 26 16 30Z" fill="${color}" stroke="white" stroke-width="2"/>
              <circle cx="16" cy="12" r="4" fill="white"/>
              ${isFocused ? '<circle cx="16" cy="12" r="8" stroke="white" stroke-width="2" opacity="0.5"><animate attributeName="r" from="8" to="16" dur="1.5s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" /></circle>' : ''}
            </svg>
          `)}`,
          scale: isFocused ? 1.2 : 1,
          anchor: [0.5, 1],
        })
      }));

      return feature;
    });

    source.addFeatures(features);
  }, [helpRequests, focusedHelpRequestId]);

  // Update Home marker
  useEffect(() => {
    if (!homeLayerRef.current || !homeLocation) return;
    const source = homeLayerRef.current.getSource();
    if (!source) return;
    source.clear();
    const point = new Point(fromLonLat([homeLocation.longitude, homeLocation.latitude]));
    const feature = new Feature({ geometry: point });
    feature.setStyle(new Style({
      image: new Icon({
        src: `data:image/svg+xml;utf8,${encodeURIComponent(`
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" fill="#0D9488" stroke="white" stroke-width="2"/>
            <polygon points="9 22 9 12 15 12 15 22" fill="white" opacity="0.9"/>
          </svg>
        `)}`,
        scale: 1,
        anchor: [0.5, 1],
      })
    }));
    source.addFeature(feature);
  }, [homeLocation]);

  // Update Evacuation Sites layer (icon per type so not all look like churches)
  useEffect(() => {
    if (!evacLayerRef.current) return;
    const source = evacLayerRef.current.getSource();
    if (!source) return;
    source.clear();
    if (!evacuationSites.length) return;
    const features = evacuationSites.map((evac) => {
      const point = new Point(fromLonLat([evac.longitude, evac.latitude]));
      const feature = new Feature({ geometry: point });
      feature.set('evac', evac);
      const svg = getEvacIconSvg(evac.type);
      feature.setStyle(new Style({
        image: new Icon({
          src: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
          scale: 1,
          anchor: [0.5, 1],
        })
      }));
      return feature;
    });
    source.addFeatures(features);
  }, [evacuationSites]);

  // Update Route / Navigation Path (OSRM road route or straight line)
  useEffect(() => {
    if (!routeLayerRef.current || !mapRef.current) return;
    const source = routeLayerRef.current.getSource();
    if (!source) return;

    source.clear();

    if (!mapFocus) return;

    const targetCoords = fromLonLat([mapFocus.longitude, mapFocus.latitude]);
    let routeCoords: number[][];

    if (routeGeometry && routeGeometry.length >= 2) {
      routeCoords = routeGeometry.map(([lon, lat]) => fromLonLat([lon, lat]));
    } else if (userCoords) {
      routeCoords = [userCoords, targetCoords];
    } else {
      return;
    }

    const line = new Feature({
      geometry: new LineString(routeCoords),
    });
    source.addFeature(line);

    const pin = new Feature({
      geometry: new Point(targetCoords),
    });
    pin.setStyle(new Style({
      image: new Icon({
        src: `data:image/svg+xml;utf8,${encodeURIComponent(`
          <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 30L16 30C12 26 6 18 6 12C6 6.47715 10.4772 2 16 2C21.5228 2 26 6.47715 26 12C26 18 20 26 16 30Z" fill="#FACC15" stroke="white" stroke-width="2"/>
            <circle cx="16" cy="12" r="4" fill="white"/>
          </svg>
        `)}`,
        anchor: [0.5, 1],
      })
    }));
    source.addFeature(pin);

    const extent = boundingExtent(routeCoords);
    mapRef.current.getView().fit(extent, {
      padding: [120, 80, 250, 80],
      duration: 1000,
      maxZoom: 16,
    });
  }, [mapFocus, userCoords, routeGeometry]);

  return (
    <div className="relative w-full aspect-square rounded-3xl overflow-hidden shadow-wira border border-wira-teal/30">
        <div ref={mapElement} className="w-full h-full" />
        
        {/* 3D Person Pin Overlay */}
        <div ref={userLocationRef} className={`absolute pointer-events-none ${!userCoords ? 'hidden' : ''}`}>
          <div className="relative flex items-center justify-center -translate-y-4">
            {/* Ping effect */}
            <div className="absolute w-12 h-12 bg-wira-gold/40 rounded-full animate-ping"></div>
            {/* 3D pin wrapper */}
            <div className="relative z-10 flex flex-col items-center drop-shadow-lg">
              {/* Head */}
              <div className="w-4 h-4 rounded-full bg-wira-gold border-2 border-white shadow-md z-20"></div>
              {/* Body */}
              <div className="w-5 h-6 bg-wira-gold rounded-t-[10px] border-2 border-white shadow-md z-10 -mt-1"></div>
              {/* Shadow */}
              <div className="w-4 h-1.5 bg-black/40 rounded-full blur-[2px] mt-1 relative z-0"></div>
            </div>
          </div>
        </div>

        {error && (
            <div className="absolute top-2 left-2 right-2 bg-red-500/90 text-white text-xs p-2 rounded-lg backdrop-blur-sm shadow-lg border border-red-400">
                {error}
            </div>
        )}
    </div>
  );
}
