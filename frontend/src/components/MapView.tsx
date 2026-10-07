'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { IIssue } from '../types';

interface MapViewProps {
  issues: IIssue[];
  height?: string;
  center?: [number, number];
  zoom?: number;
  interactiveSelect?: boolean;
  selectedPosition?: [number, number];
  onLocationSelect?: (lat: number, lng: number) => void;
}

const DynamicMap = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full glass-panel flex items-center justify-center text-slate-400 text-sm">
      Loading interactive civic map...
    </div>
  ),
});

export const MapView: React.FC<MapViewProps> = ({
  issues,
  height = '500px',
  center = [13.0827, 80.2707],
  zoom = 12,
  interactiveSelect = false,
  selectedPosition,
  onLocationSelect,
}) => {
  return (
    <div style={{ height }} className="w-full rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative z-0">
      <DynamicMap
        issues={issues}
        center={center}
        zoom={zoom}
        interactiveSelect={interactiveSelect}
        selectedPosition={selectedPosition}
        onLocationSelect={onLocationSelect}
      />
    </div>
  );
};
