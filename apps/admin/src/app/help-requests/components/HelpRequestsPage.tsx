'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  formatUrgencyConfidence,
  getEffectiveUrgency,
  getUrgencyPaletteClasses,
} from './help-requests-urgency.utils';

type HelpRequestStatus = 'OPEN' | 'CLAIMED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
type HelpUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type HazardType = 'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK';
type AssignmentStatus = 'CLAIMED' | 'EN_ROUTE' | 'ON_SITE' | 'COMPLETED' | 'CANCELLED';
type AdminStatusAction = 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';

type ActorSummary = {
  id: string;
  name: string;
  email: string;
};

type HelpAssignment = {
  id: string;
  status: AssignmentStatus;
  assignedAt: string;
  volunteer: ActorSummary;
};

type HelpRequestEvent = {
  id: string;
  previousStatus?: HelpRequestStatus | null;
  nextStatus: HelpRequestStatus;
  note?: string | null;
  createdAt: string;
  actor?: ActorSummary | null;
};

type HelpRequestQueueItem = {
  id: string;
  requesterId: string;
  familyId?: string | null;
  hazardType: HazardType;
  urgency: HelpUrgency;
  predictedUrgency?: HelpUrgency | null;
  urgencyConfidence?: number | null;
  status: HelpRequestStatus;
  description: string;
  latitude: number;
  longitude: number;
  sosExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  requester: ActorSummary;
  assignments: HelpAssignment[];
  events: HelpRequestEvent[];
  latestAssignment?: HelpAssignment | null;
};

const HELP_REQUESTS_QUERY_KEY = ['admin-help-requests'] as const;
const ADMIN_API_BASE = 'http://localhost:3333/api/admin';
const STATUS_FILTERS: Array<'ALL' | HelpRequestStatus> = [
  'ALL',
  'OPEN',
  'CLAIMED',
  'IN_PROGRESS',
  'RESOLVED',
  'CANCELLED',
];
const HAZARD_FILTERS: Array<'ALL' | HazardType> = ['ALL', 'FLOOD', 'TYPHOON', 'EARTHQUAKE', 'AFTERSHOCK'];
const URGENCY_FILTERS: Array<'ALL' | HelpUrgency> = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

async function parseApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = (await response.json()) as { message?: string | string[]; error?: string };
      if (Array.isArray(payload.message)) {
        message = payload.message.join(', ');
      } else if (typeof payload.message === 'string') {
        message = payload.message;
      } else if (typeof payload.error === 'string') {
        message = payload.error;
      }
    } catch {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

async function getHelpRequests(signal?: AbortSignal): Promise<HelpRequestQueueItem[]> {
  const response = await fetch(`${ADMIN_API_BASE}/help-requests`, {
    method: 'GET',
    credentials: 'include',
    signal,
  });

  return parseApiResponse<HelpRequestQueueItem[]>(response);
}

async function updateHelpRequestStatus(input: {
  id: string;
  nextStatus: AdminStatusAction;
  note: string;
}): Promise<HelpRequestQueueItem> {
  const response = await fetch(`${ADMIN_API_BASE}/help-requests/${input.id}/status`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nextStatus: input.nextStatus,
      note: input.note,
    }),
  });

  return parseApiResponse<HelpRequestQueueItem>(response);
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

function isActiveStatus(status: HelpRequestStatus): boolean {
  return status === 'OPEN' || status === 'CLAIMED' || status === 'IN_PROGRESS';
}

