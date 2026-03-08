'use client';

import {
  useAdminOperationsControllerCreateWarning,
  useAdminOperationsControllerGetPromptSuggestion,
  useEvacuationControllerAreas,
} from '@wira-borneo/api-client';
import { useMemo, useState } from 'react';
import {
  canProceedToConfirmation,
  warningFlowReducer,
  warningSummary,
} from './warning-flow.utils';

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
};

function toAreas(raw: unknown): EvacuationArea[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw as EvacuationArea[];
}

export function ManualWarningPage() {
  const [step, setStep] = useState<'compose' | 'confirm'>('compose');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [hazardType, setHazardType] = useState<HazardType>('FLOOD');
  const [severity, setSeverity] = useState<SeverityLevel>('HIGH');
  const [startsAt, setStartsAt] = useState(new Date().toISOString().slice(0, 16));
  const [endsAt, setEndsAt] = useState('');
  const [target, setTarget] = useState(defaultTarget);
  const [selectedEvacuationAreas, setSelectedEvacuationAreas] = useState<string[]>([]);

  const areasQuery = useEvacuationControllerAreas({
    query: { select: (response) => toAreas(response.data) },
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
      suggestedPrompt: promptMutation.data?.data
        ? String((promptMutation.data.data as { prompt?: string }).prompt ?? '')
        : undefined,
      targets: [
        {
          areaName: target.areaName,
          latitude: target.latitude ? Number(target.latitude) : undefined,
          longitude: target.longitude ? Number(target.longitude) : undefined,
          radiusKm: target.radiusKm ? Number(target.radiusKm) : undefined,
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
        <p className="eyebrow">Manual Warning Dispatch</p>
        <h1 className="title">Send Warning / Hantar Amaran</h1>
        <p className="subtitle">
          Dispatch is manual only. Review all details before final confirmation.
        </p>
      </header>

      {step === 'compose' ? (
        <div className="grid-list">
          <article className="card">
            <h2 className="card-title">1) Compose Message / Karang Mesej</h2>
            <label className="field-label">
              Title
              <input className="field" value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className="field-label">
              Message
              <textarea
                className="field"
                rows={5}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </label>
            <div className="row-2">
              <label className="field-label">
                Hazard
                <select
                  className="field"
                  value={hazardType}
                  onChange={(event) => setHazardType(event.target.value as HazardType)}
                >
                  <option value="FLOOD">Flood</option>
                  <option value="TYPHOON">Typhoon</option>
                  <option value="EARTHQUAKE">Earthquake</option>
                  <option value="AFTERSHOCK">Aftershock</option>
                </select>
              </label>
              <label className="field-label">
                Severity
                <select
                  className="field"
                  value={severity}
                  onChange={(event) => setSeverity(event.target.value as SeverityLevel)}
                >
                  <option value="LOW">Low</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </label>
            </div>
            <div className="row-2">
              <label className="field-label">
                Start (MYT)
                <input
                  type="datetime-local"
                  className="field"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                />
              </label>
              <label className="field-label">
                End (optional)
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
                    onSuccess: (response) => {
                      const prompt = String(
                        ((response.data as { prompt?: string } | undefined)?.prompt ?? ''),
                      );
                      if (prompt) {
                        setMessage(prompt);
                      }
                    },
                  },
                );
              }}
            >
              Suggest Prompt / Cadang Teks
            </button>
          </article>

          <article className="card">
            <h2 className="card-title">2) Target Area / Kawasan Sasaran</h2>
            <label className="field-label">
              Area or Region Name
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
                Latitude
                <input
                  className="field"
                  value={target.latitude}
                  onChange={(event) =>
                    setTarget((prev) => ({ ...prev, latitude: event.target.value }))
                  }
                />
              </label>
              <label className="field-label">
                Longitude
                <input
                  className="field"
                  value={target.longitude}
                  onChange={(event) =>
                    setTarget((prev) => ({ ...prev, longitude: event.target.value }))
                  }
                />
              </label>
              <label className="field-label">
                Radius (km)
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

            <h3 className="small-title">Recommended Evacuation Areas</h3>
            <div className="selection-list">
              {(areasQuery.data ?? []).map((area) => {
                const checked = selectedEvacuationAreas.includes(area.id);
                return (
                  <label key={area.id} className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        setSelectedEvacuationAreas((current) => {
                          if (event.target.checked) {
                            return [...current, area.id];
                          }
                          return current.filter((value) => value !== area.id);
                        });
                      }}
                    />
                    <span>{area.name}</span>
                    <span className="muted">{area.region ?? 'Unknown region'}</span>
                  </label>
                );
              })}
            </div>
          </article>

          <article className="card">
            <h2 className="card-title">3) Final Checkpoint / Semakan Akhir</h2>
            <p className="warning-note">
              Dispatch is never automatic. Admin must manually confirm every warning send.
            </p>
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
              Continue to Confirmation / Teruskan
            </button>
          </article>
        </div>
      ) : (
        <article className="card">
          <h2 className="card-title">Confirm Warning Dispatch / Sahkan Amaran</h2>
          <p className="muted">Review summary before sending.</p>
          <dl className="summary-grid">
            <dt>Title</dt>
            <dd>{summary.heading}</dd>
            <dt>Message</dt>
            <dd>{summary.body}</dd>
            <dt>Target</dt>
            <dd>{summary.target}</dd>
            <dt>Evacuation Areas</dt>
            <dd>{summary.evacuationCount}</dd>
          </dl>
          <div className="action-row">
            <button
              type="button"
              className="btn btn-neutral"
              onClick={() => setStep((current) => warningFlowReducer(current, { type: 'CANCEL' }))}
            >
              Cancel / Batal
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
              Confirm and Send / Sahkan & Hantar
            </button>
          </div>
          {createWarningMutation.error ? (
            <p className="error-text">Unable to dispatch warning.</p>
          ) : null}
        </article>
      )}
    </section>
  );
}
