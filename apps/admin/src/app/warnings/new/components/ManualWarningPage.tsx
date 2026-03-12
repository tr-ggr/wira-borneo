'use client';

import {
  useAdminOperationsControllerCreateWarning,
  useAdminOperationsControllerGetPromptSuggestion,
  useEvacuationControllerAreas,
} from '@wira-borneo/api-client';
import { useMemo, useState } from 'react';
import { useI18n } from '../../../../i18n/context';
import {
  canProceedToConfirmation,
  warningFlowReducer,
  warningSummary,
} from './warning-flow.utils';
import WarningMapSupport from './WarningMapSupport';

type HazardType = 'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK';
type SeverityLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

interface EvacuationArea {
  id: string;
  name: string;
  region?: string | null;
}

const defaultTarget = {
  areaName: '',
  latitude: '',
  longitude: '',
  radiusKm: '5',
  polygonGeoJson: '',
};

function toAreas(raw: unknown): EvacuationArea[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw as EvacuationArea[];
}

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
  const [selectedEvacuationAreas, setSelectedEvacuationAreas] = useState<string[]>([]);

  useEvacuationControllerAreas({
    query: { select: (response: unknown) => toAreas(response) },
  });
  const promptMutation = useAdminOperationsControllerGetPromptSuggestion();
  const createWarningMutation = useAdminOperationsControllerCreateWarning();

  const payload = useMemo(
    () => ({
      title,
      message,
      hazardType,
      severity,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
      suggestedPrompt: (() => {
        const d = promptMutation.data as unknown as { data?: { prompt?: string } } | undefined;
        return d?.data ? String(d.data.prompt ?? '') : undefined;
      })(),
      targets: [
        {
          areaName: target.areaName,
          latitude: target.latitude ? Number(target.latitude) : undefined,
          longitude: target.longitude ? Number(target.longitude) : undefined,
          radiusKm: target.radiusKm ? Number(target.radiusKm) : undefined,
          polygonGeoJson: target.polygonGeoJson || undefined,
        },
      ],
      evacuationAreaIds: selectedEvacuationAreas,
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
      selectedEvacuationAreas,
    ],
  );

  const summary = warningSummary({
    title: payload.title,
    message: payload.message,
    areaName: payload.targets[0].areaName,
    radiusKm: payload.targets[0].radiusKm,
    evacuationCount: payload.evacuationAreaIds.length,
  });

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
          <div className="action-row">
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
                      setTarget(defaultTarget);
                      setSelectedEvacuationAreas([]);
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
    </section>
  );
}
