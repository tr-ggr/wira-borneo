'use client';

import {
  useAdminOperationsControllerMapOverview,
  useAdminOperationsControllerReviewPin,
  useAdminOperationsControllerWeatherForecast,
  useAdminOperationsControllerWeatherGeocoding,
  useRiskIntelligenceControllerGetFullDetail,
} from '@wira-borneo/api-client';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay';
import View from 'ol/View';
import { boundingExtent, createEmpty, extend as extendExtent, isEmpty } from 'ol/extent';
import { Point, Polygon } from 'ol/geom';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { transformExtent, fromLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import {
  DoubleClickZoom,
  MouseWheelZoom,
  PinchZoom,
  KeyboardZoom,
  DragZoom,
} from 'ol/interaction';
import { Zoom } from 'ol/control';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import 'ol/ol.css';
import {
  filterPinStatuses,
  filterRiskLayers,
  filterUserLocations,
  filterHelpRequests,
  isLocationStale,
} from './map-filters.utils';

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
  status: 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED';
  latitude: number;
  longitude: number;
  region?: string | null;
  note?: string | null;
  photoUrl?: string | null;
  reporter?: { name: string } | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  reviewStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  updatedAt?: string;
}

interface UserLocation {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  region?: string | null;
  updatedAt?: string;
}

interface UserHelpRequest {
  id: string;
  requesterId: string;
  hazardType: 'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'CLAIMED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
  description: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  requester: { name: string };
}

interface MapOverviewPayload {
  vulnerableRegions: RegionRisk[];
  pinStatuses: PinStatus[];
  userLocations: UserLocation[];
  helpRequests: UserHelpRequest[];
}

interface GeocodingResult {
  name?: string;
  country_code?: string;
  latitude: number;
  longitude: number;
}

interface ForecastPayload {
  current_weather?: Record<string, number | string | null>;
  daily?: Record<string, Array<number | string | null>>;
  daily_units?: Record<string, string>;
}

const ASEAN_EXTENT_LON_LAT: [number, number, number, number] = [92.0, -11.6, 141.5, 28.8];
const ASEAN_CENTER_LON_LAT: [number, number] = [116.2, 4.7];

const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  brn: [114.9481, 4.5353],
  idn: [106.8456, -6.2088],
  mys: [101.6869, 3.1390],
  phl: [120.9842, 14.5995],
  sgp: [103.8198, 1.3521],
};

function toRisks(raw: unknown): RegionRisk[] {
  return Array.isArray(raw) ? (raw as RegionRisk[]) : [];
}

function toPins(raw: unknown): PinStatus[] {
  return Array.isArray(raw) ? (raw as PinStatus[]) : [];
}

function toUsers(raw: unknown): UserLocation[] {
  return Array.isArray(raw) ? (raw as UserLocation[]) : [];
}

function toHelpRequests(raw: unknown): UserHelpRequest[] {
  return Array.isArray(raw) ? (raw as UserHelpRequest[]) : [];
}

function toMapOverview(raw: unknown): MapOverviewPayload {
  if (!raw || typeof raw !== 'object') {
    return {
      vulnerableRegions: [],
      pinStatuses: [],
      userLocations: [],
      helpRequests: [],
    };
  }

  const input = raw as Record<string, unknown>;
  return {
    vulnerableRegions: toRisks(input.vulnerableRegions),
    pinStatuses: toPins(input.pinStatuses),
    userLocations: toUsers(input.userLocations),
    helpRequests: toHelpRequests(input.helpRequests),
  };
}

function toGeocodingResults(raw: unknown): GeocodingResult[] {
  if (!raw || typeof raw !== 'object') {
    return [];
  }

  const response = raw as { results?: unknown };
  return Array.isArray(response.results) ? (response.results as GeocodingResult[]) : [];
}

function toForecast(raw: unknown): ForecastPayload | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  return raw as ForecastPayload;
}

