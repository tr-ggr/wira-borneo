'use client';

import {
  useAdminOperationsControllerListVolunteerApplications,
  useAdminOperationsControllerMapOverview,
  useAdminOperationsControllerWeatherForecast,
} from '@wira-borneo/api-client';
import Link from 'next/link';
import { useMemo } from 'react';
import { useAuth } from '../lib/auth';

type HazardType = 'FLOOD' | 'TYPHOON' | 'EARTHQUAKE' | 'AFTERSHOCK';
type SeverityLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
type VolunteerStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

interface RegionRisk {
  id: string;
  hazardType: HazardType;
  severity: SeverityLevel;
  name?: string;
}

interface PinStatus {
  id: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED';
  hazardType: HazardType;
}

interface UserHelpRequest {
  id: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'CLAIMED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
  hazardType: HazardType;
}

interface UserLocation {
  id: string;
  userId: string;
}

interface VolunteerApplication {
  id: string;
  status: VolunteerStatus;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface MapOverviewPayload {
  vulnerableRegions: RegionRisk[];
  pinStatuses: PinStatus[];
  userLocations: UserLocation[];
  helpRequests: UserHelpRequest[];
}

interface ForecastPayload {
  current_weather?: Record<string, number | string | null>;
  daily?: Record<string, Array<number | string | null>>;
  daily_units?: Record<string, string>;
}

function toVolunteerApplications(raw: unknown): VolunteerApplication[] {
  if (Array.isArray(raw)) {
    return raw as VolunteerApplication[];
  }

  if (
    raw &&
    typeof raw === 'object' &&
    Array.isArray((raw as { data?: unknown }).data)
  ) {
    return (raw as { data: VolunteerApplication[] }).data;
  }

  return [];
}

function toMapOverview(raw: unknown): MapOverviewPayload {
  if (!raw || typeof raw !== 'object') {
    return {
      vulnerableRegions: [],
      pinStatuses: [],
      userLocations: [],
      helpRequests: [],
    };
  }

  const input = raw as Record<string, unknown>;
  return {
    vulnerableRegions: Array.isArray(input.vulnerableRegions)
      ? (input.vulnerableRegions as RegionRisk[])
      : [],
    pinStatuses: Array.isArray(input.pinStatuses)
      ? (input.pinStatuses as PinStatus[])
      : [],
    userLocations: Array.isArray(input.userLocations)
      ? (input.userLocations as UserLocation[])
      : [],
    helpRequests: Array.isArray(input.helpRequests)
      ? (input.helpRequests as UserHelpRequest[])
      : [],
  };
}

function toForecast(raw: unknown): ForecastPayload | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  return raw as ForecastPayload;
}

function toPercent(part: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.round((part / total) * 100);
}

function getWeatherLabel(code?: number | null): string {
  if (code == null) {
    return 'No weather code';
  }
  if (code <= 1) {
    return 'Clear to partly cloudy';
  }
  if (code <= 3) {
    return 'Cloudy';
  }
  if (code <= 67) {
    return 'Rain activity';
  }
  return 'Severe weather signal';
}

