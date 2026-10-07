'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Map, Marker, Popup, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { IIssue } from '../types';
import {
  Satellite,
  Layers,
  Compass,
  Crosshair,
  Loader2,
  ZoomIn,
  ZoomOut,
  Sparkles,
  MapPin,
  ExternalLink,
  Eye,
} from 'lucide-react';

export type MapLayerType = 'satellite' | 'streets' | 'dark';

export interface MapComponentProps {
  issues?: IIssue[];
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  interactiveSelect?: boolean;
  selectedPosition?: [number, number]; // [lat, lng]
  onLocationSelect?: (lat: number, lng: number, accuracy?: number) => void;
  defaultLayer?: MapLayerType;
  showLayerToggle?: boolean;
  showLocateButton?: boolean;
  showCoordsHUD?: boolean;
  autoLocateOnLoad?: boolean;
}

// MapLibre Style Definitions for Satellite, Streets, and Dark
const getMapStyle = (layerType: MapLayerType): StyleSpecification => {
  if (layerType === 'satellite') {
    return {
      version: 8,
      sources: {
        'esri-satellite': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          maxzoom: 19,
          attribution: 'Esri, Maxar, Earthstar Geographics',
        },
        'esri-labels': {
          type: 'raster',
          tiles: [
            'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          maxzoom: 19,
        },
        'esri-roads': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          maxzoom: 19,
        },
      },
      layers: [
        {
          id: 'satellite-base',
          type: 'raster',
          source: 'esri-satellite',
          paint: {
            'raster-opacity': 1,
            'raster-fade-duration': 100,
          },
        },
        {
          id: 'satellite-roads',
          type: 'raster',
          source: 'esri-roads',
          paint: {
            'raster-opacity': 0.75,
          },
        },
        {
          id: 'satellite-labels',
          type: 'raster',
          source: 'esri-labels',
          paint: {
            'raster-opacity': 0.9,
          },
        },
      ],
    };
  }

  if (layerType === 'dark') {
    return {
      version: 8,
      sources: {
        'carto-dark': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          maxzoom: 19,
          attribution: 'CARTO',
        },
      },
      layers: [
        {
          id: 'dark-base',
          type: 'raster',
          source: 'carto-dark',
          paint: {
            'raster-opacity': 1,
          },
        },
      ],
    };
  }

  // Default: Streets (OpenStreetMap)
  return {
    version: 8,
    sources: {
      'osm-streets': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        maxzoom: 19,
        attribution: 'OpenStreetMap contributors',
      },
    },
    layers: [
      {
        id: 'streets-base',
        type: 'raster',
        source: 'osm-streets',
        paint: {
          'raster-opacity': 1,
        },
      },
    ],
  };
};

