'use client';

import {
  useAdminOperationsControllerListVolunteerApplications,
  useAdminOperationsControllerReviewVolunteer,
  useAdminOperationsControllerBulkReviewVolunteers,
  useAdminOperationsControllerSuspendVolunteer,
  useAdminOperationsControllerReactivateVolunteer,
  useAdminOperationsControllerGetApplicationHistory,
} from '@wira-borneo/api-client';
import { useState } from 'react';
import { ActionModal } from './ActionModal';

interface VolunteerApplication {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
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
  'SUSPENDED',
];

function toApplications(raw: unknown): VolunteerApplication[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw as VolunteerApplication[];
}

export function VolunteerApprovalsPage() {
  const [status, setStatus] = useState<VolunteerApplication['status']>('PENDING');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showHistoryId, setShowHistoryId] = useState<string | null>(null);

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    application?: VolunteerApplication;
    actionType?: 'REJECT' | 'SUSPEND' | 'REACTIVATE';
  }>({
    isOpen: false,
  });

  const applicationsQuery = useAdminOperationsControllerListVolunteerApplications(
    { status, sortBy, sortOrder },
    {
      query: {
        select: (response: any) => toApplications(response?.data ?? response),
      },
    },
  );

  const reviewMutation = useAdminOperationsControllerReviewVolunteer();
  const bulkReviewMutation = useAdminOperationsControllerBulkReviewVolunteers();
  const suspendMutation = useAdminOperationsControllerSuspendVolunteer();
  const reactivateMutation = useAdminOperationsControllerReactivateVolunteer();
  const historyQuery = useAdminOperationsControllerGetApplicationHistory(
    showHistoryId || '',
    {
      query: {
        enabled: !!showHistoryId,
      },
    },
  );

  const applications = applicationsQuery.data ?? [];

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleBulkReview = (nextStatus: 'APPROVED' | 'REJECTED') => {
    if (nextStatus === 'REJECTED' && !rejectionReason) {
      alert('Please provide a rejection reason.');
      return;
    }

    bulkReviewMutation.mutate(
      {
        data: {
          applicationIds: selectedIds,
          nextStatus,
          reason: rejectionReason,
        },
      },
      {
        onSuccess: () => {
          setSelectedIds([]);
          setRejectionReason('');
          applicationsQuery.refetch();
        },
      },
    );
  };

  const handleActionConfirm = (reason: string) => {
    const { application, actionType } = modalConfig;
    if (!application) return;

    if (actionType === 'REJECT') {
      reviewMutation.mutate(
        { id: application.id, data: { nextStatus: 'REJECTED', reason } },
        { onSuccess: () => applicationsQuery.refetch() },
      );
    } else if (actionType === 'SUSPEND' && application.user) {
      suspendMutation.mutate(
        { userId: application.user.id, data: { reason } },
        { onSuccess: () => applicationsQuery.refetch() },
      );
    } else if (actionType === 'REACTIVATE' && application.user) {
      reactivateMutation.mutate(
        { userId: application.user.id, data: { reason } },
        { onSuccess: () => applicationsQuery.refetch() },
      );
    }

    setModalConfig({ isOpen: false });
  };

  return (
    <section className="page-shell">
      <header className="section-header">
        <p className="eyebrow">Volunteer Admin</p>
        <h1 className="title">Volunteer Management / Pengurusan Sukarelawan</h1>
        <p className="subtitle">
          Review applications, manage lifecycle, and audit decisions.
        </p>
      </header>

      <div className="card filter-row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
        
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem' }}>
          <select 
            className="input small" 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="createdAt">Sort by Submitted Date</option>
            <option value="updatedAt">Sort by Review Date</option>
          </select>
          <select 
            className="input small" 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value as any)}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="card toolbar" style={{ background: 'rgba(var(--brand-primary-rgb), 0.1)', border: '1px solid var(--brand-primary)' }}>
          <p className="mono small">{selectedIds.length} applications selected</p>
          <div className="action-row" style={{ marginTop: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="Reason (required for rejection)..." 
              className="input" 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <button 
              className="btn btn-safe" 
              onClick={() => handleBulkReview('APPROVED')}
              disabled={bulkReviewMutation.isPending}
            >
              Bulk Approve
            </button>
            <button 
              className="btn btn-critical" 
              onClick={() => handleBulkReview('REJECTED')}
              disabled={bulkReviewMutation.isPending}
            >
              Bulk Reject
            </button>
          </div>
        </div>
      )}

      {applicationsQuery.isLoading ? <p className="muted">Loading requests...</p> : null}
      {applicationsQuery.error ? (
        <p className="error-text">Unable to load volunteer requests.</p>
      ) : null}

      <div className="grid-list">
        {applications.map((application) => {
          const isPending = application.status === 'PENDING';
          const isApproved = application.status === 'APPROVED';
          const isSuspended = application.status === 'SUSPENDED';
          const isSelected = selectedIds.includes(application.id);

          return (
            <article key={application.id} className={`card volunteer-card ${isSelected ? 'selected' : ''}`}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {isPending && (
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => handleSelect(application.id)}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <p className="mono small">ID: {application.id}</p>
                  <h2 className="card-title">{application.user?.name ?? 'Unknown Applicant'}</h2>
                  <p className="muted">{application.user?.email ?? 'No email available'}</p>
                  <p className="muted">Notes: {application.notes ?? 'None'}</p>
                  <p className="muted small">Submitted: {new Date(application.createdAt).toLocaleString()}</p>
                  <p className="badge-row">
                    <span className={`status-badge status-${application.status.toLowerCase()}`}>
                      {application.status}
                    </span>
                  </p>
                </div>
              </div>

              <div className="action-row" style={{ marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                {isPending && (
                  <>
                    <button
                      type="button"
                      className="btn btn-safe"
                      disabled={reviewMutation.isPending}
                      onClick={() => {
                        reviewMutation.mutate(
                          { id: application.id, data: { nextStatus: 'APPROVED' } },
                          { onSuccess: () => applicationsQuery.refetch() },
                        );
                      }}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn btn-critical"
                      disabled={reviewMutation.isPending}
                      onClick={() => {
                        setModalConfig({
                          isOpen: true,
                          application,
                          actionType: 'REJECT',
                        });
                      }}
                    >
                      Reject
                    </button>
                  </>
                )}

                {isApproved && application.user && (
                  <button
                    type="button"
                    className="btn btn-critical"
                    disabled={suspendMutation.isPending}
                    onClick={() => {
                      setModalConfig({
                        isOpen: true,
                        application,
                        actionType: 'SUSPEND',
                      });
                    }}
                  >
                    Suspend
                  </button>
                )}

                {isSuspended && application.user && (
                  <button
                    type="button"
                    className="btn btn-safe"
                    disabled={reactivateMutation.isPending}
                    onClick={() => {
                      setModalConfig({
                        isOpen: true,
                        application,
                        actionType: 'REACTIVATE',
                      });
                    }}
                  >
                    Reactivate
                  </button>
                )}

                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowHistoryId(showHistoryId === application.id ? null : application.id)}
                >
                  {showHistoryId === application.id ? 'Hide History' : 'History'}
                </button>
              </div>

              {showHistoryId === application.id && (
                <div className="history-view small" style={{ marginTop: '1rem', background: 'var(--bg-subtle)', padding: '0.5rem', borderRadius: '4px' }}>
                  <h3 className="mono small bold">Decision Log:</h3>
                  {historyQuery.isLoading ? <p className="muted">Loading history...</p> : null}
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {((historyQuery.data as any)?.data ?? historyQuery.data ?? []).map((log: any) => (
                      <li key={log.id} style={{ marginBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                        <p className="mono">
                          {log.previousStatus} → <strong>{log.nextStatus}</strong>
                        </p>
                        <p className="muted">By: {log.actor?.name ?? 'System'} on {new Date(log.createdAt).toLocaleString()}</p>
                        {log.reason && <p className="italic">"{log.reason}"</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <ActionModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ isOpen: false })}
        onConfirm={handleActionConfirm}
        title={
          modalConfig.actionType === 'REJECT'
            ? 'Reject Application'
            : modalConfig.actionType === 'SUSPEND'
            ? 'Suspend Volunteer'
            : 'Reactivate Volunteer'
        }
        description={
          modalConfig.actionType === 'REJECT'
            ? `You are rejecting the application for ${modalConfig.application?.user?.name}. This action will notify the user.`
            : modalConfig.actionType === 'SUSPEND'
            ? `You are suspending ${modalConfig.application?.user?.name}. They will no longer be able to claim requests.`
            : `You are reactivating ${modalConfig.application?.user?.name}. They will be able to claim requests again.`
        }
        confirmText={
          modalConfig.actionType === 'REJECT'
            ? 'Reject Application'
            : modalConfig.actionType === 'SUSPEND'
            ? 'Suspend Account'
            : 'Reactivate Account'
        }
        type={modalConfig.actionType === 'REACTIVATE' ? 'SAFE' : 'CRITICAL'}
      />
    </section>
  );
}
