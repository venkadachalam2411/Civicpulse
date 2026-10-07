'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { MapView } from '../../components/MapView';
import { IIssue } from '../../types';
import {
  PlusCircle,
  Lightbulb,
  AlertTriangle,
  Upload,
  MapPin,
  CheckCircle2,
  ThumbsUp,
  ShieldAlert,
  Navigation,
  Search,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export default function ReportIssuePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Roads');
  const [severity, setSeverity] = useState('medium');
  const [location, setLocation] = useState('Chennai Central, Sector 2');
  const [latitude, setLatitude] = useState(13.0827);
  const [longitude, setLongitude] = useState(80.2707);
  const [mapZoom, setMapZoom] = useState(13);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // GPS & Location state
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Smart Features state
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    isDuplicate: boolean;
    matchedIssue?: IIssue;
    similarityScore: number;
    distanceKm: number;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

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

  // Smart Category Suggestion trigger
  useEffect(() => {
    if (description.length > 5) {
      const timer = setTimeout(() => {
        api
          .post('/issues/suggest-category', { title, description })
          .then((res) => {
            if (res.data.success && res.data.suggestedCategory && res.data.suggestedCategory !== category) {
              setSuggestedCategory(res.data.suggestedCategory);
            } else {
              setSuggestedCategory(null);
            }
          })
          .catch((e) => console.error(e));
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSuggestedCategory(null);
    }
  }, [title, description]);

  // Duplicate Issue Detection trigger
  useEffect(() => {
    if (title.length > 5 && description.length > 10) {
      const timer = setTimeout(() => {
        api
          .post('/issues/check-duplicate', { title, description, category, latitude, longitude })
          .then((res) => {
            if (res.data.success && res.data.isDuplicate) {
              setDuplicateWarning(res.data);
            } else {
              setDuplicateWarning(null);
            }
          })
          .catch((e) => console.error(e));
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setDuplicateWarning(null);
    }
  }, [title, description, category, latitude, longitude]);

  // Reverse Geocoding Helper
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const mainParts = [
            addr.building || addr.amenity || addr.shop || '',
            addr.road || addr.street || addr.pedestrian || '',
            addr.neighbourhood || addr.suburb || addr.residential || '',
            addr.city || addr.town || addr.village || addr.county || '',
            addr.postcode || '',
          ]
            .map((p) => (typeof p === 'string' ? p.trim() : ''))
            .filter((p) => p.length > 0);

          const formatted = mainParts.length > 0 ? mainParts.join(', ') : data.display_name;
          if (formatted) {
            setLocation(formatted);
          }
        }
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  // GPS Exact Location Handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng, accuracy: acc } = position.coords;
        setLatitude(lat);
        setLongitude(lng);
        setAccuracy(Math.round(acc));
        setMapZoom(16);
        setIsLocating(false);
        toast.success(`Exact GPS location locked! (±${Math.round(acc)}m accuracy)`);
        reverseGeocode(lat, lng);
      },
      (err) => {
        setIsLocating(false);
        let errorText = 'Unable to retrieve exact location.';
        if (err.code === err.PERMISSION_DENIED) {
          errorText = 'Location permission was denied. Please allow location access in your browser or select on the map.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorText = 'GPS signal unavailable. Please pinpoint your location directly on the map.';
        } else if (err.code === err.TIMEOUT) {
          errorText = 'Location request timed out. Please retry or click on the map.';
        }
        setLocationError(errorText);
        toast.error(errorText);
      },
      geoOptions
    );
  };

  // Search Address (Forward Geocode)
  const handleSearchAddress = async () => {
    if (!location.trim()) {
      toast.info('Please enter an address or landmark to search.');
      return;
    }
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const foundLat = parseFloat(results[0].lat);
          const foundLng = parseFloat(results[0].lon);
          setLatitude(foundLat);
          setLongitude(foundLng);
          setMapZoom(16);
          setAccuracy(null);
          toast.success('Location found on map!');
        } else {
          toast.error('Could not pinpoint that exact address. Try moving the map pin directly.');
        }
      }
    } catch (err) {
      console.error('Search address error:', err);
      toast.error('Address search failed.');
    } finally {
      setIsGeocoding(false);
    }
  };

  // Interactive Map Pin / Drag selection
  const handleMapLocationSelect = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setAccuracy(null);
    reverseGeocode(lat, lng);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArr]);

      const newPreviews = filesArr.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.info('Please sign in to report a complaint.');
      router.push('/login');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('severity', severity);
      formData.append('location', location);
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());

      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      const res = await api.post('/issues', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success && res.data.issue) {
        toast.success('Complaint submitted successfully!');
        router.push(`/issues/${res.data.issue._id}`);
      } else {
        setErrorMsg(res.data.message || 'Failed to submit complaint.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Error creating issue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvoteExisting = async (issueId: string) => {
    if (!user) {
      toast.info('Please sign in to upvote.');
      return;
    }
    try {
      await api.post(`/issues/${issueId}/upvote`);
      toast.success('Upvoted existing complaint! Redirecting to issue page...');
      router.push(`/issues/${issueId}`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to upvote complaint.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-black text-white flex items-center gap-2">
          <PlusCircle className="w-8 h-8 text-sky-400" />
          Report a Community Issue
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Submit details and photos of local infrastructure, sanitation, or safety problems for priority resolution.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Duplicate Issue Warning Alert */}
      {duplicateWarning && duplicateWarning.matchedIssue && (
        <div className="glass-card p-5 rounded-2xl border border-amber-500/40 bg-amber-950/20 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>⚠️ Possible Duplicate Issue Detected Nearby!</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            A similar issue has already been reported ({duplicateWarning.distanceKm} km away, {duplicateWarning.similarityScore}% match).
          </p>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono text-sky-400 font-bold">
                {duplicateWarning.matchedIssue.issueId}
              </span>
              <h4 className="text-xs font-bold text-white">{duplicateWarning.matchedIssue.title}</h4>
              <p className="text-[11px] text-slate-400">{duplicateWarning.matchedIssue.location}</p>
            </div>
            <button
              type="button"
              onClick={() => handleUpvoteExisting(duplicateWarning.matchedIssue!._id)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-white flex items-center gap-1.5 shadow-md shrink-0"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              Upvote Existing
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Issue Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Large pothole near college gate"
            className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Detailed Description *</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the problem, severity, location landmarks, and safety concerns..."
            className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
          />
        </div>

        {/* Smart Category Suggestion Chip */}
        {suggestedCategory && (
          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-sky-300">
              <Lightbulb className="w-4 h-4 text-sky-400" />
              <span>
                Smart Suggestion: Recommended category is <strong className="text-white font-bold">{suggestedCategory}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setCategory(suggestedCategory);
                setSuggestedCategory(null);
              }}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-sky-500 text-white hover:bg-sky-400"
            >
              Apply {suggestedCategory}
            </button>
          </div>
        )}

        {/* Category & Severity Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl glass-input text-xs bg-slate-900"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Severity Level *</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl glass-input text-xs bg-slate-900"
            >
              <option value="low">Low (Minor inconvenience)</option>
              <option value="medium">Medium (Moderate impact)</option>
              <option value="high">High (Urgent disruption)</option>
              <option value="critical">Critical (Immediate safety hazard)</option>
            </select>
          </div>
        </div>

        {/* Location & GPS Geolocation Card */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sky-400" /> Exact Incident Location *
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Click &apos;Use Current Location&apos; for instant high-accuracy GPS or pinpoint on the map.
              </p>
            </div>

            {/* Primary "Use Current Location" button */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg ${
                isLocating
                  ? 'bg-sky-700 text-sky-200 cursor-wait'
                  : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-sky-500/25 hover:shadow-sky-500/40'
              }`}
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Locking Exact GPS...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 text-white animate-pulse" />
                  <span>Use Current Location (GPS)</span>
                </>
              )}
            </button>
          </div>

          {/* GPS Accuracy Status Badge */}
          {accuracy !== null && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                <strong>Exact GPS Locked:</strong> Accuracy within ±{accuracy} meters
              </span>
            </div>
          )}

          {locationError && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{locationError}</span>
            </div>
          )}

          {/* Address / Landmark Input with Search Button */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Street Address / Landmark (Auto-filled or edit manually)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchAddress();
                    }
                  }}
                  placeholder="e.g. 124 Anna Salai, near Metro Gate 3"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-xs"
                />
                {isGeocoding && (
                  <div className="absolute right-3 top-2.5 flex items-center gap-1.5 text-[10px] text-sky-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Resolving address...</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleSearchAddress}
                disabled={isGeocoding}
                className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 shrink-0 transition-colors"
                title="Find address on map"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Find on Map</span>
              </button>
            </div>
          </div>

          {/* Interactive Leaflet Map */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                Click anywhere on map or drag the blue pin to fine-tune exact spot
              </span>
              <span className="font-mono text-slate-300">
                Lat: {latitude.toFixed(5)}, Lng: {longitude.toFixed(5)}
              </span>
            </div>

            <MapView
              issues={[]}
              height="300px"
              center={[latitude, longitude]}
              zoom={mapZoom}
              interactiveSelect={true}
              selectedPosition={[latitude, longitude]}
              onLocationSelect={handleMapLocationSelect}
            />
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Upload Photos of Issue</label>
          <div className="border-2 border-dashed border-slate-700/60 hover:border-sky-500/50 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-900/40 relative">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Upload className="w-8 h-8 text-sky-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-200">Click or drag photos here to attach</p>
            <p className="text-[11px] text-slate-500 mt-1">Supports JPG, PNG, WEBP up to 10MB each</p>
          </div>

          {/* Previews */}
          {imagePreviews.length > 0 && (
            <div className="flex items-center gap-3 mt-3 overflow-x-auto pb-2">
              {imagePreviews.map((src, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700 shrink-0">
                  <img src={src} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 rounded-2xl font-bold text-sm bg-sky-500 hover:bg-sky-400 text-white shadow-xl shadow-sky-500/25 transition-all flex items-center justify-center gap-2"
        >
          {submitting ? (
            <span>Registering Complaint...</span>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" /> Submit Complaint (Generate Issue ID)
            </>
          )}
        </button>
      </form>
    </div>
  );
}
