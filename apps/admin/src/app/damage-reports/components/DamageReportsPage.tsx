'use client';

import React, { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getAdminOperationsControllerDamageReportsQueryKey,
  useAdminOperationsControllerDamageReports,
  useAdminOperationsControllerReviewDamageReport,
} from '@wira-borneo/api-client';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Clock,
  Download,
  Search,
  XCircle,
} from 'lucide-react';

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

export function DamageReportsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewReason, setReviewReason] = useState<Record<string, string>>({});

  const reportsQuery = useAdminOperationsControllerDamageReports();
  const reviewMutation = useAdminOperationsControllerReviewDamageReport({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getAdminOperationsControllerDamageReportsQueryKey(),
        });
      },
    },
  });

  const reports = reportsQuery.data ?? [];

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();

    return reports
      .filter((report) => (status === 'ALL' ? true : report.reviewStatus === status))
      .filter((report) => {
        if (!term) return true;
        return [
          report.title,
          report.description,
          report.reporter?.name,
          report.reporter?.email,
          ...(report.damageCategories ?? []),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      })
      .sort((left, right) => right.confidenceScore - left.confidenceScore);
  }, [reports, search, status]);

  const exportCsv = () => {
    if (filteredReports.length === 0) return;

    const headers = [
      'Title',
      'Reporter',
      'Reporter Email',
      'Categories',
      'Confidence Score',
      'Threshold',
      'Status',
      'Created At',
      'Latitude',
      'Longitude',
    ];

    const rows = filteredReports.map((report) => [
      report.title,
      report.reporter?.name ?? '',
      report.reporter?.email ?? '',
      (report.damageCategories ?? []).join(' | '),
      report.confidenceScore,
      report.confidenceThreshold,
      report.reviewStatus,
      new Date(report.createdAt).toISOString(),
      report.latitude,
      report.longitude,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((item) => `"${String(item).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `damage-reports-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (reportsQuery.isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-8">
        <div className="space-y-3 text-center text-slate-500">
          <div className="mx-auto h-12 w-12 rounded-full border-4 border-slate-200 border-t-asean-blue animate-spin" />
          <p>Loading damage reports...</p>
        </div>
      </div>
    );
  }

  if (reportsQuery.isError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-2 p-8 text-rose-500">
        <XCircle size={42} />
        <p className="font-bold">Failed to load damage reports</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Damage Reports</h1>
          <p className="mt-1 text-slate-500">
            Review geo-tagged resident submissions with mocked AI confidence scores.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={filteredReports.length === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={18} />
          Export CSV
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, reporter, email, or category..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 shadow-sm outline-none transition-all focus:border-asean-blue focus:ring-2 focus:ring-asean-blue/20"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as StatusFilter[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                status === value
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
        {filteredReports.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            No damage reports match the current filters.
          </div>
        ) : (
          filteredReports.map((report) => {
            const expanded = expandedId === report.id;
            const reason = reviewReason[report.id] ?? '';
            const confidencePercent = Math.round(report.confidenceScore * 100);
            const thresholdPercent = Math.round(report.confidenceThreshold * 100);

            return (
              <article key={report.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : report.id)}
                  className="grid w-full grid-cols-1 gap-4 p-5 text-left md:grid-cols-[1.4fr_1fr_auto] md:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Camera size={16} className="text-slate-400" />
                      <h2 className="text-lg font-bold text-slate-900">{report.title}</h2>
                    </div>
                    <p className="text-sm text-slate-500">
                      Submitted by {report.reporter?.name ?? 'Unknown'}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {(report.damageCategories ?? []).map((category) => (
                        <span key={category} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                          {category.replaceAll('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">AI confidence</p>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full ${
                          confidencePercent >= thresholdPercent
                            ? 'bg-emerald-500'
                            : confidencePercent >= 40
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                        }`}
                        style={{ width: `${confidencePercent}%` }}
                      />
                    </div>
                    <p className="text-sm text-slate-600">
                      {confidencePercent}% confidence, {thresholdPercent}% threshold
                    </p>
                  </div>

                  <div className="flex items-center justify-start md:justify-end">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                      report.reviewStatus === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : report.reviewStatus === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                    }`}>
                      {report.reviewStatus === 'APPROVED' ? <CheckCircle2 size={14} /> : null}
                      {report.reviewStatus === 'REJECTED' ? <XCircle size={14} /> : null}
                      {report.reviewStatus === 'PENDING' ? <Clock size={14} /> : null}
                      {report.reviewStatus}
                    </span>
                  </div>
                </button>

                {expanded ? (
                  <div className="grid gap-5 border-t border-slate-100 p-5 md:grid-cols-[280px_1fr]">
                    <img
                      src={report.photoUrl}
                      alt={report.title}
                      className="h-64 w-full rounded-xl object-cover"
                    />

                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Reporter</p>
                          <p className="text-sm text-slate-800">{report.reporter?.name}</p>
                          <p className="text-sm text-slate-500">{report.reporter?.email}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Coordinates</p>
                          <p className="text-sm text-slate-800">
                            {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Submitted</p>
                          <p className="text-sm text-slate-800">{new Date(report.createdAt).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Status rule</p>
                          <p className="text-sm text-slate-800">
                            {confidencePercent >= thresholdPercent ? 'Auto-accepted threshold met' : 'Below threshold, manual review required'}
                          </p>
                        </div>
                      </div>

                      {report.description ? (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Description</p>
                          <p className="mt-1 text-sm text-slate-700">{report.description}</p>
                        </div>
                      ) : null}

                      {report.reviewStatus === 'PENDING' ? (
                        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm font-bold text-slate-800">Review actions</p>
                          <input
                            type="text"
                            value={reason}
                            onChange={(event) =>
                              setReviewReason((current) => ({
                                ...current,
                                [report.id]: event.target.value,
                              }))
                            }
                            placeholder="Reason required for rejection"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-asean-blue focus:ring-2 focus:ring-asean-blue/20"
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                reviewMutation.mutate({
                                  id: report.id,
                                  data: { action: 'APPROVE' },
                                })
                              }
                              disabled={reviewMutation.isPending}
                              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                reviewMutation.mutate({
                                  id: report.id,
                                  data: { action: 'REJECT', reason: reason.trim() },
                                })
                              }
                              disabled={reviewMutation.isPending || !reason.trim()}
                              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-rose-700 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                          {reviewMutation.isError ? (
                            <p className="text-sm text-rose-600">
                              Review failed. Please try again.
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                          {report.reviewStatus === 'APPROVED'
                            ? 'This report is already approved and visible on the operational map.'
                            : 'This report has been rejected.'}
                          {report.reviewNote ? ` Review note: ${report.reviewNote}` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}