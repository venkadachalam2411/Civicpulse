'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { IIssue } from '../types';

interface MapComponentProps {
  issues: IIssue[];
  center: [number, number];
  zoom: number;
  interactiveSelect?: boolean;
  selectedPosition?: [number, number];
  onLocationSelect?: (lat: number, lng: number) => void;
}

const getMarkerIcon = (priority: string) => {
  let color = '#0284c7'; // medium blue
  if (priority === 'critical') color = '#ef4444';
  if (priority === 'high') color = '#f59e0b';
  if (priority === 'low') color = '#10b981';

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32" stroke="#ffffff" stroke-width="1.5">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-map-pin',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const getSelectedMarkerIcon = () => {
  const svgIcon = `
    <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0284c7" width="38" height="38" stroke="#ffffff" stroke-width="2" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'selected-location-pin',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
  });
};

function MapController({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || map.getZoom(), { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: any) {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function SelectedLocationMarker({
  position,
  onLocationSelect,
}: {
  position: [number, number];
  onLocationSelect?: (lat: number, lng: number) => void;
}) {
  return (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: (e: any) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          if (onLocationSelect) {
            onLocationSelect(pos.lat, pos.lng);
          }
        },
      }}
      icon={getSelectedMarkerIcon()}
    >
      <Popup className="custom-leaflet-popup">
        <div className="p-2 text-slate-900 text-xs">
          <div className="font-bold text-sky-600 flex items-center gap-1 mb-1">
            📍 Selected Issue Location
          </div>
          <div className="text-[11px] font-mono text-slate-600">
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            💡 Drag this pin or click anywhere on the map to fine-tune exact spot.
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export default function MapComponent({
  issues,
  center,
  zoom,
  interactiveSelect,
  selectedPosition,
  onLocationSelect,
}: MapComponentProps) {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController center={center} zoom={zoom} />

      {interactiveSelect && <MapClickHandler onLocationSelect={onLocationSelect} />}

      {interactiveSelect && selectedPosition && (
        <SelectedLocationMarker position={selectedPosition} onLocationSelect={onLocationSelect} />
      )}

      {issues.map((issue) => (
        <Marker
          key={issue._id}
          position={[issue.latitude, issue.longitude]}
          icon={getMarkerIcon(issue.priority)}
        >
          <Popup className="custom-leaflet-popup">
            <div className="p-2 max-w-xs text-slate-900">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200">
                  {issue.issueId}
                </span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">
                  {issue.priority} priority
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 leading-tight">{issue.title}</h4>
              <p className="text-[11px] text-slate-600 mt-1">{issue.location}</p>
              <div className="mt-2 pt-1 border-t border-slate-200 flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-medium">{issue.category}</span>
                <Link
                  href={`/issues/${issue._id}`}
                  className="text-[11px] font-bold text-sky-600 hover:text-sky-800 underline"
                >
                  View issue →
                </Link>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
