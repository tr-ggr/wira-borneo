'use client';

import {
  useAdminOperationsControllerListVolunteerApplications,
  useAdminOperationsControllerReviewVolunteer,
} from '@wira-borneo/api-client';
import { useState } from 'react';

interface VolunteerApplication {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string | null;
  createdAt?: string;
  reviewedAt?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

const statusFilters: Array<VolunteerApplication['status']> = [
  'PENDING',
  'APPROVED',
  'REJECTED',
];

function toApplications(raw: unknown): VolunteerApplication[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw as VolunteerApplication[];
}

export function VolunteerApprovalsPage() {
  const [status, setStatus] = useState<VolunteerApplication['status']>('PENDING');

  const applicationsQuery = useAdminOperationsControllerListVolunteerApplications(
    { status },
    {
      query: {
        select: (response) => toApplications(response.data),
      },
    },
  );

  const reviewMutation = useAdminOperationsControllerReviewVolunteer();

  const applications = applicationsQuery.data ?? [];

  return (
    <section className="page-shell">
      <header className="section-header">
        <p className="eyebrow">Volunteer Admin</p>
        <h1 className="title">Volunteer Requests / Permohonan Sukarelawan</h1>
        <p className="subtitle">
          Review and approve or reject requests with explicit admin action.
        </p>
      </header>

      <div className="card filter-row">
        {statusFilters.map((item) => (
          <button
            key={item}
            type="button"
            className={`chip ${status === item ? 'chip-active' : ''}`}
            onClick={() => setStatus(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {applicationsQuery.isLoading ? <p className="muted">Loading requests...</p> : null}
      {applicationsQuery.error ? (
        <p className="error-text">Unable to load volunteer requests.</p>
      ) : null}

      <div className="grid-list">
        {applications.map((application) => {
          const isPending = application.status === 'PENDING';
          return (
            <article key={application.id} className="card volunteer-card">
              <div>
                <p className="mono small">ID: {application.id}</p>
                <h2 className="card-title">{application.user?.name ?? 'Unknown Applicant'}</h2>
                <p className="muted">{application.user?.email ?? 'No email available'}</p>
                <p className="muted">Notes: {application.notes ?? 'None'}</p>
                <p className="badge-row">
                  <span className={`status-badge status-${application.status.toLowerCase()}`}>
                    {application.status}
                  </span>
                </p>
              </div>

              <div className="action-row">
                <button
                  type="button"
                  className="btn btn-safe"
                  disabled={!isPending || reviewMutation.isPending}
                  onClick={() => {
                    reviewMutation.mutate(
                      { id: application.id, data: { nextStatus: 'APPROVED' } },
                      {
                        onSuccess: () => {
                          applicationsQuery.refetch();
                        },
                      },
                    );
                  }}
                >
                  Approve / Luluskan
                </button>
                <button
                  type="button"
                  className="btn btn-critical"
                  disabled={!isPending || reviewMutation.isPending}
                  onClick={() => {
                    reviewMutation.mutate(
                      { id: application.id, data: { nextStatus: 'REJECTED' } },
                      {
                        onSuccess: () => {
                          applicationsQuery.refetch();
                        },
                      },
                    );
                  }}
                >
                  Reject / Tolak
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
