'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  getAdminOperationsControllerPinStatusesQueryKey,
  useAdminOperationsControllerPinStatuses,
  useAdminOperationsControllerReviewPin,
} from '@wira-borneo/api-client';
import { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Search, XCircle } from 'lucide-react';
import {
  countByModerationStatus,
  filterPins,
  getPinModerationStatus,
  type ModerationFilter,
} from './pin-queue.utils';

type QueuePin = {
  id: string;
  title: string;
  hazardType: 'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK';
  status: 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED';
  latitude: number;
  longitude: number;
  region?: string | null;
  note?: string | null;
  photoUrl?: string | null;
  reporter?: { name: string } | null;
  reportedAt?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  reviewStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
};

function toPins(raw: unknown): QueuePin[] {
  if (Array.isArray(raw)) {
    return raw as QueuePin[];
  }

  if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: QueuePin[] }).data;
  }

  return [];
}

function statusBadgeClass(status: ReturnType<typeof getPinModerationStatus>): string {
  if (status === 'APPROVED') return 'bg-emerald-50 text-emerald-700';
  if (status === 'REJECTED') return 'bg-rose-50 text-rose-700';
  return 'bg-amber-50 text-amber-700';
}

function fmtDate(value?: string | null): string {
  if (!value) {
    return 'N/A';
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }

  return new Date(timestamp).toLocaleString();
}

function fmtHazard(value: QueuePin['hazardType']): string {
  return value.replaceAll('_', ' ').toLowerCase();
}

const STATUS_FILTERS: ModerationFilter[] = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

