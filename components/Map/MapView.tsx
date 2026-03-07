"use client";

import { useEffect, useRef, useCallback } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import XYZ from "ol/source/XYZ";
import { fromLonLat, toLonLat, transformExtent } from "ol/proj";
import { Style, Fill, Stroke } from "ol/style";
import GeoJSON from "ol/format/GeoJSON";
import { defaults as defaultControls } from "ol/control";
import type { MapBrowserEvent } from "ol";
import {
  ASEAN_BBOX_WGS84,
  ASEAN_CENTER_WGS84,
  ASEAN_DEFAULT_ZOOM,
  ASEAN_MIN_ZOOM,
  ASEAN_MAX_ZOOM,
} from "@/lib/asean";

interface MapViewProps {
  onLocationSelect: (lat: number, lon: number) => void;
  selectedLat?: number;
  selectedLon?: number;
}

// ASEAN extent in Web Mercator (EPSG:3857) for OpenLayers
const ASEAN_EXTENT_3857 = transformExtent(
  [ASEAN_BBOX_WGS84.west, ASEAN_BBOX_WGS84.south, ASEAN_BBOX_WGS84.east, ASEAN_BBOX_WGS84.north],
  "EPSG:4326",
  "EPSG:3857",
);

// Simplified ASEAN GeoJSON boundary for highlighting the region
const ASEAN_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "ASEAN Region" },
      geometry: {
        type: "Polygon",
        // A simple approximation outline of the ASEAN region
        coordinates: [[
          [92.0, 28.5], [100.0, 28.5], [104.0, 22.0], [108.0, 21.5],
          [110.0, 20.0], [117.0, 7.0], [120.0, 4.5], [126.5, 7.5],
          [130.0, 6.0], [141.0, -7.0], [141.0, -11.5], [115.0, -11.5],
          [105.0, -8.5], [95.0, 1.0], [92.0, 5.0], [92.0, 28.5],
        ]],
      },
    },
  ],
};

/**
 * MapView renders a full-screen OpenLayers map locked to the ASEAN region.
 * Click anywhere inside to select a location for weather data.
 */
export default function MapView({ onLocationSelect, selectedLat, selectedLon }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const clickMarkerLayer = useRef<VectorLayer<VectorSource> | null>(null);

  const handleMapClick = useCallback(
    (evt: MapBrowserEvent<MouseEvent>) => {
      const coordinate = evt.coordinate;
      const [lon, lat] = toLonLat(coordinate);
      onLocationSelect(lat, lon);
    },
    [onLocationSelect],
  );

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Dark tile layer using CartoDB dark matter (no API key needed)
    const tileLayer = new TileLayer({
      source: new XYZ({
        url: "https://{a-d}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attributions:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      }),
    });

    // ASEAN region subtle highlight layer
    const regionLayer = new VectorLayer({
      source: new VectorSource({
        features: new GeoJSON().readFeatures(ASEAN_GEOJSON, {
          featureProjection: "EPSG:3857",
        }),
      }),
      style: new Style({
        fill: new Fill({ color: "rgba(0, 56, 147, 0.06)" }),
        stroke: new Stroke({ color: "rgba(245, 211, 18, 0.3)", width: 1.5 }),
      }),
      zIndex: 1,
    });

    // Marker layer for selected location
    const markerSource = new VectorSource();
    const markerLayer = new VectorLayer({
      source: markerSource,
      zIndex: 10,
    });
    clickMarkerLayer.current = markerLayer;

    const map = new Map({
      target: mapRef.current,
      layers: [tileLayer, regionLayer, markerLayer],
      view: new View({
        center: fromLonLat([ASEAN_CENTER_WGS84.lon, ASEAN_CENTER_WGS84.lat]),
        zoom: ASEAN_DEFAULT_ZOOM,
        minZoom: ASEAN_MIN_ZOOM,
        maxZoom: ASEAN_MAX_ZOOM,
        extent: ASEAN_EXTENT_3857,
        constrainOnlyCenter: true,
      }),
      controls: defaultControls({ attribution: true, zoom: true, rotate: false }),
    });

    map.on("click", handleMapClick);

    // Change cursor to crosshair over map
    map.on("pointermove", () => {
      if (mapRef.current) {
        mapRef.current.style.cursor = "crosshair";
      }
    });

    mapInstance.current = map;

    return () => {
      map.dispose();
      mapInstance.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update click handler ref when callback changes
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    map.un("click", handleMapClick);
    map.on("click", handleMapClick);
  }, [handleMapClick]);

  // Fly to selected location when it changes externally (e.g., from search)
  useEffect(() => {
    if (selectedLat === undefined || selectedLon === undefined) return;
    const view = mapInstance.current?.getView();
    if (!view) return;

    view.animate({
      center: fromLonLat([selectedLon, selectedLat]),
      zoom: Math.max(view.getZoom() ?? ASEAN_DEFAULT_ZOOM, 8),
      duration: 600,
    });
  }, [selectedLat, selectedLon]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full"
      style={{ background: "#06101f" }}
      aria-label="ASEAN interactive weather map"
    />
  );
}
