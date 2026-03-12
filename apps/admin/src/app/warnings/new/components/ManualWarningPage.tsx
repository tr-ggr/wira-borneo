'use client';

import {
  useAdminOperationsControllerCreateWarning,
  useAdminOperationsControllerGetPromptSuggestion,
} from '@wira-borneo/api-client';
import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../../../i18n/context';
import {
  canProceedToConfirmation,
  warningFlowReducer,
  warningSummary,
} from './warning-flow.utils';
import WarningMapSupport, { type WarningCoordinatePoint } from './WarningMapSupport';
import {
  getLastWarningLocation,
  isLocationEmpty,
  saveLastWarningLocation,
} from './location-prediction.utils';
import { useToast } from '../../../components/Toast';

type HazardType = 'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK';
type SeverityLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
type DrawMode = 'pin' | 'box' | 'polygon';

function formatCoordinate(value: number): string {
  return value.toFixed(6);
}

function coordinateLabel(drawMode: DrawMode, index: number, total: number): string {
  if (drawMode === 'box' && total === 4) {
    return ['Point 1', 'Point 2', 'Point 3', 'Point 4'][index] ?? `Point ${index + 1}`;
  }

  return `Pin ${index + 1}`;
}

const defaultTarget = {
  areaName: '',
  latitude: '',
  longitude: '',
  radiusKm: '5',
  polygonGeoJson: '',
};