export function PinReviewQueuePage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ModerationFilter>('PENDING');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewReason, setReviewReason] = useState<Record<string, string>>({});
  const [inlineError, setInlineError] = useState<Record<string, string>>({});

  const pinsQuery = useAdminOperationsControllerPinStatuses({
    query: {
      select: (response) => toPins(response),
    },
  });

  const reviewPinMutation = useAdminOperationsControllerReviewPin({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getAdminOperationsControllerPinStatusesQueryKey(),
        });
        setReviewReason({});
        setInlineError({});
      },
    },
  });

  const pins = pinsQuery.data ?? [];
  const counts = useMemo(() => countByModerationStatus(pins), [pins]);

  const filteredPins = useMemo(() => {
    return filterPins(pins, statusFilter, search).sort((left, right) => {
      const leftStatus = getPinModerationStatus(left);
      const rightStatus = getPinModerationStatus(right);
      const leftRank = leftStatus === 'PENDING' ? 0 : leftStatus === 'APPROVED' ? 1 : 2;
      const rightRank = rightStatus === 'PENDING' ? 0 : rightStatus === 'APPROVED' ? 1 : 2;
      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      const leftTime = Date.parse(left.reportedAt ?? '') || 0;
      const rightTime = Date.parse(right.reportedAt ?? '') || 0;
      return rightTime - leftTime;
    });
  }, [pins, statusFilter, search]);

  const applyReview = (pin: QueuePin, action: 'APPROVE' | 'REJECT') => {
    if (action === 'REJECT' && !(reviewReason[pin.id] ?? '').trim()) {
      setInlineError((current) => ({
        ...current,
        [pin.id]: 'Rejection reason is required.',
      }));
      return;
    }

    setInlineError((current) => {
      if (!current[pin.id]) {
        return current;
      }
      const next = { ...current };
      delete next[pin.id];
      return next;
    });

    reviewPinMutation.mutate({
      id: pin.id,
      data: {
        action,
        reason: action === 'REJECT' ? reviewReason[pin.id]?.trim() : undefined,
      },
    });
  };

  if (pinsQuery.isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center p-8">
        <div className="space-y-3 text-center text-slate-500">
          <div className="mx-auto h-12 w-12 rounded-full border-4 border-slate-200 border-t-amber-500 animate-spin" />
          <p>Loading hazard pin moderation queue...</p>
        </div>
      </div>
    );
  }

  if (pinsQuery.isError) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-2 p-8 text-rose-500">
        <XCircle size={42} />
        <p className="font-bold">Failed to load hazard pins</p>
      </div>
    );
  }

  return (
    <section className="page-shell">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Hazard Pin Moderation</h1>
          <p className="text-slate-500">
            Review community hazard pins and track pending manual queue decisions.
          </p>
          <div className="flex flex-wrap gap-2 pt-1 text-xs font-bold uppercase tracking-wide">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">Pending {counts.PENDING}</span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">Approved {counts.APPROVED}</span>
            <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-800">Rejected {counts.REJECTED}</span>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, reporter, note, region, or pin ID..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 shadow-sm outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                  statusFilter === value
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredPins.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
              No pins match the current filters.
            </div>
          ) : (
            filteredPins.map((pin) => {
              const moderationStatus = getPinModerationStatus(pin);
              const expanded = expandedId === pin.id;
              const reason = reviewReason[pin.id] ?? '';
              const reportedAt = fmtDate(pin.reportedAt);
              const reviewedAt = fmtDate(pin.reviewedAt);

              return (
                <article
                  key={pin.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : pin.id)}
                    className="grid w-full grid-cols-1 gap-4 p-5 text-left md:grid-cols-[1.3fr_1fr_auto] md:items-center"
                  >
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-slate-900">{pin.title}</h2>
                      <p className="text-sm text-slate-500">
                        Reporter: {pin.reporter?.name ?? 'Unknown'} | Hazard: {fmtHazard(pin.hazardType)}
                      </p>
                      <p className="text-xs text-slate-500">Operational state: {pin.status}</p>
                    </div>

                    <div className="space-y-1 text-sm text-slate-600">
                      <p>Lat {pin.latitude.toFixed(4)}, Lon {pin.longitude.toFixed(4)}</p>
                      <p>Region: {pin.region ?? 'N/A'}</p>
                      <p>Reported: {reportedAt}</p>
                    </div>

                    <div className="flex items-center justify-start md:justify-end">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusBadgeClass(
                          moderationStatus,
                        )}`}
                      >
                        {moderationStatus === 'PENDING' ? <Clock size={14} /> : null}
                        {moderationStatus === 'APPROVED' ? <CheckCircle2 size={14} /> : null}
                        {moderationStatus === 'REJECTED' ? <XCircle size={14} /> : null}
                        {moderationStatus}
                      </span>
                    </div>
                  </button>

                  {expanded ? (
                    <div className="grid gap-5 border-t border-slate-100 p-5 md:grid-cols-[280px_1fr]">
                      <div className="space-y-3">
                        {pin.photoUrl ? (
                          <img
                            src={pin.photoUrl}
                            alt={pin.title}
                            className="h-64 w-full rounded-xl object-cover"
                          />
                        ) : (
                          <div className="flex h-64 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">
                            No photo attached
                          </div>
                        )}
                        <p className="text-xs text-slate-500">Pin ID: {pin.id}</p>
                      </div>

                      <div className="space-y-4">
                        {pin.note ? (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Reporter note</p>
                            <p className="text-sm text-slate-700">{pin.note}</p>
                          </div>
                        ) : null}

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Review status</p>
                            <p className="text-sm text-slate-800">{moderationStatus}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Reviewed at</p>
                            <p className="text-sm text-slate-800">{reviewedAt}</p>
                          </div>
                        </div>

                        {pin.reviewNote ? (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Review note</p>
                            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{pin.reviewNote}</p>
                          </div>
                        ) : null}

                        {moderationStatus === 'PENDING' ? (
                          <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                            <p className="text-sm font-semibold text-amber-900">Manual review action</p>
                            <textarea
                              value={reason}
                              onChange={(event) =>
                                setReviewReason((current) => ({
                                  ...current,
                                  [pin.id]: event.target.value,
                                }))
                              }
                              rows={3}
                              placeholder="Reason is required only when rejecting."
                              className="w-full rounded-lg border border-amber-200 bg-white p-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                            />
                            {inlineError[pin.id] ? (
                              <p className="text-xs font-semibold text-rose-600">{inlineError[pin.id]}</p>
                            ) : null}
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={reviewPinMutation.isPending}
                                onClick={() => applyReview(pin, 'APPROVE')}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={reviewPinMutation.isPending}
                                onClick={() => applyReview(pin, 'REJECT')}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
