'use client';

import React, { useEffect, useState } from 'react';
import { MapView } from '../../components/MapView';
import api from '../../services/api';
import { IIssue } from '../../types';
import { MapPin, Filter, Navigation, Loader2 } from 'lucide-react';

export default function CityMapPage() {
  const [issues, setIssues] = useState<IIssue[]>([]);
  const [category, setCategory] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([13.0827, 80.2707]);
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const categories = [
    'Roads',
    'Garbage',
    'Drainage',
    'Water',
    'Electricity',
    'Street Lights',
    'Traffic',
    'Public Property',
    'Sanitation',
    'Other',
  ];

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMapCenter([pos.coords.latitude, pos.coords.longitude]);
        setMapZoom(15);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    const fetchMapIssues = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: '100' });
        if (category) params.append('category', category);
        if (status) params.append('status', status);

        const res = await api.get(`/issues?${params.toString()}`);
        if (res.data.success) {
          setIssues(res.data.issues || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMapIssues();
  }, [category, status]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <MapPin className="w-7 h-7 text-sky-400" />
            City-Wide Location Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time geolocation map of reported complaints categorized by priority markers. ({issues.length} active pins)
          </p>
        </div>

        {/* Priority Legend */}
        <div className="flex items-center gap-3 glass-panel px-3 py-1.5 rounded-xl text-[11px] font-semibold border border-slate-800">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Low
          </span>
          <span className="flex items-center gap-1 text-sky-400">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Medium
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> High
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Critical
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Filter className="w-4 h-4 text-sky-400" /> Filter Map:
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 rounded-xl glass-input text-xs bg-slate-900"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 rounded-xl glass-input text-xs bg-slate-900"
          >
            <option value="">All Statuses</option>
            <option value="reported">Reported</option>
            <option value="verified">Verified</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Locate Me Button */}
        <button
          onClick={handleLocateMe}
          disabled={isLocating}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white flex items-center gap-1.5 shadow-md transition-all shrink-0"
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5" />
          )}
          <span>Locate My Area</span>
        </button>
      </div>

      {/* Full Map */}
      <div className="relative">
        <MapView issues={issues} height="650px" center={mapCenter} zoom={mapZoom} />
      </div>
    </div>
  );
}
