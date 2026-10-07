'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { IIssue } from '../types';
import { MapLayerType } from './MapComponent';

export interface MapViewProps {
  issues?: IIssue[];
  height?: string;
  center?: [number, number];
  zoom?: number;
  interactiveSelect?: boolean;
  selectedPosition?: [number, number];
  onLocationSelect?: (lat: number, lng: number, accuracy?: number) => void;
  defaultLayer?: MapLayerType;
  showLayerToggle?: boolean;
  showLocateButton?: boolean;
  showCoordsHUD?: boolean;
  autoLocateOnLoad?: boolean;
  className?: string;
}

const DynamicMap = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full glass-panel flex flex-col items-center justify-center text-slate-400 text-xs gap-2 p-6">
      <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
      <span className="font-semibold text-slate-300">Loading high-resolution satellite map...</span>
    </div>
  ),
});

export const MapView: React.FC<MapViewProps> = ({
  issues = [],
  height = '500px',
  center = [11.1271, 78.6569], // Central Tamil Nadu
  zoom = 7,
  interactiveSelect = false,
  selectedPosition,
  onLocationSelect,
  defaultLayer = 'satellite',
  showLayerToggle = true,
  showLocateButton = true,
  showCoordsHUD = true,
  autoLocateOnLoad = false,
  className = '',
}) => {
  return (
    <div
      style={{ height }}
      className={`w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative z-0 ${className}`}
    >
      <DynamicMap
        issues={issues}
        center={center}
        zoom={zoom}
        interactiveSelect={interactiveSelect}
        selectedPosition={selectedPosition}
        onLocationSelect={onLocationSelect}
        defaultLayer={defaultLayer}
        showLayerToggle={showLayerToggle}
        showLocateButton={showLocateButton}
        showCoordsHUD={showCoordsHUD}
        autoLocateOnLoad={autoLocateOnLoad}
      />
    </div>
  );
};

export default MapView;
