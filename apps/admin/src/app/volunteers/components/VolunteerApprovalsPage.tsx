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
import { useI18n } from '../../../i18n/context';
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
  const { t } = useI18n();
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
      alert(t('volunteers.rejectionReasonRequired'));
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
        <p className="eyebrow">{t('volunteers.eyebrow')}</p>
        <h1 className="title">{t('volunteers.title')}</h1>
        <p className="subtitle">{t('volunteers.subtitle')}</p>
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
              {t(`volunteers.status.${item}`)}
            </button>
          ))}
        </div>
        
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem' }}>
          <select
            className="input small"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'updatedAt')}
          >
            <option value="createdAt">{t('volunteers.sortBySubmitted')}</option>
            <option value="updatedAt">{t('volunteers.sortByReview')}</option>
          </select>
          <select
            className="input small"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
          >
            <option value="desc">{t('volunteers.newestFirst')}</option>
            <option value="asc">{t('volunteers.oldestFirst')}</option>
          </select>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="card toolbar" style={{ background: 'rgba(var(--brand-primary-rgb), 0.1)', border: '1px solid var(--brand-primary)' }}>
          <p className="mono small">{t('volunteers.applicationsSelected').replace('{count}', String(selectedIds.length))}</p>
          <div className="action-row" style={{ marginTop: '0.5rem' }}>
            <input
              type="text"
              placeholder={t('volunteers.reasonPlaceholder')}
              className="input"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <button
              className="btn btn-safe"
              onClick={() => handleBulkReview('APPROVED')}
              disabled={bulkReviewMutation.isPending}
            >
              {t('volunteers.bulkApprove')}
            </button>
            <button
              className="btn btn-critical"
              onClick={() => handleBulkReview('REJECTED')}
              disabled={bulkReviewMutation.isPending}
            >
              {t('volunteers.bulkReject')}
            </button>
          </div>
        </div>
      )}

      {applicationsQuery.isLoading ? <p className="muted">{t('volunteers.loadingRequests')}</p> : null}
      {applicationsQuery.error ? (
        <p className="error-text">{t('volunteers.loadError')}</p>
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
                  <h2 className="card-title">{application.user?.name ?? t('volunteers.unknownApplicant')}</h2>
                  <p className="muted">{application.user?.email ?? t('volunteers.noEmail')}</p>
                  <p className="muted">{t('volunteers.notes')}: {application.notes ?? t('volunteers.notesNone')}</p>
                  <p className="muted small">{t('volunteers.submitted')}: {new Date(application.createdAt).toLocaleString()}</p>
                  <p className="badge-row">
                    <span className={`status-badge status-${application.status.toLowerCase()}`}>
                      {t(`volunteers.status.${application.status}`)}
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
                      {t('volunteers.approve')}
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
                      {t('volunteers.reject')}
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
                    {t('volunteers.suspend')}
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
                    {t('volunteers.reactivate')}
                  </button>
                )}

                <button
                  className="btn btn-secondary"
                  onClick={() => setShowHistoryId(showHistoryId === application.id ? null : application.id)}
                >
                  {showHistoryId === application.id ? t('volunteers.hideHistory') : t('volunteers.history')}
                </button>
              </div>

              {showHistoryId === application.id && (
                <div className="history-view small" style={{ marginTop: '1rem', background: 'var(--bg-subtle)', padding: '0.5rem', borderRadius: '4px' }}>
                  <h3 className="mono small bold">{t('volunteers.decisionLog')}</h3>
                  {historyQuery.isLoading ? <p className="muted">{t('volunteers.loadingHistory')}</p> : null}
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {(() => {
                      const raw = historyQuery.data as unknown;
                      const arr = (raw && typeof raw === 'object' && 'data' in raw ? (raw as { data?: unknown[] }).data : raw) ?? [];
                      const list = Array.isArray(arr) ? arr : [];
                      return list.map((log: unknown) => {
                        const l = log as { id: string; previousStatus: string; nextStatus: string; actor?: { name?: string }; createdAt: string; reason?: string };
                        return (
                      <li key={l.id} style={{ marginBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                        <p className="mono">
                          {l.previousStatus} → <strong>{l.nextStatus}</strong>
                        </p>
                        <p className="muted">{t('volunteers.by')} {l.actor?.name ?? 'System'} on {new Date(l.createdAt).toLocaleString()}</p>
                        {l.reason && <p className="italic">"{l.reason}"</p>}
                      </li>
                        );
                      });
                    })()}
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
            ? t('volunteers.modal.rejectTitle')
            : modalConfig.actionType === 'SUSPEND'
            ? t('volunteers.modal.suspendTitle')
            : t('volunteers.modal.reactivateTitle')
        }
        description={
          modalConfig.actionType === 'REJECT'
            ? t('volunteers.modal.rejectDescription').replace('{name}', modalConfig.application?.user?.name ?? '')
            : modalConfig.actionType === 'SUSPEND'
            ? t('volunteers.modal.suspendDescription').replace('{name}', modalConfig.application?.user?.name ?? '')
            : t('volunteers.modal.reactivateDescription').replace('{name}', modalConfig.application?.user?.name ?? '')
        }
        confirmText={
          modalConfig.actionType === 'REJECT'
            ? t('volunteers.modal.rejectConfirm')
            : modalConfig.actionType === 'SUSPEND'
            ? t('volunteers.modal.suspendConfirm')
            : t('volunteers.modal.reactivateConfirm')
        }
        type={modalConfig.actionType === 'REACTIVATE' ? 'SAFE' : 'CRITICAL'}
        placeholder={t('volunteers.reasonPlaceholderModal')}
        cancelText={t('common.cancel')}
        requiredMessage={t('common.reasonRequired')}
      />
    </section>
  );
}
