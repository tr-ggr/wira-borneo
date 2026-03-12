'use client';

import React, { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Loader2,
  Send,
} from 'lucide-react';
import {
  getDamageReportsControllerFindVisibleQueryKey,
  useDamageReportsControllerCreate,
} from '@wira-borneo/api-client';
import FormLocationMap from '../FormLocationMap';

const DAMAGE_CATEGORIES = [
  'FLOODED_ROAD',
  'COLLAPSED_STRUCTURE',
  'DAMAGED_INFRASTRUCTURE',
] as const;

type DamageCategory = (typeof DAMAGE_CATEGORIES)[number];

interface DamageReportFormProps {
  location: { latitude: number; longitude: number } | null;
  onLocationChange: (loc: { latitude: number; longitude: number }) => void;
  onSuccess?: () => void;
}

interface SubmissionSummary {
  confidenceScore?: number;
  confidenceThreshold?: number;
  reviewStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

function labelForCategory(category: DamageCategory): string {
  return category
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function DamageReportForm({
  location,
  onLocationChange,
  onSuccess,
}: DamageReportFormProps) {
  const queryClient = useQueryClient();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<DamageCategory[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [submissionSummary, setSubmissionSummary] = useState<SubmissionSummary | null>(null);

  const createDamageReport = useDamageReportsControllerCreate({
    mutation: {
      onSuccess: (result) => {
        queryClient.invalidateQueries({
          queryKey: getDamageReportsControllerFindVisibleQueryKey(),
        });

        const payload = result as SubmissionSummary | undefined;
        setSubmissionSummary({
          confidenceScore: payload?.confidenceScore,
          confidenceThreshold: payload?.confidenceThreshold,
          reviewStatus: payload?.reviewStatus,
        });

        setTitle('');
        setDescription('');
        setSelectedCategories([]);
        setPhotoFile(null);
        if (photoPreviewUrl) {
          URL.revokeObjectURL(photoPreviewUrl);
        }
        setPhotoPreviewUrl(null);
        onSuccess?.();
      },
    },
  });

  const toggleCategory = (category: DamageCategory) => {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setPhotoFile(nextFile);

    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }

    if (!nextFile) {
      setPhotoPreviewUrl(null);
      return;
    }

    setPhotoPreviewUrl(URL.createObjectURL(nextFile));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!location) {
      alert('Location is required. Please tag the damage on the map.');
      return;
    }

    if (!photoFile) {
      alert('A photo is required for damage analysis.');
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      alert('Please enter a short title for this damage report.');
      return;
    }

    createDamageReport.mutate({
      data: {
        title: trimmedTitle,
        description: description.trim() || undefined,
        latitude: location.latitude,
        longitude: location.longitude,
        damageCategories:
          selectedCategories.length > 0 ? selectedCategories : undefined,
        photo: photoFile,
      },
    });
  };

  const isValid = Boolean(location && title.trim() && photoFile);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up">
      {submissionSummary ? (
        <div className="rounded-2xl border border-wira-teal/20 bg-wira-teal/5 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 text-wira-teal" size={18} />
            <div className="space-y-1 text-sm text-wira-earth">
              <p className="font-display font-bold text-wira-teal">Damage report submitted</p>
              <p>
                Confidence:{' '}
                {submissionSummary.confidenceScore != null
                  ? `${Math.round(submissionSummary.confidenceScore * 100)}%`
                  : 'mocked'}
                {submissionSummary.confidenceThreshold != null
                  ? `, threshold ${Math.round(submissionSummary.confidenceThreshold * 100)}%`
                  : ''}
                .
              </p>
              <p>
                Status:{' '}
                {submissionSummary.reviewStatus === 'APPROVED'
                  ? 'auto-approved'
                  : submissionSummary.reviewStatus === 'PENDING'
                    ? 'pending admin review'
                    : submissionSummary.reviewStatus?.toLowerCase() ?? 'submitted'}
                .
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        <label className="block space-y-2">
          <span className="form-label">Short title</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Bridge access road submerged"
            className="form-input-placeholder w-full rounded-xl border border-wira-ivory-dark bg-wira-ivory-dark/30 p-4 text-sm font-body text-wira-night focus:outline-none focus:ring-2 focus:ring-wira-teal/20"
            required
            maxLength={200}
          />
        </label>

        <label className="block space-y-2">
          <span className="form-label">Damage details (optional)</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe what is damaged and what access is affected..."
            className="form-input-placeholder min-h-[96px] w-full rounded-xl border border-wira-ivory-dark bg-wira-ivory-dark/30 p-4 text-sm font-body text-wira-night focus:outline-none focus:ring-2 focus:ring-wira-teal/20"
          />
        </label>

        <div className="space-y-2">
          <span className="form-label">Damage category hints</span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {DAMAGE_CATEGORIES.map((category) => {
              const isActive = selectedCategories.includes(category);
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={`rounded-xl border px-4 py-3 text-xs font-bold uppercase tracking-wide transition-all ${
                    isActive
                      ? 'border-wira-teal bg-wira-teal text-white shadow-md'
                      : 'border-wira-ivory-dark bg-white text-wira-earth hover:border-wira-teal/30'
                  }`}
                >
                  {labelForCategory(category)}
                </button>
              );
            })}
          </div>
          <p className="text-xs font-body text-wira-earth/60">
            These help the mock AI seed the report for now. The real CV model can replace this later.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-wira-gold/20 bg-wira-gold/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="form-label">Photo evidence</p>
              <p className="text-xs font-body text-wira-earth/60">
                Required for AI damage detection and confidence scoring.
              </p>
            </div>
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-wira-gold bg-white px-4 py-3 text-xs font-bold uppercase tracking-wide text-wira-earth transition-all hover:bg-wira-gold hover:text-white"
            >
              <Camera size={16} />
              {photoFile ? 'Change Photo' : 'Add Photo'}
            </button>
          </div>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoSelect}
          />

          {photoPreviewUrl ? (
            <img
              src={photoPreviewUrl}
              alt="Selected damage report"
              className="h-48 w-full rounded-xl object-cover"
            />
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-wira-gold/30 bg-white/50 p-4 text-sm text-wira-earth/60">
              <AlertCircle size={16} className="text-wira-gold" />
              No photo selected yet.
            </div>
          )}
        </div>

        <FormLocationMap
          location={location}
          onLocationChange={onLocationChange}
          label="Damage location"
        />
      </div>

      <button
        type="submit"
        disabled={createDamageReport.isPending || !isValid}
        className="wira-btn-primary flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-display font-bold uppercase tracking-widest shadow-lg shadow-wira-teal/20 transition-all disabled:cursor-not-allowed disabled:opacity-50"
      >
        {createDamageReport.isPending ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Send size={18} />
            Submit Damage Report
          </>
        )}
      </button>

      {createDamageReport.isError ? (
        <div className="rounded-xl border border-status-critical/20 bg-status-critical/5 p-4 text-sm text-status-critical">
          Failed to submit damage report:{' '}
          {createDamageReport.error instanceof Error
            ? createDamageReport.error.message
            : 'Unknown error'}
        </div>
      ) : null}
    </form>
  );
}