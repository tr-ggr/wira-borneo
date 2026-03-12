'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getApiClientBaseUrl } from '@wira-borneo/api-client';

interface AssetEntry {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  assets: string[];
  volunteerStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | null;
}

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'PENDING' },
  { value: 'APPROVED', label: 'APPROVED' },
  { value: 'REJECTED', label: 'REJECTED' },
  { value: 'SUSPENDED', label: 'SUSPENDED' },
];

function toAssetEntries(raw: unknown): AssetEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw as AssetEntry[];
}

function exportAssetRegistryToCsv(entries: AssetEntry[]) {
  const headers = ['Owner', 'Email', 'Volunteer Status', 'Assets'];
  const rows = entries.map((e) => [
    e.name,
    e.email,
    e.volunteerStatus ?? '',
    e.assets.join('; '),
  ]);
  const csv = [
    headers.join(','),
    ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `asset-registry-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function fetchAssetRegistry(): Promise<AssetEntry[]> {
  const base = getApiClientBaseUrl()?.trim() || 'http://localhost:3333';
  const url = `${base.replace(/\/$/, '')}/api/admin/assets/registry`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load asset registry');
  const data = await res.json();
  return toAssetEntries(data?.data ?? data);
}

export function AssetRegistryPage() {
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'assets', 'registry'],
    queryFn: fetchAssetRegistry,
  });

  const allEntries = data ?? [];
  const entries = useMemo(() => {
    const byStatus =
      status === 'ALL' ? allEntries : allEntries.filter((e) => e.volunteerStatus === status);
    const q = search.trim().toLowerCase();
    const searched = !q
      ? byStatus
      : byStatus.filter((e) => {
          const id = e.id ?? '';
          return (
            e.name.toLowerCase().includes(q) ||
            e.email.toLowerCase().includes(q) ||
            id.toLowerCase().includes(q) ||
            id.slice(-6).toLowerCase().includes(q) ||
            e.assets.some((a) => a.toLowerCase().includes(q))
          );
        });

    return [...searched].sort((a, b) => {
      const at = new Date(a.createdAt).getTime();
      const bt = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? bt - at : at - bt;
    });
  }, [allEntries, status, search, sortOrder]);

  return (
    <section className="page-shell">
      <div className="volunteer-registry-section">
        <header className="volunteer-registry-header">
          <div>
            <h1 className="volunteer-registry-title">Asset Registry</h1>
            <p className="volunteer-registry-subtitle">
              Vehicles and equipment volunteered for use in disaster response (cars, boats, etc.).
            </p>
          </div>
          <button
            type="button"
            className="volunteer-registry-export-btn"
            onClick={() => exportAssetRegistryToCsv(entries)}
            disabled={entries.length === 0}
          >
            Export CSV
          </button>
        </header>

        {isLoading && (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p className="muted">Loading asset registry…</p>
          </div>
        )}
        {error && (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p className="error-text">Unable to load asset registry.</p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div style={{ padding: '16px 16px 0' }}>
              <form
                onSubmit={(e) => e.preventDefault()}
                style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}
              >
                <input
                  type="search"
                  className="input"
                  placeholder="Search owner, email, asset, or ID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: '100%', flex: 1 }}
                />
                <button type="submit" className="btn btn-neutral">
                  Search
                </button>
              </form>
            </div>
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
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {STATUS_FILTERS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`chip ${status === value ? 'chip-active' : ''}`}
                    onClick={() => setStatus(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <select
                  className="input small"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                >
                  <option value="desc">Newest</option>
                  <option value="asc">Oldest</option>
                </select>
              </div>
            </div>
            <div className="volunteer-table-wrap">
              <table className="volunteer-table">
                <thead>
                  <tr>
                    <th>Owner</th>
                    <th>Email</th>
                    <th>Assets</th>
                    <th>Volunteer status</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>
                        <p className="muted">No volunteered assets registered yet.</p>
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry) => (
                      <tr key={entry.id}>
                        <td>
                          <div className="volunteer-table-name-cell">
                            <div className="volunteer-table-name">{entry.name}</div>
                            <div className="volunteer-table-id">
                              ID: #{entry.id.slice(-6).toUpperCase()}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="volunteer-table-notes">{entry.email}</span>
                        </td>
                        <td>
                          <ul
                            className="volunteer-table-notes"
                            style={{
                              listStyle: 'none',
                              padding: 0,
                              margin: 0,
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '0.25rem',
                            }}
                          >
                            {entry.assets.map((asset, i) => (
                              <li
                                key={i}
                                style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  background: 'var(--bg-subtle, #f1f5f9)',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                }}
                              >
                                {asset}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td>
                          {entry.volunteerStatus ? (
                            <span
                              className={`volunteer-table-status-pill ${entry.volunteerStatus.toLowerCase()}`}
                            >
                              {entry.volunteerStatus}
                            </span>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <footer className="volunteer-registry-footer">
              {status === 'ALL'
                ? `Showing ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`
                : `Showing ${entries.length} of ${allEntries.length} ${status.toLowerCase()} entr${entries.length === 1 ? 'y' : 'ies'}`}
            </footer>
          </>
        )}
      </div>
    </section>
  );
}