function toCsv(items: HelpRequestQueueItem[]): string {
  const headers = [
    'Request ID',
    'Requester',
    'Requester Email',
    'Status',
    'Urgency',
    'Hazard',
    'Description',
    'Latitude',
    'Longitude',
    'Created At',
    'Updated At',
  ];

  const rows = items.map((item) => [
    item.id,
    item.requester?.name ?? 'Unknown',
    item.requester?.email ?? '',
    item.status,
    item.urgency,
    item.hazardType,
    item.description,
    item.latitude,
    item.longitude,
    new Date(item.createdAt).toISOString(),
    new Date(item.updatedAt).toISOString(),
  ]);

  return [
    headers.join(','),
    ...rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
}

export function HelpRequestsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | HelpRequestStatus>('ALL');
  const [hazardFilter, setHazardFilter] = useState<'ALL' | HazardType>('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | HelpUrgency>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionById, setActionById] = useState<Record<string, AdminStatusAction>>({});
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [inlineErrorById, setInlineErrorById] = useState<Record<string, string>>({});

  const helpRequestsQuery = useQuery({
    queryKey: HELP_REQUESTS_QUERY_KEY,
    queryFn: ({ signal }) => getHelpRequests(signal),
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateHelpRequestStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HELP_REQUESTS_QUERY_KEY });
      setInlineErrorById({});
    },
  });

  const requests = helpRequestsQuery.data ?? [];

  const counts = useMemo(() => {
    return {
      total: requests.length,
      OPEN: requests.filter((request) => request.status === 'OPEN').length,
      CLAIMED: requests.filter((request) => request.status === 'CLAIMED').length,
      IN_PROGRESS: requests.filter((request) => request.status === 'IN_PROGRESS').length,
      RESOLVED: requests.filter((request) => request.status === 'RESOLVED').length,
      CANCELLED: requests.filter((request) => request.status === 'CANCELLED').length,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase();

    return requests
      .filter((request) => (statusFilter === 'ALL' ? true : request.status === statusFilter))
      .filter((request) => (hazardFilter === 'ALL' ? true : request.hazardType === hazardFilter))
      .filter((request) => (urgencyFilter === 'ALL' ? true : request.urgency === urgencyFilter))
      .filter((request) => {
        if (!term) {
          return true;
        }

        return [
          request.id,
          request.description,
          request.requester?.name,
          request.requester?.email,
          request.status,
          request.urgency,
          request.hazardType,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      })
      .sort((left, right) => {
        const leftTs = Date.parse(left.createdAt) || 0;
        const rightTs = Date.parse(right.createdAt) || 0;
        return rightTs - leftTs;
      });
  }, [requests, search, statusFilter, hazardFilter, urgencyFilter]);

  const exportCsv = () => {
    if (filteredRequests.length === 0) {
      return;
    }

    const csv = toCsv(filteredRequests);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `help-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const applyStatus = (request: HelpRequestQueueItem) => {
    const nextStatus = actionById[request.id] ?? 'IN_PROGRESS';
    const note = (noteById[request.id] ?? '').trim();

    if (!note) {
      setInlineErrorById((current) => ({
        ...current,
        [request.id]: 'Note is required.',
      }));
      return;
    }

    setInlineErrorById((current) => {
      if (!current[request.id]) {
        return current;
      }
      const next = { ...current };
      delete next[request.id];
      return next;
    });

    updateStatusMutation.mutate({
      id: request.id,
      nextStatus,
      note,
    });
  };

  if (helpRequestsQuery.isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center p-8">
        <div className="space-y-3 text-center text-slate-500">
          <div className="mx-auto h-12 w-12 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin" />
          <p>Loading help requests...</p>
        </div>
      </div>
    );
  }

  if (helpRequestsQuery.isError) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-2 p-8 text-rose-500">
        <p className="text-lg font-bold">Failed to load help requests</p>
        <p className="text-sm text-rose-400">{helpRequestsQuery.error instanceof Error ? helpRequestsQuery.error.message : 'Unknown error'}</p>
      </div>
    );
  }

  return (
    <section className="page-shell">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">User Help Requests</h1>
            <p className="text-slate-500">
              Monitor and update user emergency requests across the full request lifecycle.
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Total {counts.total}</span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">Open {counts.OPEN}</span>
              <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-800">Claimed {counts.CLAIMED}</span>
              <span className="rounded-full bg-orange-100 px-3 py-1 text-orange-800">In Progress {counts.IN_PROGRESS}</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">Resolved {counts.RESOLVED}</span>
              <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-800">Cancelled {counts.CANCELLED}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={exportCsv}
            disabled={filteredRequests.length === 0}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export CSV
          </button>
        </header>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by ID, requester, email, description, status..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'ALL' | HelpRequestStatus)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition-all focus:border-emerald-600"
          >
            {STATUS_FILTERS.map((value) => (
              <option key={value} value={value}>
                Status: {value}
              </option>
            ))}
          </select>

          <select
            value={hazardFilter}
            onChange={(event) => setHazardFilter(event.target.value as 'ALL' | HazardType)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition-all focus:border-emerald-600"
          >
            {HAZARD_FILTERS.map((value) => (
              <option key={value} value={value}>
                Hazard: {value}
              </option>
            ))}
          </select>

          <select
            value={urgencyFilter}
            onChange={(event) => setUrgencyFilter(event.target.value as 'ALL' | HelpUrgency)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition-all focus:border-emerald-600"
          >
            {URGENCY_FILTERS.map((value) => (
              <option key={value} value={value}>
                Urgency: {value}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
              No help requests match the current filters.
            </div>
          ) : (
            filteredRequests.map((request) => {
              const expanded = expandedId === request.id;
              const actionValue = actionById[request.id] ?? 'IN_PROGRESS';
              const note = noteById[request.id] ?? '';
              const canUpdate = isActiveStatus(request.status);
              const latestAssignment = request.latestAssignment ?? request.assignments[0] ?? null;
              const effectiveUrgency = getEffectiveUrgency(request);
              const urgencyPalette = getUrgencyPaletteClasses(effectiveUrgency);
              const confidenceLabel = formatUrgencyConfidence(request.urgencyConfidence);

              return (
                <article
                  key={request.id}
                  className={`overflow-hidden rounded-2xl border border-slate-200 border-l-4 bg-white shadow-sm ${urgencyPalette.card}`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : request.id)}
                    className="grid w-full grid-cols-1 gap-4 p-5 text-left md:grid-cols-[1.4fr_1fr_auto] md:items-center"
                  >
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-slate-900">{request.requester?.name ?? 'Unknown requester'}</h2>
                      <p className="text-sm text-slate-500">{request.requester?.email ?? 'No email'} · {request.id}</p>
                      <p className="text-xs text-slate-500">{request.description}</p>
                    </div>

                    <div className="space-y-1 text-sm text-slate-600">
                      <p>Hazard: {request.hazardType}</p>
                      <p>Urgency: {effectiveUrgency}</p>
                      <p>Created: {fmtDate(request.createdAt)}</p>
                      <p>Coords: {request.latitude.toFixed(4)}, {request.longitude.toFixed(4)}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${urgencyPalette.badge}`}
                      >
                        {effectiveUrgency}
                      </span>
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                        {request.status}
                      </span>
                    </div>
                  </button>

                  {expanded ? (
                    <div className="border-t border-slate-100 p-5">
                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
                        <div className="space-y-4">
                          <section className="space-y-2">
                            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">Assignment</h3>
                            {latestAssignment ? (
                              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                                <p className="font-semibold">{latestAssignment.volunteer.name}</p>
                                <p>{latestAssignment.volunteer.email}</p>
                                <p>Status: {latestAssignment.status}</p>
                                <p>Assigned: {fmtDate(latestAssignment.assignedAt)}</p>
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500">No volunteer assignment yet.</p>
                            )}
                          </section>

                          <section className="space-y-2">
                            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">Urgency Triage</h3>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                              <p>Submitted urgency: {request.urgency}</p>
                              {request.predictedUrgency ? (
                                <>
                                  <p>Predicted urgency: {request.predictedUrgency}</p>
                                  {confidenceLabel ? <p>Urgency confidence: {confidenceLabel}</p> : null}
                                </>
                              ) : null}
                            </div>
                          </section>

                          <section className="space-y-2">
                            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">Event History</h3>
                            {request.events.length === 0 ? (
                              <p className="text-sm text-slate-500">No events logged.</p>
                            ) : (
                              <div className="space-y-2">
                                {request.events.map((event) => (
                                  <div key={event.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                                    <p className="font-semibold">
                                      {event.previousStatus ?? 'N/A'}
                                      {' -> '}
                                      {event.nextStatus}
                                    </p>
                                    <p>{event.note ?? 'No note'}</p>
                                    <p className="text-xs text-slate-500">
                                      {fmtDate(event.createdAt)}
                                      {event.actor ? ` · ${event.actor.name}` : ''}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </section>
                        </div>

                        <section className="space-y-3 rounded-xl border border-slate-200 p-4">
                          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">Admin Action</h3>
                          {canUpdate ? (
                            <>
                              <select
                                value={actionValue}
                                onChange={(event) =>
                                  setActionById((current) => ({
                                    ...current,
                                    [request.id]: event.target.value as AdminStatusAction,
                                  }))
                                }
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition-all focus:border-emerald-600"
                              >
                                <option value="IN_PROGRESS">Set In Progress</option>
                                <option value="RESOLVED">Set Resolved</option>
                                <option value="CANCELLED">Set Cancelled</option>
                              </select>

                              <textarea
                                value={note}
                                onChange={(event) =>
                                  setNoteById((current) => ({
                                    ...current,
                                    [request.id]: event.target.value,
                                  }))
                                }
                                placeholder="Required note for this status update"
                                className="min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition-all focus:border-emerald-600"
                              />

                              {inlineErrorById[request.id] ? (
                                <p className="text-sm text-rose-600">{inlineErrorById[request.id]}</p>
                              ) : null}

                              {updateStatusMutation.isError ? (
                                <p className="text-sm text-rose-600">
                                  {updateStatusMutation.error instanceof Error
                                    ? updateStatusMutation.error.message
                                    : 'Failed to update status.'}
                                </p>
                              ) : null}

                              <button
                                type="button"
                                onClick={() => applyStatus(request)}
                                disabled={updateStatusMutation.isPending}
                                className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {updateStatusMutation.isPending ? 'Updating...' : 'Apply Status Update'}
                              </button>
                            </>
                          ) : (
                            <p className="text-sm text-slate-500">
                              This request is already terminal and cannot be updated.
                            </p>
                          )}
                        </section>
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