function toAseanExtentProjection() {
  const [minLon, minLat, maxLon, maxLat] = ASEAN_EXTENT_LON_LAT;
  return boundingExtent([
    fromLonLat([minLon, minLat]),
    fromLonLat([minLon, maxLat]),
    fromLonLat([maxLon, minLat]),
    fromLonLat([maxLon, maxLat]),
  ]);
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

function fmt(value: number | string | null | undefined, digits = 1): string {
  if (value == null) {
    return 'N/A';
  }

  if (typeof value === 'number') {
    return value.toFixed(digits);
  }

  return String(value);
}

function getVulnerabilityColor(score: number): string {
  // 0 is green, higher is redder. Let's assume 0-10 range for coloring.
  if (score <= 0) return '#2E7D32'; // Green
  if (score < 2) return '#4CAF50';  // Light Green
  if (score < 4) return '#FFEB3B';  // Yellow
  if (score < 7) return '#FF9800';  // Orange
  if (score < 10) return '#F44336'; // Red
  return '#B71C1C'; // Dark Red
}

export function OperationsMapPage() {
  const mapTargetRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const mapViewRef = useRef<View | null>(null);
  const hazardSourceRef = useRef(new VectorSource());
  const pinSourceRef = useRef(new VectorSource());
  const userSourceRef = useRef(new VectorSource());
  const helpSourceRef = useRef(new VectorSource());
  const clusteringSourceRef = useRef(new VectorSource());
  const aseanExtentRef = useRef(toAseanExtentProjection());
  const filteredPinsRef = useRef<PinStatus[]>([]);
  const filteredUsersRef = useRef<UserLocation[]>([]);
  const filteredHelpRequestsRef = useRef<UserHelpRequest[]>([]);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<Overlay | null>(null);

  const [hoveredBuilding, setHoveredBuilding] = useState<Record<string, any> | null>(null);

  const [hazardFilter, setHazardFilter] = useState<Record<string, boolean>>({
    TYPHOON: true,
    FLOOD: true,
    AFTERSHOCK: true,
    EARTHQUAKE: false,
  });
  const [pinStatusFilter, setPinStatusFilter] = useState<Record<string, boolean>>({
    OPEN: true,
    ACKNOWLEDGED: true,
    IN_PROGRESS: true,
    RESOLVED: false,
  });
  const [userFilter, setUserFilter] = useState<Record<string, boolean>>({
    RECENT: true,
    STALE: true,
  });
  const [urgencyFilter] = useState<Record<string, boolean>>({
    LOW: true,
    MEDIUM: true,
    HIGH: true,
    CRITICAL: true,
  });
  const [selectedPin, setSelectedPin] = useState<PinStatus | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserLocation | null>(null);
  const [selectedHelpRequest, setSelectedHelpRequest] = useState<UserHelpRequest | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [geocodeQuery, setGeocodeQuery] = useState<string | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [viewBuildingProfiles, setViewBuildingProfiles] = useState(false);
  const [pinReviewReason, setPinReviewReason] = useState('');
  const [buildingProfilingBBox, setBuildingProfilingBBox] = useState<string>('92.0,-11.6,141.5,28.8');
  const [buildingProfilingCountry, setBuildingProfilingCountry] = useState('idn');

  const overviewQuery = useAdminOperationsControllerMapOverview({
    query: {
      select: (response) => toMapOverview(response?.data ?? response),
    },
  });

  const reviewPinMutation = useAdminOperationsControllerReviewPin({
    mutation: {
      onSuccess: () => {
        overviewQuery.refetch();
        setSelectedPin(null);
        setPinReviewReason('');
      },
    },
  });

  const weatherQuery = useAdminOperationsControllerWeatherForecast(
    {
      latitude: selectedCoords?.[1] ?? 0,
      longitude: selectedCoords?.[0] ?? 0,
      current_weather: true,
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
      forecast_days: 3,
      timezone: 'auto',
    },
    {
      query: {
        enabled: Boolean(selectedCoords),
        select: (response) => toForecast(response),
      },
    },
  );

  const geocodingQuery = useAdminOperationsControllerWeatherGeocoding(
    {
      name: geocodeQuery ?? '',
      count: 5,
      format: 'json',
    },
    {
      query: {
        enabled: Boolean(geocodeQuery),
        select: (response) => toGeocodingResults(response),
      },
    },
  );

  const buildingProfilesQuery = useRiskIntelligenceControllerGetFullDetail(
    buildingProfilingCountry,
    { bbox: buildingProfilingBBox },
    {
      query: {
        enabled: viewBuildingProfiles,
      },
    },
  );

  const risks = overviewQuery.data?.vulnerableRegions ?? [];
  const pins = overviewQuery.data?.pinStatuses ?? [];
  const users = overviewQuery.data?.userLocations ?? [];
  const helpRequests = overviewQuery.data?.helpRequests ?? [];

  const filteredRisks = useMemo(
    () => filterRiskLayers(risks, hazardFilter),
    [risks, hazardFilter],
  );

  const filteredPins = useMemo(
    () => filterPinStatuses(pins, pinStatusFilter),
    [pins, pinStatusFilter],
  );

  const filteredUsers = useMemo(
    () => filterUserLocations(users, userFilter),
    [users, userFilter],
  );

  const filteredHelpRequests = useMemo(
    () => filterHelpRequests(helpRequests, hazardFilter, urgencyFilter),
    [helpRequests, hazardFilter, urgencyFilter],
  );

  const geocodingResults = geocodingQuery.data ?? [];

  useEffect(() => {
    filteredPinsRef.current = filteredPins;
  }, [filteredPins]);

  useEffect(() => {
    filteredUsersRef.current = filteredUsers;
  }, [filteredUsers]);

  useEffect(() => {
    filteredHelpRequestsRef.current = filteredHelpRequests;
  }, [filteredHelpRequests]);

  const weatherSummary = useMemo(() => {
    const payload = weatherQuery.data;
    if (!payload) {
      return null;
    }

    const current = payload.current_weather ?? {};
    const daily = payload.daily ?? {};
    const units = payload.daily_units ?? {};

    return {
      temperature: current.temperature,
      windSpeed: current.windspeed,
      weatherCode: current.weathercode,
      maxTemp: Array.isArray(daily.temperature_2m_max) ? daily.temperature_2m_max[0] : null,
      minTemp: Array.isArray(daily.temperature_2m_min) ? daily.temperature_2m_min[0] : null,
      precipitation: Array.isArray(daily.precipitation_sum) ? daily.precipitation_sum[0] : null,
      tempUnit: units.temperature_2m_max ?? 'C',
      precipitationUnit: units.precipitation_sum ?? 'mm',
    };
  }, [weatherQuery.data]);

  function refocusAsean() {
    const view = mapViewRef.current;
    if (!view) {
      return;
    }

    view.fit(aseanExtentRef.current, {
      duration: 420,
      maxZoom: 6,
      padding: [40, 40, 40, 40],
    });
  }

  function fitToData() {
    const view = mapViewRef.current;
    if (!view) {
      return;
    }

    const extent = createEmpty();
    const points: Array<[number, number]> = [];

    filteredRisks.forEach((risk) => {
      if (risk.latitude != null && risk.longitude != null) {
        points.push([risk.longitude, risk.latitude]);
      }
    });

    filteredPins.forEach((pin) => {
      points.push([pin.longitude, pin.latitude]);
    });

    filteredUsers.forEach((user) => {
      points.push([user.longitude, user.latitude]);
    });

    filteredHelpRequests.forEach((req) => {
      points.push([req.longitude, req.latitude]);
    });

    if (points.length === 0) {
      refocusAsean();
      return;
    }

    const projected = points.map((point) => fromLonLat(point));
    extendExtent(extent, boundingExtent(projected));

    if (isEmpty(extent)) {
      refocusAsean();
      return;
    }

    view.fit(extent, {
      duration: 420,
      maxZoom: 9,
      padding: [80, 80, 80, 80],
    });
  }

  function onSearchLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = searchInput.trim();
    if (!term) {
      setGeocodeQuery(null);
      return;
    }

    setGeocodeQuery(term);
  }

  function jumpToLocation(result: GeocodingResult) {
    const view = mapViewRef.current;
    if (!view) {
      return;
    }

    view.animate({
      center: fromLonLat([result.longitude, result.latitude]),
      zoom: 8,
      duration: 480,
    });

    setSelectedCoords([result.longitude, result.latitude]);
  }

  function applyBuildingProfileFilter() {
    const view = mapViewRef.current;
    if (!view) return;

    const coords = COUNTRY_COORDINATES[buildingProfilingCountry];
    if (!coords) return;

    // Lock to zoom 22 as requested
    view.setProperties({
      minZoom: 18,
      maxZoom: 18,
    });

    view.animate({
      center: fromLonLat(coords),
      zoom: 18,
      duration: 1000,
    });
  }

  useEffect(() => {
    if (!mapTargetRef.current || mapRef.current) {
      return;
    }

    const targetElement = mapTargetRef.current;

    const hazardLayer = new VectorLayer({ source: hazardSourceRef.current });
    const pinLayer = new VectorLayer({ source: pinSourceRef.current });
    const userLayer = new VectorLayer({ source: userSourceRef.current });
    const helpLayer = new VectorLayer({ source: helpSourceRef.current });

    const clusteringLayer = new VectorLayer({
      source: clusteringSourceRef.current,
      style: new Style({
        image: new CircleStyle({
          radius: 10,
          fill: new Fill({ color: 'rgba(255, 165, 0, 0.7)' }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
        }),
        text: new Text({
          text: '', // Set dynamically
        }),
      }),
      visible: viewBuildingProfiles,
    });

    clusteringLayer.setStyle((feature) => {
      const featureType = feature.get('featureType');
      if (featureType === 'building') {
        const data = feature.get('data') || {};
        const score = data.data.vulnerability_score || 0;
        return new Style({
          fill: new Fill({ color: getVulnerabilityColor(score) }),
          stroke: new Stroke({ color: '#fff', width: 0.5 }),
        });
      }

      const count = feature.get('count') || 1;
      return new Style({
        image: new CircleStyle({
          radius: Math.min(20, 10 + count / 100),
          fill: new Fill({ color: 'rgba(255, 165, 0, 0.7)' }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
        }),
        text: new Text({
          text: count.toString(),
          fill: new Fill({ color: '#fff' }),
          font: 'bold 12px sans-serif',
        }),
      });
    });

    const view = new View({
      center: fromLonLat(ASEAN_CENTER_LON_LAT),
      zoom: 4.8,
      minZoom: 3,
      maxZoom: 22,
    });

    mapViewRef.current = view;

    const overlay = new Overlay({
      element: popupRef.current as HTMLDivElement,
      autoPan: false,
    });
    overlayRef.current = overlay;

    mapRef.current = new Map({
      target: targetElement,
      layers: [
        new TileLayer({ source: new OSM() }),
        clusteringLayer,
        hazardLayer,
        pinLayer,
        userLayer,
        helpLayer,
      ],
      view,
      overlays: [overlay],
    });

    // Ensure OpenLayers recalculates viewport size after layout and future resizes.
    const resizeObserver = new ResizeObserver(() => {
      mapRef.current?.updateSize();
    });
    resizeObserver.observe(targetElement);

    requestAnimationFrame(() => {
      mapRef.current?.updateSize();
      setIsMapReady(true);
    });

    const map = mapRef.current;
    if (!map) return;

    map.on('singleclick', (event) => {
      const clickedFeatures = map.getFeaturesAtPixel(event.pixel);
      if (!clickedFeatures || clickedFeatures.length === 0) return;

      const clickedFeature = clickedFeatures.find((feature) => {
        const featureType = String(feature.get('featureType'));
        return featureType === 'pin' || featureType === 'user' || featureType === 'help';
      });

      if (!clickedFeature) {
        return;
      }

      const featureType = String(clickedFeature.get('featureType'));

      if (featureType === 'pin') {
        const pinId = String(clickedFeature.get('pinId'));
        const pin = filteredPinsRef.current.find((item) => item.id === pinId) ?? null;
        setSelectedPin(pin);
        setSelectedUser(null);
        setSelectedHelpRequest(null);
        if (pin) {
          setSelectedCoords([pin.longitude, pin.latitude]);
        }
        return;
      }

      if (featureType === 'user') {
        const userLocationId = String(clickedFeature.get('userLocationId'));
        const user = filteredUsersRef.current.find((item) => item.id === userLocationId) ?? null;
        setSelectedUser(user);
        setSelectedPin(null);
        setSelectedHelpRequest(null);
        if (user) {
          setSelectedCoords([user.longitude, user.latitude]);
        }
        return;
      }

      if (featureType === 'help') {
        const helpRequestId = String(clickedFeature.get('helpRequestId'));
        const helpRequest =
          filteredHelpRequestsRef.current.find((item) => item.id === helpRequestId) ?? null;
        setSelectedHelpRequest(helpRequest);
        setSelectedPin(null);
        setSelectedUser(null);
        if (helpRequest) {
          setSelectedCoords([helpRequest.longitude, helpRequest.latitude]);
        }
        return;
      }
    });

    map.on('pointermove', (event) => {
      if (event.dragging) return;
      
      const pixel = map.getEventPixel(event.originalEvent);
      const feature = map.forEachFeatureAtPixel(pixel, (f) => f);
      
      if (feature && feature.get('featureType') === 'building') {
        const data = feature.get('data');
        console.log(data);
        setHoveredBuilding(data.data);
        overlay.setPosition(event.coordinate);
        map.getTargetElement().style.cursor = 'pointer';
      } else {
        setHoveredBuilding(null);
        overlay.setPosition(undefined);
        map.getTargetElement().style.cursor = '';
      }
    });

    map.on('moveend', () => {
      const view = map.getView();
      const extent = view.calculateExtent(map.getSize());
      const transformedExtent = transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
      setBuildingProfilingBBox(transformedExtent.join(','));
    });

    return () => {
      resizeObserver.disconnect();
      mapRef.current?.setTarget(undefined);
      mapRef.current = null;
      mapViewRef.current = null;
      setIsMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    requestAnimationFrame(() => {
      map.updateSize();
    });
  }, [isFilterDrawerOpen]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1025px)');
    const closeDrawerOnDesktop = (event: MediaQueryListEvent | MediaQueryList) => {
      if (event.matches) {
        setIsFilterDrawerOpen(false);
      }
    };

    closeDrawerOnDesktop(mediaQuery);
    mediaQuery.addEventListener('change', closeDrawerOnDesktop);

    return () => {
      mediaQuery.removeEventListener('change', closeDrawerOnDesktop);
    };
  }, []);

  const hasAnyMapData =
    filteredRisks.length > 0 || filteredPins.length > 0 || filteredUsers.length > 0;


  useEffect(() => {
    const source = hazardSourceRef.current;
    source.clear();

    filteredRisks.forEach((risk) => {
      if (risk.latitude == null || risk.longitude == null || risk.radiusKm == null) {
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

      source.addFeature(feature);
    });
  }, [filteredRisks]);

  useEffect(() => {
    const source = pinSourceRef.current;
    source.clear();

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
            fill: new Fill({
              color:
                pin.reviewStatus === 'REJECTED'
                  ? '#D72B2B'
                  : pin.reviewStatus === 'APPROVED'
                    ? '#2E7D32'
                    : '#1B5FA8',
            }),
            stroke: new Stroke({ color: '#F5F0E8', width: 2 }),
          }),
        }),
      );

      source.addFeature(feature);
    });
  }, [filteredPins]);

  useEffect(() => {
    const source = userSourceRef.current;
    source.clear();

    filteredUsers.forEach((user) => {
      const stale = isLocationStale(user.updatedAt);
      const feature = new Feature({
        geometry: new Point(fromLonLat([user.longitude, user.latitude])),
        featureType: 'user',
        userLocationId: user.id,
      });

      feature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: stale ? 6 : 7,
            fill: new Fill({ color: stale ? '#A67C52' : '#1C4E80' }),
            stroke: new Stroke({ color: '#F5F0E8', width: 2 }),
          }),
        }),
      );

      source.addFeature(feature);
    });
  }, [filteredUsers]);

  useEffect(() => {
    const source = helpSourceRef.current;
    source.clear();

    filteredHelpRequests.forEach((req) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([req.longitude, req.latitude])),
        featureType: 'help',
        helpRequestId: req.id,
      });

      const urgencyColors: Record<string, string> = {
        CRITICAL: '#D32F2F',
        HIGH: '#F57C00',
        MEDIUM: '#FBC02D',
        LOW: '#1976D2',
      };

      feature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 9,
            fill: new Fill({ color: urgencyColors[req.urgency] ?? '#757575' }),
            stroke: new Stroke({ color: '#F5F0E8', width: 2 }),
          }),
        }),
      );

      source.addFeature(feature);
    });
  }, [filteredHelpRequests]);
 
  useEffect(() => {
    const source = clusteringSourceRef.current;
    if (!viewBuildingProfiles || !buildingProfilesQuery.data) {
      source.clear();
      return;
    }

    const data = (buildingProfilesQuery as any).data;
    source.clear();
    const features = new GeoJSON().readFeatures(data as any, {
      featureProjection: 'EPSG:3857',
    });

    // Ensure each building feature has required properties for styling and hover
    features.forEach((feature) => {
      feature.set('featureType', 'building');
      feature.set('data', feature.getProperties());
    });

    source.addFeatures(features);
  }, [viewBuildingProfiles, buildingProfilesQuery.data]);

  useEffect(() => {
    const view = mapViewRef.current;
    if (!view) return;

    if (viewBuildingProfiles) {
      view.setMinZoom(18);
      view.setMaxZoom(18);
      // Force zoom to 18
      view.setZoom(18);

      // Disable all zoom-related interactions
      mapRef.current?.getInteractions().forEach((interaction) => {
        if (
          interaction instanceof MouseWheelZoom ||
          interaction instanceof DoubleClickZoom ||
          interaction instanceof PinchZoom ||
          interaction instanceof KeyboardZoom ||
          interaction instanceof DragZoom
        ) {
          interaction.setActive(false);
        }
      });

      // Disable zoom-related controls
      mapRef.current?.getControls().forEach((control) => {
        if (control instanceof Zoom) {
          control.setTarget(null as any);
        }
      });
    } else {
      // Restore default constraints and interactions
      view.setMinZoom(3);
      view.setMaxZoom(22);

      mapRef.current?.getInteractions().forEach((interaction) => {
        if (
          interaction instanceof MouseWheelZoom ||
          interaction instanceof DoubleClickZoom ||
          interaction instanceof PinchZoom ||
          interaction instanceof KeyboardZoom ||
          interaction instanceof DragZoom
        ) {
          interaction.setActive(true);
        }
      });

      mapRef.current?.getControls().forEach((control) => {
        if (control instanceof Zoom) {
          control.setTarget(undefined as any);
        }
      });
    }
  }, [viewBuildingProfiles]);

  useEffect(() => {
    const layers = mapRef.current?.getLayers();
    if (layers) {
      const clusteringLayer = layers.getArray().find((l) => {
        if (l instanceof VectorLayer) {
          return l.getVisible() !== undefined && (l.getSource() === clusteringSourceRef.current);
        }
        return false;
      });
      if (clusteringLayer) {
        clusteringLayer.setVisible(viewBuildingProfiles);
      }
    }
  }, [viewBuildingProfiles]);

  return (
    <section className="page-shell">
      <header className="section-header">
        <p className="eyebrow">OpenLayers Operations Map</p>
        <h1 className="title">Hazard & Pin Monitoring / Pemantauan Peta</h1>
        <p className="subtitle">
          ASEAN-focused operations view with user pins, hazard layers, and weather insight.
        </p>
      </header>

      <div className="map-mobile-actions">
        <button
          type="button"
          className="btn btn-neutral"
          onClick={() => setIsFilterDrawerOpen((current) => !current)}
        >
          {isFilterDrawerOpen ? 'Close Filters' : 'Open Filters'}
        </button>
      </div>

      <div className="map-layout map-layout-large">
        <aside className={`card sidebar filter-sidebar ${isFilterDrawerOpen ? 'open' : ''}`}>
          <h2 className="card-title">Risk & Intelligence</h2>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={viewBuildingProfiles}
              onChange={(event) => setViewBuildingProfiles(event.target.checked)}
            />
            <span>View Building Profiles (Overlay)</span>
          </label>

          {viewBuildingProfiles && (
            <div className="card-content-stack" style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
              <p className="small muted">Data fetched dynamically based on map area.</p>
              <label className="field-label">
                Country
                <select
                  className="field"
                  value={buildingProfilingCountry}
                  onChange={(e) => setBuildingProfilingCountry(e.target.value)}
                >
                  <option value="brn">Brunei</option>
                  <option value="idn">Indonesia</option>
                  <option value="mys">Malaysia</option>
                  <option value="phl">Philippines</option>
                  <option value="sgp">Singapore</option>
                </select>
              </label>
              <button
                className="btn btn-warning"
                type="button"
                onClick={applyBuildingProfileFilter}
                style={{ marginTop: '0.5rem' }}
              >
                Apply Filter
              </button>
              <p className="small muted">Showing full detail profiles</p>
            </div>
          )}

          <div className="divider" style={{ margin: '1rem 0', opacity: 0.1, borderBottom: '1px solid currentColor' }} />
 
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

          <h2 className="card-title">User Location Recency</h2>
          {Object.keys(userFilter).map((key) => (
            <label className="checkbox-row" key={key}>
              <input
                type="checkbox"
                checked={userFilter[key]}
                onChange={(event) =>
                  setUserFilter((current) => ({ ...current, [key]: event.target.checked }))
                }
              />
              <span>{key}</span>
            </label>
          ))}

          <div className="map-toolbar-row">
            <button className="btn btn-neutral" type="button" onClick={fitToData}>
              Fit To Data
            </button>
            <button className="btn btn-neutral" type="button" onClick={refocusAsean}>
              Recenter ASEAN
            </button>
          </div>

          <form onSubmit={onSearchLocation} className="map-search-form">
            <label className="field-label" htmlFor="map-search">
              Geocoding Search
              <input
                id="map-search"
                className="field"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search city or region"
              />
            </label>
            <button className="btn btn-warning" type="submit">
              Find Location
            </button>
          </form>

          {geocodeQuery ? (
            <div className="selection-list map-search-results">
              {geocodingQuery.isLoading ? <p className="muted small">Searching...</p> : null}
              {geocodingQuery.isError ? (
                <p className="error-text">Geocoding request failed.</p>
              ) : null}
              {geocodingResults.length > 0
                ? geocodingResults.map((result, index) => (
                    <button
                      key={`${result.name ?? 'location'}-${index}`}
                      type="button"
                      className="chip"
                      onClick={() => jumpToLocation(result)}
                    >
                      {(result.name ?? 'Unknown')} {result.country_code ? `(${result.country_code})` : ''}
                    </button>
                  ))
                : null}
              {!geocodingQuery.isLoading && geocodingResults.length === 0 ? (
                <p className="muted small">No matching locations from Open-Meteo geocoding.</p>
              ) : null}
            </div>
          ) : null}
        </aside>

        <div className="card map-card map-card-large">
          <div className="map-legend">
            <span className="legend-item">
              <span className="legend-dot legend-hazard" /> Hazards
            </span>
            <span className="legend-item">
              <span className="legend-dot legend-pin" /> Ops Pins
            </span>
            <span className="legend-item">
              <span className="legend-dot legend-user" /> User Locations
            </span>
            <span className="legend-item">
              <span className="legend-dot legend-help" /> Help Requests
            </span>
          </div>
          <div className="map-status-row">
            <span className="chip">Hazards: {filteredRisks.length}</span>
            <span className="chip">Pins: {filteredPins.length}</span>
            <span className="chip">Users: {filteredUsers.length}</span>
            <span className="chip">Help: {filteredHelpRequests.length}</span>
          </div>
          {overviewQuery.isLoading ? <p className="muted small">Loading map datasets...</p> : null}
          {overviewQuery.isError ? (
            <p className="error-text">
              Failed to load map datasets.
              {overviewQuery.error && typeof overviewQuery.error === 'object' && 'response' in overviewQuery.error
                ? ' Check that you are logged in as an admin.'
                : ''}
            </p>
          ) : null}
          <div ref={mapTargetRef} className="map-canvas" />
          
          <div ref={popupRef} className="map-hover-popup card" style={{ 
            display: hoveredBuilding ? 'block' : 'none',
            position: 'absolute',
            zIndex: 100,
            padding: '1rem',
            minWidth: '200px',
            pointerEvents: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            {hoveredBuilding && (
              <div className="popup-content">
                <h3 className="small mono">Building Data</h3>
                <div className="divider" style={{ margin: '0.5rem 0' }} />
                <dl className="summary-grid" style={{ gridTemplateColumns: '1fr 1fr', fontSize: '0.75rem' }}>
                  <dt>Stories</dt> <dd>{hoveredBuilding.stories ?? 'N/A'}</dd>
                  <dt>Population</dt> <dd>{hoveredBuilding.total_pop?.toFixed(2) ?? 'N/A'}</dd>
                  <dt>Children</dt> <dd>{hoveredBuilding.child_count?.toFixed(2) ?? 'N/A'}</dd>
                  <dt>Elderly</dt> <dd>{hoveredBuilding.elderly_count?.toFixed(2) ?? 'N/A'}</dd>
                  <dt>Vulnerability</dt> <dd><strong>{hoveredBuilding.vulnerability_score?.toFixed(2) ?? 'N/A'}</strong></dd>
                  <dt>Risk Status</dt> <dd>{hoveredBuilding.risk_status ?? 'N/A'}</dd>
                </dl>
              </div>
            )}
          </div>

          {!isMapReady ? (
            <div className="map-overlay">
              <p className="small muted">Initializing map viewport...</p>
            </div>
          ) : null}
          {!overviewQuery.isLoading && !overviewQuery.isError && !hasAnyMapData ? (
            <div className="map-overlay map-overlay-warning">
              <p className="small">Map loaded with no overlays. Base map should still be visible.</p>
            </div>
          ) : null}
        </div>

        <aside className="card sidebar details-sidebar">
          <h2 className="card-title">Selection Details</h2>

          {selectedPin ? (
            <>
              <p className="small muted">Operational Pin</p>
              <dl className="summary-grid">
                <dt>Title</dt>
                <dd>{selectedPin.title}</dd>
                <dt>Status</dt>
                <dd>{selectedPin.status}</dd>
                <dt>Region</dt>
                <dd>{selectedPin.region ?? 'Unknown'}</dd>
                <dt>Hazard</dt>
                <dd>{selectedPin.hazardType}</dd>
                {selectedPin.reporter ? (
                  <>
                    <dt>Reporter</dt>
                    <dd>{selectedPin.reporter.name}</dd>
                  </>
                ) : null}
                {selectedPin.note ? (
                  <>
                    <dt>Note</dt>
                    <dd className="small">{selectedPin.note}</dd>
                  </>
                ) : null}
                <dt>Updated</dt>
                <dd>{selectedPin.updatedAt ?? 'N/A'}</dd>
                {selectedPin.reviewStatus ? (
                  <>
                    <dt>Review</dt>
                    <dd>{selectedPin.reviewStatus}</dd>
                    {selectedPin.reviewNote ? (
                      <>
                        <dt>Review note</dt>
                        <dd className="small">{selectedPin.reviewNote}</dd>
                      </>
                    ) : null}
                  </>
                ) : null}
              </dl>
              {selectedPin.photoUrl ? (
                <div className="summary-grid" style={{ marginTop: '0.5rem' }}>
                  <dt>Photo</dt>
                  <dd>
                    <img
                      src={selectedPin.photoUrl}
                      alt="Pin attachment"
                      style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 8 }}
                    />
                  </dd>
                </div>
              ) : null}
              {selectedPin.reviewStatus !== 'APPROVED' && selectedPin.reviewStatus !== 'REJECTED' ? (
                <div style={{ marginTop: '1rem' }}>
                  <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>Review pin</h3>
                  <div className="map-toolbar-row" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="field"
                      placeholder="Reason (required for reject)"
                      value={pinReviewReason}
                      onChange={(e) => setPinReviewReason(e.target.value)}
                      aria-label="Review reason"
                    />
                    <button
                      type="button"
                      className="btn btn-neutral"
                      disabled={reviewPinMutation.isPending}
                      onClick={() => {
                        reviewPinMutation.mutate({
                          id: selectedPin.id,
                          data: { action: 'APPROVE' },
                        });
                      }}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn btn-warning"
                      disabled={reviewPinMutation.isPending || !pinReviewReason.trim()}
                      onClick={() => {
                        reviewPinMutation.mutate({
                          id: selectedPin.id,
                          data: { action: 'REJECT', reason: pinReviewReason.trim() },
                        });
                      }}
                    >
                      Reject
                    </button>
                  </div>
                  {reviewPinMutation.isError ? (
                    <p className="error-text small" style={{ marginTop: '0.5rem' }}>
                      Review failed. Please try again.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}

          {selectedUser ? (
            <>
              <p className="small muted">User Location</p>
              <dl className="summary-grid">
                <dt>User ID</dt>
                <dd className="mono small">{selectedUser.userId}</dd>
                <dt>Region</dt>
                <dd>{selectedUser.region ?? 'Unknown'}</dd>
                <dt>Coordinates</dt>
                <dd>
                  {selectedUser.latitude.toFixed(4)}, {selectedUser.longitude.toFixed(4)}
                </dd>
                <dt>Recency</dt>
              </dl>
            </>
          ) : null}

          {selectedHelpRequest ? (
            <>
              <p className="small muted">Emergency Help Request</p>
              <dl className="summary-grid">
                <dt>Requester</dt>
                <dd>{selectedHelpRequest.requester.name}</dd>
                <dt>Hazard</dt>
                <dd>{selectedHelpRequest.hazardType}</dd>
                <dt>Urgency</dt>
                <dd>
                  <span className={`chip chip-${selectedHelpRequest.urgency.toLowerCase()}`}>
                    {selectedHelpRequest.urgency}
                  </span>
                </dd>
                <dt>Status</dt>
                <dd>{selectedHelpRequest.status}</dd>
                <dt>Description</dt>
                <dd className="small">{selectedHelpRequest.description}</dd>
                <dt>Created</dt>
                <dd>{new Date(selectedHelpRequest.createdAt).toLocaleString()}</dd>
              </dl>
            </>
          ) : null}

          {!selectedPin && !selectedUser && !selectedHelpRequest ? (
            <p className="muted">
              Select an operations pin, user, or help request to inspect details.
            </p>
          ) : null}

          <h2 className="card-title">Open-Meteo Weather</h2>
          {selectedCoords ? (
            <p className="small muted">
              Lat {selectedCoords[1].toFixed(4)}, Lon {selectedCoords[0].toFixed(4)}
            </p>
          ) : (
            <p className="muted small">Select a pin or user location to load weather.</p>
          )}

          {weatherQuery.isLoading ? <p className="muted">Loading forecast...</p> : null}
          {weatherQuery.isError ? (
            <p className="error-text">Unable to load weather forecast for this selection.</p>
          ) : null}

          {weatherSummary ? (
            <dl className="summary-grid">
              <dt>Current Temp</dt>
              <dd>{fmt(weatherSummary.temperature)} C</dd>
              <dt>Wind Speed</dt>
              <dd>{fmt(weatherSummary.windSpeed)} km/h</dd>
              <dt>Weather Code</dt>
              <dd>{fmt(weatherSummary.weatherCode, 0)}</dd>
              <dt>Max (Today)</dt>
              <dd>
                {fmt(weatherSummary.maxTemp)} {weatherSummary.tempUnit}
              </dd>
              <dt>Min (Today)</dt>
              <dd>
                {fmt(weatherSummary.minTemp)} {weatherSummary.tempUnit}
              </dd>
              <dt>Precipitation</dt>
              <dd>
                {fmt(weatherSummary.precipitation)} {weatherSummary.precipitationUnit}
              </dd>
            </dl>
          ) : null}
        </aside>
      </div>

      {isFilterDrawerOpen ? (
        <button
          type="button"
          className="map-drawer-backdrop"
          aria-label="Close map filters"
          onClick={() => setIsFilterDrawerOpen(false)}
        />
      ) : null}
    </section>
  );
}
