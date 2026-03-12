'use client';

import {
  useAdminOperationsControllerCancelWarning,
  useAdminOperationsControllerDeleteWarning,
  useAdminOperationsControllerListWarnings,
} from '@wira-borneo/api-client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '../../components/Toast';

type WarningStatus = 'DRAFT' | 'SENT' | 'CANCELLED';
type HazardType = 'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK';
type SeverityLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
type WarningStatusFilter = 'ALL' | WarningStatus;

interface WarningTargetArea {
  id: string;
  areaName: string;
}

interface WarningItem {
  id: string;
  title: string;
  message: string;
  hazardType: HazardType;
  severity: SeverityLevel;
  status: WarningStatus;
  startsAt: string;
  endsAt?: string | null;
  createdAt: string;
  targetAreas: WarningTargetArea[];
}

const warningFilters: WarningStatusFilter[] = ['ALL', 'SENT', 'DRAFT', 'CANCELLED'];

function toWarnings(raw: unknown): WarningItem[] {
  const payload = (raw as { data?: unknown })?.data ?? raw;
  return Array.isArray(payload) ? (payload as WarningItem[]) : [];
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

function toReadableHazard(value: HazardType): string {
  if (value === 'TYPHOON') return 'Typhoon';
  if (value === 'EARTHQUAKE') return 'Earthquake';
  if (value === 'AFTERSHOCK') return 'Aftershock';
  return 'Flood';
}

export function ActiveWarningsPage() {
  const [status, setStatus] = useState<WarningStatusFilter>('SENT');

  const warningsQuery = useAdminOperationsControllerListWarnings(
    { status: status === 'ALL' ? '' : status },
    {
      query: {
        select: (response: unknown) => toWarnings(response),
      },
    },
  );
  const cancelMutation = useAdminOperationsControllerCancelWarning();
  const deleteMutation = useAdminOperationsControllerDeleteWarning();
  const { showToast } = useToast();

  useEffect(() => {
    if (warningsQuery.error) {
      showToast(toErrorMessage(warningsQuery.error, 'Failed to load warnings.'), 'error');
    }
  }, [warningsQuery.error, showToast]);

  const reload = useCallback(() => {
    void warningsQuery.refetch();
  }, [warningsQuery]);

  const onCancelWarning = useCallback(
    (warningId: string) => {
      cancelMutation.mutate(
        { id: warningId },
        {
          onSuccess: () => {
            showToast('Warning cancelled successfully.', 'success');
            reload();
          },
          onError: (error) => {
            showToast(toErrorMessage(error, 'Failed to cancel warning.'), 'error');
          },
        },
      );
    },
    [cancelMutation, reload, showToast],
  );

  const onDeleteWarning = useCallback(
    async (warningId: string) => {
      const proceed = window.confirm(
        'Delete this warning permanently? This should only be used for false alarms.',
      );
      if (!proceed) {
        return;
      }

      deleteMutation.mutate(
        { id: warningId },
        {
          onSuccess: () => {
            showToast('Warning deleted successfully.', 'success');
            reload();
          },
          onError: (error) => {
            showToast(toErrorMessage(error, 'Failed to delete warning.'), 'error');
          },
        },
      );
    },
    [deleteMutation, reload, showToast],
  );

  const warnings = warningsQuery.data ?? [];
  const sortedWarnings = useMemo(
    () => [...warnings].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [warnings],
  );

  return (
    <section className="page-shell">
      <div className="volunteer-registry-section">
        <header className="volunteer-registry-header">
          <div>
            <h1 className="volunteer-registry-title">Active Warnings</h1>
            <p className="volunteer-registry-subtitle">
              Monitor, cancel, or delete warning broadcasts.
            </p>
          </div>
        </header>

        <div
          className="card filter-row"
          style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            margin: '16px 16px 0',
          }}
        >
          {warningFilters.map((item) => (
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

        <div className="volunteer-table-wrap" style={{ marginTop: '12px' }}>
          <table className="volunteer-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Hazard</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Target Areas</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {warningsQuery.isLoading ? (
                <tr>
                  <td colSpan={7} className="muted small" style={{ textAlign: 'center' }}>
                    Loading warnings...
                  </td>
                </tr>
              ) : sortedWarnings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted small" style={{ textAlign: 'center' }}>
                    No warnings found.
                  </td>
                </tr>
              ) : (
                sortedWarnings.map((warning) => {
                  const isCancelling =
                    cancelMutation.isPending && cancelMutation.variables?.id === warning.id;
                  const isDeleting =
                    deleteMutation.isPending && deleteMutation.variables?.id === warning.id;

                  return (
                    <tr key={warning.id}>
                      <td>
                        <div className="volunteer-table-name">{warning.title}</div>
                        <div className="volunteer-table-id">{warning.message.slice(0, 64)}</div>
                      </td>
                      <td>{toReadableHazard(warning.hazardType)}</td>
                      <td>
                        <span className={`warning-severity-pill ${warning.severity.toLowerCase()}`}>
                          {warning.severity}
                        </span>
                      </td>
                      <td>
                        <span className={`warning-status-pill ${warning.status.toLowerCase()}`}>
                          {warning.status}
                        </span>
                      </td>
                      <td className="volunteer-table-notes">
                        {warning.targetAreas.length > 0
                          ? warning.targetAreas.map((area) => area.areaName).join(', ')
                          : '-'}
                      </td>
                      <td>{new Date(warning.createdAt).toLocaleString()}</td>
                      <td>
                        <div className="volunteer-table-actions">
                          <button
                            type="button"
                            className="volunteer-table-btn-deny"
                            onClick={() => onDeleteWarning(warning.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </button>
                          <button
                            type="button"
                            className="volunteer-table-btn-approve"
                            onClick={() => onCancelWarning(warning.id)}
                            disabled={warning.status !== 'SENT' || isCancelling}
                          >
                            {isCancelling ? 'Cancelling...' : 'Cancel'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <footer className="volunteer-registry-footer">
          {sortedWarnings.length} warning{sortedWarnings.length === 1 ? '' : 's'}
        </footer>
      </div>
    </section>
  );
}
