'use client';

import React, { useEffect, useState } from 'react';
import { MapView } from '../../components/MapView';
import api from '../../services/api';
import { IIssue } from '../../types';
import {
  MapPin,
  Filter,
  Navigation,
  Loader2,
  Compass,
  Search,
  Satellite,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const TN_REGIONS: { name: string; icon: string; center: [number, number]; zoom: number }[] = [
  { name: 'Entire Tamil Nadu', icon: '🌟', center: [11.1271, 78.6569], zoom: 7 },
  { name: 'Chennai', icon: '🏙️', center: [13.0827, 80.2707], zoom: 12 },
  { name: 'Coimbatore', icon: '🏭', center: [11.0168, 76.9558], zoom: 12 },
  { name: 'Madurai', icon: '🏛️', center: [9.9252, 78.1198], zoom: 12 },
  { name: 'Tiruchirappalli', icon: '🏰', center: [10.7905, 78.7047], zoom: 12 },
  { name: 'Salem', icon: '⛰️', center: [11.6643, 78.1460], zoom: 12 },
  { name: 'Tirunelveli', icon: '🌾', center: [8.7139, 77.7567], zoom: 12 },
  { name: 'Vellore', icon: '🛡️', center: [12.9165, 79.1325], zoom: 12 },
  { name: 'Erode', icon: '🧵', center: [11.3410, 77.7172], zoom: 12 },
  { name: 'Thanjavur', icon: '🌾', center: [10.7870, 79.1378], zoom: 12 },
];

export default function CityMapPage() {
  const toast = useToast();
  const [issues, setIssues] = useState<IIssue[]>([]);
  const [category, setCategory] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([11.1271, 78.6569]);
  const [mapZoom, setMapZoom] = useState<number>(7);
  const [activeRegion, setActiveRegion] = useState<string>('Entire Tamil Nadu');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

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

  const handleRegionSelect = (region: (typeof TN_REGIONS)[0]) => {
    setActiveRegion(region.name);
    setMapCenter(region.center);
    setMapZoom(region.zoom);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);
        setMapCenter([lat, lng]);
        setMapZoom(17); // Zoom right to street/satellite view
        setActiveRegion('My Exact GPS Location');
        setGpsAccuracy(acc);
        setIsLocating(false);
        toast.success(`Live GPS location found! (±${acc}m accuracy)`);
      },
      (err) => {
        console.warn('High-accuracy GPS failed, trying fallback...', err);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setMapCenter([lat, lng]);
            setMapZoom(16);
            setActiveRegion('My Location');
            setIsLocating(false);
            toast.success('Current location detected.');
          },
          (fallbackErr) => {
            setIsLocating(false);
            toast.error('Could not determine current location. Please check browser permissions.');
          },
          { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSearchPlace = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + ', Tamil Nadu, India'
        )}&limit=1`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          setMapCenter([lat, lng]);
          setMapZoom(16);
          setActiveRegion(data[0].name || searchQuery);
          toast.success(`Focused on ${data[0].display_name.split(',')[0]}`);
        } else {
          toast.error('Location not found. Try entering city, area or landmark.');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to search location.');
    } finally {
      setIsSearching(false);
    }
  };

  const fetchMapIssues = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '150' });
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

  useEffect(() => {
    fetchMapIssues();
  }, [category, status]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <Satellite className="w-7 h-7 text-sky-400" />
            Tamil Nadu High-Resolution Satellite & Civic Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time state-wide satellite view of community complaints with live GPS pinpointing. ({issues.length} active pins)
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

      {/* District & Region Quick Jump Pills */}
      <div className="glass-panel p-3 rounded-2xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-300">
            <Compass className="w-3.5 h-3.5 text-sky-400" /> Quick Focus:
          </div>
          {gpsAccuracy !== null && (
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-800/60">
              🎯 GPS Accuracy: ±{gpsAccuracy}m
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {TN_REGIONS.map((r) => {
            const isSelected = activeRegion === r.name;
            return (
              <button
                key={r.name}
                type="button"
                onClick={() => handleRegionSelect(r)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-sky-500 text-white font-bold shadow-md shadow-sky-500/25'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <span>{r.icon}</span>
                <span>{r.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap flex-1 min-w-[280px]">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Filter className="w-4 h-4 text-sky-400" /> Filters:
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

          {/* Place Search form */}
          <form onSubmit={handleSearchPlace} className="flex items-center gap-1.5 flex-1 max-w-xs">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Jump to area, street, landmark..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl glass-input text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs shrink-0"
              title="Search Area"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            </button>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchMapIssues}
            disabled={loading}
            className="p-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh map pins"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          {/* Locate Me Button */}
          <button
            onClick={handleLocateMe}
            disabled={isLocating}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all shrink-0"
          >
            {isLocating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Locating GPS...</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5" />
                <span>Locate My Area</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Full Map with Satellite View Default */}
      <div className="relative">
        <MapView
          issues={issues}
          height="680px"
          center={mapCenter}
          zoom={mapZoom}
          defaultLayer="satellite"
          showLayerToggle={true}
          showLocateButton={true}
          showCoordsHUD={true}
        />
      </div>
    </div>
  );
}