export default function MapComponent({
  issues = [],
  center = [11.1271, 78.6569], // [lat, lng]
  zoom = 7,
  interactiveSelect = false,
  selectedPosition,
  onLocationSelect,
  defaultLayer = 'satellite',
  showLayerToggle = true,
  showLocateButton = true,
  showCoordsHUD = true,
  autoLocateOnLoad = false,
}: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const selectedMarkerRef = useRef<Marker | null>(null);
  const userLiveMarkerRef = useRef<Marker | null>(null);
  const issueMarkersRef = useRef<Marker[]>([]);

  const [activeLayer, setActiveLayer] = useState<MapLayerType>(defaultLayer);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [userAccuracy, setUserAccuracy] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [currentPitch, setCurrentPitch] = useState<number>(0);
  const [currentCenter, setCurrentCenter] = useState<[number, number]>([center[0], center[1]]);
  const [currentZoom, setCurrentZoom] = useState<number>(zoom);

  // Initialize MapLibre GL instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLng = selectedPosition ? selectedPosition[1] : center[1];
    const initialLat = selectedPosition ? selectedPosition[0] : center[0];

    const map = new Map({
      container: mapContainerRef.current,
      style: getMapStyle(activeLayer),
      center: [initialLng, initialLat],
      zoom: selectedPosition ? Math.max(zoom, 14) : zoom,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    map.on('move', () => {
      const c = map.getCenter();
      setCurrentCenter([c.lat, c.lng]);
      setCurrentZoom(map.getZoom());
      setCurrentPitch(map.getPitch());
    });

    // Interactive Click Selection
    if (interactiveSelect) {
      map.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        if (onLocationSelect) {
          onLocationSelect(lat, lng);
        }
      });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // Run once on mount

  // Switch Layer / Map Style dynamically
  const switchLayer = useCallback((newLayer: MapLayerType) => {
    setActiveLayer(newLayer);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setStyle(getMapStyle(newLayer));
    }
  }, []);

  // Update Center / Zoom when props change externally
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const targetLat = selectedPosition ? selectedPosition[0] : center[0];
    const targetLng = selectedPosition ? selectedPosition[1] : center[1];

    if (targetLat && targetLng) {
      const currentC = map.getCenter();
      const dist = Math.hypot(currentC.lat - targetLat, currentC.lng - targetLng);
      if (dist > 0.0001) {
        map.flyTo({
          center: [targetLng, targetLat],
          zoom: zoom || map.getZoom(),
          speed: 1.2,
          curve: 1.2,
        });
      }
    }
  }, [center, zoom, selectedPosition]);

  // Render & Update Selected Position Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (interactiveSelect && selectedPosition && selectedPosition[0] && selectedPosition[1]) {
      const [lat, lng] = selectedPosition;

      if (!selectedMarkerRef.current) {
        // Create custom pin element
        const el = document.createElement('div');
        el.className = 'selected-location-pin cursor-grab';
        el.innerHTML = `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 8px 16px rgba(14, 165, 233, 0.7));">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0284c7" width="44" height="44" stroke="#ffffff" stroke-width="1.8">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        `;

        const popup = new Popup({ offset: 25, closeButton: false }).setHTML(`
          <div style="padding: 6px; font-size: 11px; color: #f8fafc;">
            <strong style="color: #38bdf8; display: flex; align-items: center; gap: 4px; font-size: 12px;">
              📍 Selected Spot
            </strong>
            <div style="font-family: monospace; font-size: 11px; margin-top: 4px; color: #bae6fd;">
              ${lat.toFixed(6)}°, ${lng.toFixed(6)}°
            </div>
            <p style="margin-top: 4px; font-size: 10px; color: #94a3b8;">
              Drag pin or click map to adjust exact spot.
            </p>
          </div>
        `);

        const marker = new Marker({
          element: el,
          draggable: true,
          anchor: 'bottom',
        })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map);

        marker.on('dragend', () => {
          const pos = marker.getLngLat();
          if (onLocationSelect) {
            onLocationSelect(pos.lat, pos.lng);
          }
        });

        selectedMarkerRef.current = marker;
      } else {
        selectedMarkerRef.current.setLngLat([lng, lat]);
      }
    } else if (selectedMarkerRef.current && !interactiveSelect) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }
  }, [interactiveSelect, selectedPosition, onLocationSelect]);

  // Render Issue Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    issueMarkersRef.current.forEach((m) => m.remove());
    issueMarkersRef.current = [];

    issues.forEach((issue) => {
      let color = '#0284c7';
      let bgGlow = 'rgba(2, 132, 199, 0.5)';
      if (issue.priority === 'critical') {
        color = '#ef4444';
        bgGlow = 'rgba(239, 68, 68, 0.6)';
      } else if (issue.priority === 'high') {
        color = '#f59e0b';
        bgGlow = 'rgba(245, 158, 11, 0.6)';
      } else if (issue.priority === 'low') {
        color = '#10b981';
        bgGlow = 'rgba(16, 185, 129, 0.6)';
      }

      const el = document.createElement('div');
      el.className = 'custom-map-pin';
      el.innerHTML = `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 10px ${bgGlow});">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="34" height="34" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      `;

      const popupContent = `
        <div style="padding: 8px; max-width: 260px; color: #f8fafc; font-family: sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 10px; font-family: monospace; font-weight: bold; padding: 2px 6px; border-radius: 6px; background: #1e293b; color: #38bdf8; border: 1px solid #334155;">
              ${issue.issueId}
            </span>
            <span style="font-size: 10px; font-weight: 600; text-transform: uppercase; padding: 2px 6px; border-radius: 6px; background: #082f49; color: #7dd3fc; border: 1px solid #0369a1;">
              ${issue.priority}
            </span>
          </div>
          <h4 style="font-size: 13px; font-weight: bold; color: #ffffff; line-height: 1.3; margin: 0;">${issue.title}</h4>
          <p style="font-size: 11px; color: #cbd5e1; margin: 4px 0 0 0;">${issue.location}</p>
          <div style="margin-top: 10px; padding-top: 6px; border-top: 1px solid #334155; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 10px; color: #94a3b8; font-weight: 500;">${issue.category}</span>
            <div style="display: flex; gap: 8px;">
              <a href="https://www.google.com/maps/search/?api=1&query=${issue.latitude},${issue.longitude}" target="_blank" rel="noreferrer" style="font-size: 10px; color: #94a3b8; text-decoration: none;">Maps ↗</a>
              <a href="/issues/${issue._id}" style="font-size: 11px; font-weight: bold; color: #38bdf8; text-decoration: underline;">View →</a>
            </div>
          </div>
        </div>
      `;

      const popup = new Popup({ offset: 25 }).setHTML(popupContent);

      const marker = new Marker({ element: el, anchor: 'bottom' })
        .setLngLat([issue.longitude, issue.latitude])
        .setPopup(popup)
        .addTo(map);

      issueMarkersRef.current.push(marker);
    });
  }, [issues]);

  // High Precision Geolocation Handler
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);

    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);

        setUserLocation([lat, lng]);
        setUserAccuracy(acc);
        setIsLocating(false);

        const map = mapInstanceRef.current;
        if (map) {
          map.flyTo({
            center: [lng, lat],
            zoom: 18, // High satellite detail
            pitch: 30, // 30° perspective
            speed: 1.4,
            curve: 1.1,
          });

          // Update user live marker
          if (!userLiveMarkerRef.current) {
            const el = document.createElement('div');
            el.className = 'user-live-location-marker';
            el.innerHTML = `
              <div class="user-live-dot-pulse"></div>
              <div class="user-live-dot-core"></div>
            `;
            const livePopup = new Popup({ offset: 15, closeButton: false }).setHTML(`
              <div style="padding: 4px; font-size: 11px; color: #f8fafc;">
                <strong style="color: #38bdf8;">✨ Your Exact Live Location</strong>
                <div style="font-family: monospace; font-size: 10px; color: #bae6fd; margin-top: 2px;">
                  ${lat.toFixed(6)}°, ${lng.toFixed(6)}°
                </div>
                <div style="color: #34d399; font-size: 10px; margin-top: 2px;">
                  Accuracy: ±${acc}m
                </div>
              </div>
            `);
            userLiveMarkerRef.current = new Marker({ element: el })
              .setLngLat([lng, lat])
              .setPopup(livePopup)
              .addTo(map);
          } else {
            userLiveMarkerRef.current.setLngLat([lng, lat]);
          }
        }

        if (onLocationSelect) {
          onLocationSelect(lat, lng, acc);
        }
      },
      (err) => {
        console.warn('High-accuracy geolocation failed, falling back...', err);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const acc = Math.round(pos.coords.accuracy);
            setUserLocation([lat, lng]);
            setUserAccuracy(acc);
            setIsLocating(false);

            const map = mapInstanceRef.current;
            if (map) {
              map.flyTo({ center: [lng, lat], zoom: 17, speed: 1.2 });
            }
            if (onLocationSelect) {
              onLocationSelect(lat, lng, acc);
            }
          },
          (fallbackErr) => {
            setIsLocating(false);
            alert('Could not retrieve current location. Please check browser permissions.');
          },
          { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
        );
      },
      geoOptions
    );
  }, [onLocationSelect]);

  // Optional auto-locate on mount
  useEffect(() => {
    if (autoLocateOnLoad && !selectedPosition) {
      handleLocateMe();
    }
  }, [autoLocateOnLoad, handleLocateMe, selectedPosition]);

  // Toggle 3D Perspective Pitch (0° flat vs 45° 3D tilt)
  const toggle3DPitch = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const newPitch = map.getPitch() > 20 ? 0 : 50;
    map.easeTo({ pitch: newPitch, duration: 800 });
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleMaxZoomSatellite = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo({ zoom: 18.5, pitch: 40, speed: 1.2 });
  };

  const displayPos = selectedPosition || currentCenter;

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950 rounded-2xl">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '100%' }} />

      {/* Floating In-Map Overlays (Top-Right) */}
      <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
        {/* Layer Switcher */}
        {showLayerToggle && (
          <div className="glass-panel !bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-700/80 shadow-2xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => switchLayer('satellite')}
              title="High-Resolution Satellite Imagery"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeLayer === 'satellite'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Satellite className="w-3.5 h-3.5" />
              <span>Satellite</span>
            </button>

            <button
              type="button"
              onClick={() => switchLayer('streets')}
              title="Standard Street Map"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeLayer === 'streets'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Streets</span>
            </button>

            <button
              type="button"
              onClick={() => switchLayer('dark')}
              title="Dark Civic Map"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeLayer === 'dark'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>
          </div>
        )}

        {/* GPS High-Precision Locate Me Button */}
        {showLocateButton && (
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            title="Get Exact Current GPS Location"
            className="p-2.5 rounded-2xl glass-panel !bg-slate-900/90 text-sky-400 hover:text-white hover:bg-sky-600 border border-slate-700/80 shadow-2xl transition-all flex items-center justify-center group"
          >
            {isLocating ? (
              <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
            ) : (
              <Crosshair className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
            )}
          </button>
        )}

        {/* Map Controls: 3D Tilt, Zoom In, Zoom Out, 18x Focus */}
        <div className="glass-panel !bg-slate-900/90 p-1 rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col gap-1">
          <button
            type="button"
            onClick={toggle3DPitch}
            title="Toggle 3D Satellite Perspective Angle"
            className={`p-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center ${
              currentPitch > 20
                ? 'bg-sky-500 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleMaxZoomSatellite}
            title="Jump to building-level satellite resolution (18.5x)"
            className="p-2 rounded-xl text-amber-400 hover:text-amber-300 hover:bg-slate-800 transition-colors text-[10px] font-bold"
          >
            18x
          </button>
        </div>
      </div>

      {/* Floating HUD Bar (Bottom-Left) */}
      {showCoordsHUD && (
        <div className="absolute bottom-3 left-3 z-10">
          <div className="glass-panel !bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-xl flex items-center gap-2.5 text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-slate-400">Position:</span>
              <span className="text-white font-bold">
                {displayPos[0].toFixed(5)}°, {displayPos[1].toFixed(5)}°
              </span>
            </div>

            {userAccuracy !== null && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-950/80 text-sky-300 border border-sky-800/60 font-sans font-semibold">
                🎯 ±{userAccuracy}m GPS
              </span>
            )}

            <span className="text-[10px] text-slate-400 uppercase font-sans hidden sm:inline">
              🛰️ {activeLayer}
            </span>

            {currentPitch > 10 && (
              <span className="text-[10px] text-amber-400 font-sans font-bold">
                3D {Math.round(currentPitch)}°
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