export function ManualWarningPage() {
  const { t } = useI18n();
  const [step, setStep] = useState<'compose' | 'confirm'>('compose');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [hazardType, setHazardType] = useState<HazardType>('FLOOD');
  const [severity, setSeverity] = useState<SeverityLevel>('HIGH');
  const [startsAt, setStartsAt] = useState(new Date().toISOString().slice(0, 16));
  const [endsAt, setEndsAt] = useState('');
  const [target, setTarget] = useState(defaultTarget);
  const [drawMode, setDrawMode] = useState<DrawMode>('pin');
  const [targetCoordinates, setTargetCoordinates] = useState<WarningCoordinatePoint[]>([]);

  const promptMutation = useAdminOperationsControllerGetPromptSuggestion();
  const createWarningMutation = useAdminOperationsControllerCreateWarning();
  const { showToast } = useToast();

  useEffect(() => {
    const saved = getLastWarningLocation();
    if (!saved) {
      return;
    }

    setTarget((current) => (isLocationEmpty(current) ? saved : current));
  }, []);

  const payload = useMemo(
    () => ({
      title,
      message,
      hazardType,
      severity,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
      suggestedPrompt: (() => {
        const d = promptMutation.data as unknown as { prompt?: string } | undefined;
        return d?.prompt ? String(d.prompt) : undefined;
      })(),
      targets: [
        {
          areaName: target.areaName,
          latitude: target.latitude ? Number(target.latitude) : undefined,
          longitude: target.longitude ? Number(target.longitude) : undefined,
          // Only include radiusKm for pin mode; for box/polygon, use polygonGeoJson
          radiusKm: drawMode === 'pin' && target.radiusKm ? Number(target.radiusKm) : undefined,
          polygonGeoJson: target.polygonGeoJson || undefined,
        },
      ],
      evacuationAreaIds: [] as string[],
    }),
    [
      title,
      message,
      hazardType,
      severity,
      startsAt,
      endsAt,
      promptMutation.data,
      target.areaName,
      target.latitude,
      target.longitude,
      target.radiusKm,
      target.polygonGeoJson,
      drawMode,
    ],
  );

  const summary = warningSummary({
    title: payload.title,
    message: payload.message,
    areaName: payload.targets[0].areaName,
    radiusKm: drawMode === 'pin' ? payload.targets[0].radiusKm : undefined,
    drawMode: drawMode,
    hasPolygon: Boolean(payload.targets[0].polygonGeoJson),
    evacuationCount: payload.evacuationAreaIds.length,
  });

  const coordinateCountLabel =
    drawMode === 'box'
      ? `4 corners`
      : `${targetCoordinates.length} ${targetCoordinates.length === 1 ? 'pin' : 'pins'}`;

  return (
    <section className="page-shell">
      <header className="section-header">
        <p className="eyebrow">{t('warnings.eyebrow')}</p>
        <h1 className="title">{t('warnings.title')}</h1>
        <p className="subtitle">{t('warnings.subtitle')}</p>
      </header>

      {step === 'compose' ? (
        <div className="grid-list">
          <article className="card">
            <h2 className="card-title">{t('warnings.composeTitle')}</h2>
            <label className="field-label">
              {t('warnings.fieldTitle')}
              <input className="field" value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className="field-label">
              {t('warnings.fieldMessage')}
              <textarea
                className="field"
                rows={5}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </label>
            <div className="row-2">
              <label className="field-label">
                {t('warnings.hazard')}
                <select
                  className="field"
                  value={hazardType}
                  onChange={(event) => setHazardType(event.target.value as HazardType)}
                >
                  <option value="FLOOD">{t('warnings.hazard.FLOOD')}</option>
                  <option value="TYPHOON">{t('warnings.hazard.TYPHOON')}</option>
                  <option value="EARTHQUAKE">{t('warnings.hazard.EARTHQUAKE')}</option>
                  <option value="AFTERSHOCK">{t('warnings.hazard.AFTERSHOCK')}</option>
                </select>
              </label>
              <label className="field-label">
                {t('warnings.severity')}
                <select
                  className="field"
                  value={severity}
                  onChange={(event) => setSeverity(event.target.value as SeverityLevel)}
                >
                  <option value="LOW">{t('warnings.severity.LOW')}</option>
                  <option value="MODERATE">{t('warnings.severity.MODERATE')}</option>
                  <option value="HIGH">{t('warnings.severity.HIGH')}</option>
                  <option value="CRITICAL">{t('warnings.severity.CRITICAL')}</option>
                </select>
              </label>
            </div>
            <div className="row-2">
              <label className="field-label">
                {t('warnings.startMyt')}
                <input
                  type="datetime-local"
                  className="field"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                />
              </label>
              <label className="field-label">
                {t('warnings.endOptional')}
                <input
                  type="datetime-local"
                  className="field"
                  value={endsAt}
                  onChange={(event) => setEndsAt(event.target.value)}
                />
              </label>
            </div>
            <button
              type="button"
              className="btn btn-neutral"
              onClick={() => {
                promptMutation.mutate(
                  {
                    data: {
                      hazardType,
                      areaOrRegion: target.areaName || 'selected area',
                      radiusKm: Number(target.radiusKm),
                    },
                  },
                  {
                    onSuccess: (response: unknown) => {
                      const d = response as { data?: { prompt?: string } } | undefined;
                      const prompt = String(d?.data?.prompt ?? '');
                      if (prompt) {
                        setMessage(prompt);
                      }
                    },
                  },
                );
              }}
            >
              {t('warnings.suggestPrompt')}
            </button>
          </article>

          <article className="card">
            <h2 className="card-title">{t('warnings.targetTitle')}</h2>
            <label className="field-label">
              {t('warnings.areaName')}
              <input
                className="field"
                value={target.areaName}
                onChange={(event) =>
                  setTarget((prev) => ({ ...prev, areaName: event.target.value }))
                }
              />
            </label>
            <div className="row-3">
              <label className="field-label">
                {t('warnings.latitude')}
                <input
                  className="field"
                  value={target.latitude}
                  onChange={(event) =>
                    setTarget((prev) => ({ ...prev, latitude: event.target.value }))
                  }
                />
              </label>
              <label className="field-label">
                {t('warnings.longitude')}
                <input
                  className="field"
                  value={target.longitude}
                  onChange={(event) =>
                    setTarget((prev) => ({ ...prev, longitude: event.target.value }))
                  }
                />
              </label>
              <label className="field-label">
                {t('warnings.radiusKm')}
                <input
                  type="number"
                  min={1}
                  className="field"
                  value={target.radiusKm}
                  onChange={(event) =>
                    setTarget((prev) => ({ ...prev, radiusKm: event.target.value }))
                  }
                />
              </label>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="field-label">{t('warnings.drawTargetArea')}</label>
              <WarningMapSupport
                onTargetChange={(data) => {
                  setTarget(prev => ({
                    ...prev,
                    latitude: data.latitude?.toString() ?? prev.latitude,
                    longitude: data.longitude?.toString() ?? prev.longitude,
                    radiusKm: data.radiusKm?.toString() ?? prev.radiusKm,
                    polygonGeoJson: data.polygonGeoJson ?? '',
                  }));
                }}
              />
              {target.polygonGeoJson && (
                <p className="small success-text" style={{ marginTop: '0.5rem' }}>
                  ✓ {t('warnings.customShapeCaptured')}
                </p>
              )}
            </div>
          </article>

          <article className="card">
            <h2 className="card-title">{t('warnings.checkpointTitle')}</h2>
            <p className="warning-note">{t('warnings.checkpointNote')}</p>
            <button
              type="button"
              className="btn btn-warning"
              disabled={
                !canProceedToConfirmation({
                  title,
                  message,
                  areaName: target.areaName,
                })
              }
              onClick={() => setStep((current) => warningFlowReducer(current, { type: 'CONTINUE' }))}
            >
              {t('warnings.continueToConfirm')}
            </button>
          </article>
        </div>
      ) : (
        <article className="card">
          <h2 className="card-title">{t('warnings.confirmTitle')}</h2>
          <p className="muted">{t('warnings.reviewSummary')}</p>
          <dl className="summary-grid">
            <dt>{t('warnings.summaryTitle')}</dt>
            <dd>{summary.heading}</dd>
            <dt>{t('warnings.summaryMessage')}</dt>
            <dd>{summary.body}</dd>
            <dt>{t('warnings.summaryTarget')}</dt>
            <dd>{summary.target}</dd>
            <dt>{t('warnings.summaryEvacuationAreas')}</dt>
            <dd>{summary.evacuationCount}</dd>
          </dl>
          <div className="action-row warning-confirm-actions">
            <button
              type="button"
              className="btn btn-neutral"
              onClick={() => setStep((current) => warningFlowReducer(current, { type: 'CANCEL' }))}
            >
              {t('warnings.cancel')}
            </button>
            <button
              type="button"
              className="btn btn-critical"
              onClick={() => {
                createWarningMutation.mutate(
                  { data: payload },
                  {
                    onSuccess: () => {
                      setStep((current) => warningFlowReducer(current, { type: 'SENT' }));
                      setTitle('');
                      setMessage('');
                      saveLastWarningLocation(target);
                      setTarget(defaultTarget);
                      showToast('Warning sent successfully.', 'success');
                    },
                    onError: () => {
                      showToast('Failed to send warning.', 'error');
                    },
                  },
                );
              }}
              disabled={createWarningMutation.isPending}
            >
              {t('warnings.confirmAndSend')}
            </button>
          </div>
          {createWarningMutation.error ? (
            <p className="error-text">{t('warnings.dispatchError')}</p>
          ) : null}
        </article>
      )}

      <style jsx>{`
        .warning-page {
          display: flex;
          flex-direction: column;
          color: #e5e7eb;
        }

        .warning-modal-header-left {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .warning-modal-ribbon {
          display: inline-flex;
          align-items: stretch;
          border-right: 1px solid #334155;
          padding-right: 16px;
        }

        .ribbon-block {
          width: 12px;
          height: 32px;
        }

        .ribbon-blue {
          background: #00368e;
        }

        .ribbon-gold {
          background: #facc15;
        }

        .ribbon-red {
          background: var(--status-critical);
        }

        .warning-modal-title {
          margin: 0;
          font-size: 18px;
          letter-spacing: -0.02em;
          color: #f9fafb;
        }

        .warning-modal-step {
          margin: 4px 0 0;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #94a3b8;
        }

        .warning-modal-body {
          display: grid;
          grid-template-columns: minmax(0, 3fr) minmax(0, 2.2fr);
          gap: 1.5rem;
          padding: 24px 24px 20px;
          background: #f8fafc;
        }

        .warning-column {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .warning-section-header {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .step-pill {
          width: 32px;
          height: 32px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }

        .step-pill-primary {
          background: var(--status-critical);
          color: #ffffff;
        }

        .step-pill-secondary {
          background: #1e293b;
          color: #ffffff;
        }

        .warning-field-group {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .hazard-toggle-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 4px;
        }

        .hazard-chip {
          border-radius: 6px;
          border: 2px solid #e2e8f0;
          background: #ffffff;
          padding: 8px 16px;
          font-size: 12px;
          text-transform: uppercase;
          font-weight: 700;
          cursor: pointer;
        }

        .hazard-chip-active {
          background: #fef2f2;
          border-color: var(--status-critical);
          color: var(--status-critical);
        }

        .warning-message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
          margin-top: 0.25rem;
        }

        .field-label-heading {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 4px;
        }

        .suggest-prompt-chip {
          border-radius: 9999px;
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 600;
          color: #2563eb;
          cursor: pointer;
          min-height: 0;
        }

        .warning-message-input {
          resize: vertical;
        }

        .character-helper {
          text-align: right;
        }

        .warning-severity-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .severity-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .severity-chip {
          border-radius: 9999px;
          border: 1px solid #cbd5e1;
          padding: 6px 14px;
          font-size: 12px;
          text-transform: uppercase;
          background: #ffffff;
          cursor: pointer;
        }

        .severity-chip-active {
          background: #1d4ed8;
          color: #ffffff;
          border-color: #1d4ed8;
        }

        .warning-target-column {
          background: #f8fafc;
        }

        .warning-latlng-row {
          align-items: flex-end;
        }

        .radius-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 4px;
          align-items: center;
        }

        .radius-unit {
          padding-right: 4px;
        }

        .warning-map-shell {
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          background: #ffffff;
          display: flex;
          flex-direction: column;
        }

        .warning-map-header {
          padding: 8px 10px;
          border-bottom: 1px solid #e2e8f0;
          background: rgba(248, 250, 252, 0.9);
        }

        .warning-map-body {
          padding: 10px;
        }

        .warning-map-success {
          margin-top: 0.5rem;
        }

        .warning-shape-info {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .coordinate-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 0.75rem;
        }

        .coordinate-card {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #ffffff;
          padding: 0.75rem;
        }

        .coordinate-card-label {
          margin: 0 0 0.4rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .warning-map-footer {
          padding: 8px 10px 10px;
          border-top: 1px solid #e2e8f0;
          background: #eff6ff;
        }

        .warning-map-population {
          color: #1d4ed8;
          font-weight: 700;
        }

        .warning-modal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .footer-stage-indicator {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #94a3b8;
        }

        .footer-stage-dot {
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: var(--status-critical);
          box-shadow: 0 0 0 2px #ffffff;
        }

        .footer-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .footer-primary {
          min-width: 260px;
          text-transform: none;
        }

        .warning-confirm-card {
          max-width: 800px;
        }

        .warning-summary {
          margin-top: 1rem;
        }

        .warning-confirm-actions {
          margin-top: 1.25rem;
          justify-content: flex-end;
        }

        @media (max-width: 1024px) {
          .warning-modal-body {
            grid-template-columns: minmax(0, 1fr);
          }

          .warning-target-column {
            order: 2;
          }
        }

        @media (max-width: 640px) {
          .warning-modal-shell {
            border-radius: 10px;
          }

          .warning-modal-body {
            padding: 16px 12px 12px;
          }

          .warning-modal-footer {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .footer-actions {
            width: 100%;
            flex-direction: column-reverse;
          }

          .footer-primary {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}