export default function HomePage() {
  const { user } = useAuth();

  const mapOverviewQuery = useAdminOperationsControllerMapOverview({
    query: {
      select: (response) => toMapOverview(response),
    },
  });

  const pendingApplicationsQuery =
    useAdminOperationsControllerListVolunteerApplications(
      {
        status: 'PENDING',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
      {
        query: {
          select: (response: unknown) => toVolunteerApplications(response),
        },
      },
    );

  const approvedApplicationsQuery =
    useAdminOperationsControllerListVolunteerApplications(
      {
        status: 'APPROVED',
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      },
      {
        query: {
          select: (response: unknown) => toVolunteerApplications(response),
        },
      },
    );

  const weatherQuery = useAdminOperationsControllerWeatherForecast(
    {
      latitude: 14.5995,
      longitude: 120.9842,
      current_weather: true,
      daily: 'precipitation_sum,wind_speed_10m_max',
      forecast_days: 1,
      timezone: 'auto',
    },
    {
      query: {
        select: (response) => toForecast(response),
      },
    },
  );

  const overview = mapOverviewQuery.data ?? {
    vulnerableRegions: [],
    pinStatuses: [],
    userLocations: [],
    helpRequests: [],
  };

  const pendingApplications = pendingApplicationsQuery.data ?? [];
  const approvedApplications = approvedApplicationsQuery.data ?? [];

  const criticalRegions = useMemo(
    () =>
      overview.vulnerableRegions.filter(
        (risk) => risk.severity === 'CRITICAL' || risk.severity === 'HIGH',
      ),
    [overview.vulnerableRegions],
  );

  const openPins = useMemo(
    () =>
      overview.pinStatuses.filter(
        (pin) => pin.status === 'OPEN' || pin.status === 'IN_PROGRESS',
      ).length,
    [overview.pinStatuses],
  );

  const urgentHelpRequests = useMemo(
    () =>
      overview.helpRequests.filter(
        (request) =>
          (request.urgency === 'HIGH' || request.urgency === 'CRITICAL') &&
          (request.status === 'OPEN' ||
            request.status === 'CLAIMED' ||
            request.status === 'IN_PROGRESS'),
      ).length,
    [overview.helpRequests],
  );

  const activeDeployments = useMemo(
    () =>
      overview.helpRequests.filter(
        (request) => request.status === 'IN_PROGRESS',
      ).length,
    [overview.helpRequests],
  );

  const standbyVolunteers = approvedApplications.length;
  const totalVolunteers =
    approvedApplications.length + pendingApplications.length;
  const activePercent = toPercent(
    activeDeployments,
    Math.max(totalVolunteers, 1),
  );
  const standbyPercent = toPercent(
    standbyVolunteers,
    Math.max(totalVolunteers, 1),
  );

  const hazardMix = useMemo(() => {
    const counts: Record<HazardType, number> = {
      FLOOD: 0,
      TYPHOON: 0,
      EARTHQUAKE: 0,
      AFTERSHOCK: 0,
    };

    overview.helpRequests.forEach((request) => {
      counts[request.hazardType] += 1;
    });

    return counts;
  }, [overview.helpRequests]);

  const weather = weatherQuery.data;
  const currentCode = Number(weather?.current_weather?.weathercode ?? NaN);
  const precipitation = Number(weather?.daily?.precipitation_sum?.[0] ?? 0);
  const windSpeed = Number(weather?.daily?.wind_speed_10m_max?.[0] ?? 0);
  const precipitationUnit = weather?.daily_units?.precipitation_sum ?? 'mm';
  const windUnit = weather?.daily_units?.wind_speed_10m_max ?? 'km/h';

  const totalHazards =
    hazardMix.FLOOD +
    hazardMix.TYPHOON +
    hazardMix.EARTHQUAKE +
    hazardMix.AFTERSHOCK;
  const floodPct = toPercent(hazardMix.FLOOD, Math.max(totalHazards, 1));
  const typhoonPct = toPercent(hazardMix.TYPHOON, Math.max(totalHazards, 1));
  const quakePct = toPercent(
    hazardMix.EARTHQUAKE + hazardMix.AFTERSHOCK,
    Math.max(totalHazards, 1),
  );

  const loadingDashboard =
    mapOverviewQuery.isLoading || pendingApplicationsQuery.isLoading;

  return (
    <section className="ops-dashboard page-shell">
      <div className="ops-dashboard-bg rounded-2xl border border-slate-200/80 p-6 md:p-8">
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Live Operations
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Operational Overview
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Manual command dashboard for risk, warnings, and volunteer
              readiness.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              Duty Officer: {user?.name ?? 'Admin'}
            </div>
            <Link
              href="/warnings/new"
              className="rounded-lg bg-[#193ce6] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#132fb4]"
            >
              Create Incident
            </Link>
          </div>
        </div>

        {loadingDashboard ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm font-medium text-slate-600">
            Loading dashboard intelligence...
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">
                  Live Intelligence
                </h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  Real-time Feed
                </span>
              </div>

              <div className="grid grid-cols-12 gap-6">
                <article className="col-span-12 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-4">
                  <div className="flex items-center justify-between bg-[#e73c08] px-4 py-3 text-white">
                    <p className="text-xs font-black uppercase tracking-[0.15em]">
                      Weather Warning
                    </p>
                    <span className="rounded bg-white px-2 py-0.5 text-[10px] font-black text-[#e73c08]">
                      MANUAL WATCH
                    </span>
                  </div>
                  <div className="space-y-5 p-5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        Precipitation Forecast
                      </p>
                      <div className="mt-1 flex items-end gap-2">
                        <p className="text-2xl font-black text-slate-900">
                          {Number.isFinite(precipitation)
                            ? precipitation.toFixed(1)
                            : '0.0'}{' '}
                          {precipitationUnit}
                        </p>
                        <span className="pb-1 text-xs font-semibold text-[#e73c08]">
                          today
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        Weather Signal
                      </p>
                      <p className="mt-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
                        {getWeatherLabel(
                          Number.isFinite(currentCode) ? currentCode : null,
                        )}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          Wind Speed
                        </p>
                        <p className="text-xl font-black text-slate-900">
                          {Number.isFinite(windSpeed)
                            ? windSpeed.toFixed(0)
                            : '0'}{' '}
                          {windUnit}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          Elevated Regions
                        </p>
                        <p className="text-xl font-black text-[#e73c08]">
                          {criticalRegions.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>

                <article className="relative col-span-12 h-[380px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-8">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#dbeafe,transparent_35%),radial-gradient(circle_at_80%_80%,#fee2e2,transparent_40%),linear-gradient(120deg,#f8fafc_0%,#eef2ff_100%)]" />
                  <div className="relative flex h-full flex-col justify-between p-6">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        Operations Map Summary
                      </p>
                      <h3 className="mt-2 text-2xl font-black text-slate-900">
                        Manila Command View
                      </h3>
                      <p className="mt-2 max-w-xl text-sm text-slate-600">
                        Pulled from /admin/map/overview using current pin
                        statuses, vulnerable regions, and active help requests.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="rounded-lg border border-slate-200 bg-white/90 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                          Open or In Progress Pins
                        </p>
                        <p className="mt-1 text-2xl font-black text-slate-900">
                          {openPins}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white/90 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                          Urgent Help Requests
                        </p>
                        <p className="mt-1 text-2xl font-black text-[#e73c08]">
                          {urgentHelpRequests}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white/90 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                          Active Location Snapshots
                        </p>
                        <p className="mt-1 text-2xl font-black text-slate-900">
                          {overview.userLocations.length}
                        </p>
                      </div>
                    </div>

                    <div className="absolute bottom-6 left-6 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700">
                      <p className="mb-1">Legend</p>
                      <div className="flex items-center gap-2">
                        <span className="inline-block size-2 rounded-full bg-[#e73c08]" />{' '}
                        Critical
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block size-2 rounded-full bg-[#193ce6]" />{' '}
                        Active Response
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block size-2 rounded-full bg-[#ffcc00]" />{' '}
                        Monitoring
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">
                  Flood Risk Analytics
                </h2>
              </div>

              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 grid grid-cols-1 gap-6 md:grid-cols-3 lg:col-span-8">
                  <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Alert Status Gauge
                    </p>
                    <div className="mt-5">
                      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full w-1/3 bg-green-500" />
                        <div className="h-full w-1/3 bg-[#ffcc00]" />
                        <div className="h-full w-1/3 bg-[#e73c08]" />
                      </div>
                      <p className="mt-3 text-xl font-black text-[#e73c08]">
                        {criticalRegions.length > 0
                          ? 'Critical State'
                          : 'Monitoring State'}
                      </p>
                    </div>
                  </article>

                  <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Probability Index
                    </p>
                    <h3 className="mt-3 text-lg font-bold text-slate-900">
                      {criticalRegions.length > 0
                        ? `High risk in ${criticalRegions[0]?.name ?? 'priority region'}`
                        : 'No critical region currently'}
                    </h3>
                    <p className="mt-2 text-xs text-slate-500">
                      Based on critical/high entries in RiskRegionSnapshot.
                    </p>
                    <div className="mt-4 flex gap-1">
                      <div className="h-1 flex-1 rounded-full bg-[#e73c08]" />
                      <div className="h-1 flex-1 rounded-full bg-[#e73c08]" />
                      <div className="h-1 flex-1 rounded-full bg-[#e73c08]" />
                      <div className="h-1 flex-1 rounded-full bg-slate-200" />
                    </div>
                  </article>

                  <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Predicted Inundation
                    </p>
                    <p className="mt-2 text-2xl font-black text-slate-900">
                      {Math.max(criticalRegions.length * 0.2, 0.2).toFixed(1)}m
                    </p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                      Estimated depth proxy from critical region density
                    </p>
                    <p className="mt-5 text-xs font-semibold text-[#193ce6]">
                      Action: Evacuation Stage{' '}
                      {criticalRegions.length > 2 ? '2' : '1'}
                    </p>
                  </article>
                </div>

                <div className="col-span-12 lg:col-span-4">
                  <article className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#e73c08] to-red-700 p-6 text-white shadow-lg">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                      Urgent Dispatch
                    </p>
                    <h3 className="mt-3 text-2xl font-bold">SOS Alert Pulse</h3>
                    <p className="mt-2 text-sm text-white/80">
                      {urgentHelpRequests > 0
                        ? `${urgentHelpRequests} high-priority help request(s) need immediate verification.`
                        : 'No high-priority SOS requests at this moment.'}
                    </p>
                    <Link
                      href="/map"
                      className="mt-5 inline-flex rounded-lg bg-white/95 px-3 py-2 text-xs font-bold text-red-700"
                    >
                      Open Map Analytics
                    </Link>
                  </article>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">
                  Volunteer Force
                </h2>
              </div>

              <div className="grid grid-cols-12 gap-6">
                <article className="col-span-12 rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Deployment Status
                  </p>
                  <div className="mt-6 space-y-5">
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-700">
                          Active Duty
                        </p>
                        <p className="text-2xl font-black text-slate-900">
                          {activeDeployments}
                        </p>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${activePercent}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-700">
                          On Standby
                        </p>
                        <p className="text-2xl font-black text-slate-900">
                          {standbyVolunteers}
                        </p>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full bg-[#193ce6]"
                          style={{ width: `${standbyPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </article>

                <article className="col-span-12 rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Hazard Load Distribution
                  </p>
                  <div className="mt-6 grid grid-cols-[120px_1fr] items-center gap-4">
                    <div className="relative size-28 rounded-full border-[14px] border-slate-100">
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `conic-gradient(#193ce6 0% ${floodPct}%, #e73c08 ${floodPct}% ${
                            floodPct + typhoonPct
                          }%, #ffcc00 ${floodPct + typhoonPct}% 100%)`,
                        }}
                      />
                      <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white">
                        <p className="text-xl font-black text-slate-900">
                          {totalHazards}
                        </p>
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                          total
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 text-[11px] font-bold text-slate-700">
                      <p>Flood ({floodPct}%)</p>
                      <p>Typhoon ({typhoonPct}%)</p>
                      <p>Quake/Aftershock ({quakePct}%)</p>
                    </div>
                  </div>
                </article>

                <article className="col-span-12 rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Pending Approvals
                    </p>
                    <span className="rounded-lg bg-[#e73c08] px-2 py-0.5 text-[10px] font-black text-white">
                      {pendingApplications.length} NEW
                    </span>
                  </div>
                  <div className="ops-scrollbar max-h-[220px] space-y-3 overflow-y-auto pr-2">
                    {pendingApplications.slice(0, 6).map((application) => (
                      <div
                        key={application.id}
                        className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {application.user?.name ?? 'Unnamed volunteer'}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {application.user?.email ?? 'No email'}
                          </p>
                        </div>
                        <span className="text-xs font-black text-[#193ce6]">
                          PENDING
                        </span>
                      </div>
                    ))}
                    {pendingApplications.length === 0 ? (
                      <p className="text-xs font-medium text-slate-500">
                        No pending applications right now.
                      </p>
                    ) : null}
                  </div>
                  <Link
                    href="/volunteers"
                    className="mt-4 block rounded-lg bg-slate-900 py-2 text-center text-xs font-bold text-white transition hover:bg-slate-800"
                  >
                    Review Queue
                  </Link>
                </article>
              </div>
            </section>
          </div>
        )}
      </div>
    </section>
  );
}
