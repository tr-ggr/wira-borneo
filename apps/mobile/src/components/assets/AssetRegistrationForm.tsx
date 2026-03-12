'use client';

import React, { useRef, useState } from 'react';
import { 
  Car, 
  Truck, 
  Anchor, 
  Wrench, 
  MapPin, 
  Camera, 
  ChevronLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  useAssetsControllerCreateAsset, 
  getAssetsControllerListMyAssetsQueryKey,
  useAuthControllerGetSession
} from '@wira-borneo/api-client';
import { useQueryClient } from '@tanstack/react-query';

type AssetCategory = 'vehicle' | 'equipment' | 'maritime' | 'other';

interface AssetRegistrationFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function AssetRegistrationForm({ onClose, onSuccess }: AssetRegistrationFormProps) {
  const { data: session } = useAuthControllerGetSession();
  const queryClient = useQueryClient();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<AssetCategory>('vehicle');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  const createAsset = useAssetsControllerCreateAsset({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAssetsControllerListMyAssetsQueryKey() });
        if (onSuccess) onSuccess();
        onClose();
      },
    },
  });

  const handleSetLocation = () => {
    if (!('geolocation' in navigator)) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true }
    );
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setPhotoFile(selected);

    if (!selected) {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
      setPhotoPreviewUrl(null);
      return;
    }

    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }

    const objectUrl = URL.createObjectURL(selected);
    setPhotoPreviewUrl(objectUrl);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;
    
    createAsset.mutate({
      params: { userId: session.user.id },
      data: {
        name,
        description: `[${category.toUpperCase()}] ${description}`,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        photo: photoFile ?? undefined,
      },
    });
  };

  if (createAsset.isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 rounded-full bg-status-safe/20 flex items-center justify-center text-status-safe">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-2xl font-sagip font-bold text-sagip-heading">Registration Submitted</h2>
        <p className="text-sagip-muted max-w-xs">
          Your asset registration is pending review by the admin. It will appear globally once approved.
        </p>
        <button
          onClick={onClose}
          className="w-full py-4 bg-asean-blue text-white font-sagip font-bold rounded-xl shadow-lg active:scale-95 transition-all"
        >
          DONE
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--sagip-bg)] animate-in slide-in-from-bottom duration-300">
      <header className="px-4 py-6 flex items-center gap-4">
        <button onClick={onClose} className="p-2 -ml-2 text-sagip-muted hover:text-asean-blue transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-sagip font-bold text-sagip-heading">Register Asset</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 px-4 pb-24 space-y-6 overflow-y-auto">
        {/* Category Selection */}
        <section className="space-y-3">
          <p className="font-sagip font-bold text-[10px] uppercase tracking-wider text-sagip-muted">
            Asset Category
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'vehicle', label: 'Vehicle', icon: Truck },
              { id: 'maritime', label: 'Maritime', icon: Anchor },
              { id: 'equipment', label: 'Equipment', icon: Wrench },
              { id: 'other', label: 'Other', icon: Car },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id as AssetCategory)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  category === cat.id 
                    ? 'bg-asean-blue/10 border-asean-blue text-asean-blue' 
                    : 'bg-white border-sagip-border text-sagip-muted grayscale opacity-70'
                }`}
              >
                <cat.icon size={28} />
                <span className="mt-2 font-sagip font-bold text-xs uppercase tracking-wide">{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Details */}
        <section className="space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-sagip font-bold text-[10px] uppercase tracking-wider text-sagip-muted">
              Asset Name
            </span>
            <input
              required
              className="w-full bg-white border border-sagip-border rounded-xl p-4 font-body text-sagip-heading outline-none focus:ring-2 focus:ring-asean-blue/30 focus:border-asean-blue transition-all"
              placeholder="e.g. 4x4 Off-road Truck, Speedboat..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-sagip font-bold text-[10px] uppercase tracking-wider text-sagip-muted">
              Description & Specifications
            </span>
            <textarea
              required
              rows={3}
              className="w-full bg-white border border-sagip-border rounded-xl p-4 font-body text-sagip-heading outline-none focus:ring-2 focus:ring-asean-blue/30 focus:border-asean-blue transition-all"
              placeholder="Provide details about capacity, equipment, or availability..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
        </section>

        {/* Location & Photo */}
        <section className="space-y-3">
          <p className="font-sagip font-bold text-[10px] uppercase tracking-wider text-sagip-muted">
            Standard Operating Base
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSetLocation}
              disabled={isLocating}
              className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl font-sagip font-bold text-sm transition-all ${
                latitude ? 'bg-status-safe/10 text-status-safe border border-status-safe/30' : 'bg-asean-blue/5 text-asean-blue hover:bg-asean-blue/10'
              }`}
            >
              <MapPin size={18} />
              {isLocating ? 'Locating...' : latitude ? 'Location Saved' : 'TAG CURRENT LOCATION'}
            </button>
            <button
              type="button"
              className={`p-4 rounded-xl transition-all ${photoFile ? 'bg-asean-blue/10 text-asean-blue border border-asean-blue/30' : 'bg-sagip-border/20 text-sagip-muted hover:bg-sagip-border/30'}`}
              title={photoFile ? photoFile.name : 'Attach asset photo'}
              onClick={() => photoInputRef.current?.click()}
            >
              <Camera size={20} />
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>
          {latitude && (
            <p className="text-[10px] font-mono text-sagip-muted text-center pt-1">
              {latitude.toFixed(6)}, {longitude?.toFixed(6)}
            </p>
          )}
          {photoPreviewUrl && (
            <div className="rounded-xl border border-sagip-border bg-white p-2">
              <img
                src={photoPreviewUrl}
                alt="Selected asset"
                className="h-36 w-full rounded-lg object-cover"
              />
            </div>
          )}
        </section>

        {/* Submit */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={createAsset.isPending || !name}
            className="w-full py-5 bg-asean-blue text-white font-sagip font-bold text-sm uppercase tracking-widest rounded-xl shadow-xl shadow-asean-blue/20 hover:bg-navy-900 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {createAsset.isPending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'REGISTER VOLUNTEER ASSET'
            )}
          </button>
          
          {createAsset.isError && (
            <div className="mt-4 p-4 rounded-lg bg-status-critical/10 text-status-critical flex items-start gap-2 text-sm animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>Registration failed: {createAsset.error instanceof Error ? createAsset.error.message : 'Unknown error'}</p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
