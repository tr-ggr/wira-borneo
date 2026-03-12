'use client';

import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  useAdminOperationsControllerGetAssetRegistry, 
  useAdminOperationsControllerReviewAsset,
  getAdminOperationsControllerGetAssetRegistryQueryKey
} from '@wira-borneo/api-client';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Download, 
  User, 
  Mail, 
  Calendar,
  ExternalLink,
  MapPin,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

const STATUS_FILTERS: { value: StatusFilter; label: string; icon: any; color: string }[] = [
  { value: 'ALL', label: 'All Assets', icon: Filter, color: 'text-slate-500' },
  { value: 'PENDING', label: 'Pending', icon: Clock, color: 'text-amber-500' },
  { value: 'APPROVED', label: 'Approved', icon: CheckCircle2, color: 'text-emerald-500' },
  { value: 'REJECTED', label: 'Rejected', icon: XCircle, color: 'text-rose-500' },
];

export function AssetRegistryPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandingId, setExpandingId] = useState<string | null>(null);

  const { data: entries, isLoading, error } = useAdminOperationsControllerGetAssetRegistry();
  
  const reviewAsset = useAdminOperationsControllerReviewAsset({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminOperationsControllerGetAssetRegistryQueryKey() });
      }
    }
  });

  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    
    let result = [...entries];

    // Filter by status
    if (status !== 'ALL') {
      result = result.filter(e => e.status === status);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e => 
        e.name.toLowerCase().includes(q) ||
        (e.description?.toLowerCase().includes(q)) ||
        e.ownerName.toLowerCase().includes(q) ||
        e.ownerEmail.toLowerCase().includes(q)
      );
    }

    // Sort
    return result.sort((a, b) => {
      const at = new Date(a.createdAt).getTime();
      const bt = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? bt - at : at - bt;
    });
  }, [entries, status, search, sortOrder]);

  const handleReview = (id: string, action: 'APPROVE' | 'REJECT') => {
    reviewAsset.mutate({
      id,
      data: { action }
    });
  };

  const exportCsv = () => {
    if (!filteredEntries.length) return;
    const headers = ['Asset ID', 'Name', 'Status', 'Owner', 'Email', 'Location', 'Registered At'];
    const rows = filteredEntries.map(e => [
      e.id,
      e.name,
      e.status,
      e.ownerName,
      e.ownerEmail,
      e.latitude ? `${e.latitude},${e.longitude}` : 'N/A',
      new Date(e.createdAt).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `asset-registry-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-asean-blue rounded-full animate-spin" />
        <p className="text-slate-500 font-medium">Fetching asset registry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-rose-500 space-y-2">
        <XCircle size={48} />
        <p className="font-bold">Failed to load registry</p>
        <p className="text-sm opacity-80">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Asset Registry</h1>
          <p className="text-slate-500 mt-1">Review and manage volunteer vehicles and equipment</p>
        </div>
        
        <button 
          onClick={exportCsv}
          disabled={!filteredEntries.length}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={18} />
          Export CSV
        </button>
      </header>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search by asset name, owner, or description..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-asean-blue/20 focus:border-asean-blue outline-none transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex p-1 bg-slate-100 rounded-xl w-full md:w-auto">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatus(f.value)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  status === f.value 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <f.icon size={16} className={status === f.value ? f.color : 'text-slate-400'} />
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <select 
          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-asean-blue/20 transition-all shadow-sm font-semibold text-slate-700"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      {/* Table Interface */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Asset Info</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Owner Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                    No assets found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <React.Fragment key={entry.id}>
                    <tr className={`hover:bg-slate-50 transition-colors cursor-pointer ${expandingId === entry.id ? 'bg-slate-50/50' : ''}`}
                        onClick={() => setExpandingId(expandingId === entry.id ? null : entry.id)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            entry.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                            entry.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' :
                            'bg-amber-50 text-amber-600'
                          }`}>
                            <Filter size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{entry.name}</p>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">#{entry.id.split('-')[0].toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                            <User size={14} className="text-slate-400" />
                            {entry.ownerName}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Mail size={14} className="text-slate-400" />
                            {entry.ownerEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                          entry.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          entry.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                          'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {entry.status === 'APPROVED' && <CheckCircle2 size={12} />}
                          {entry.status === 'REJECTED' && <XCircle size={12} />}
                          {entry.status === 'PENDING' && <Clock size={12} />}
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                          {entry.status === 'PENDING' ? (
                            <>
                              <button 
                                onClick={() => handleReview(entry.id, 'APPROVE')}
                                disabled={reviewAsset.isPending}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Approve"
                              >
                                <CheckCircle2 size={20} />
                              </button>
                              <button 
                                onClick={() => handleReview(entry.id, 'REJECT')}
                                disabled={reviewAsset.isPending}
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <XCircle size={20} />
                              </button>
                            </>
                          ) : (
                            <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                              <ExternalLink size={18} />
                            </button>
                          )}
                          {expandingId === entry.id ? <ChevronUp size={18} className="text-slate-300 ml-2" /> : <ChevronDown size={18} className="text-slate-300 ml-2" />}
                        </div>
                      </td>
                    </tr>
                    
                    {expandingId === entry.id && (
                      <tr className="bg-slate-50/30">
                        <td colSpan={4} className="px-8 py-6 border-l-4 border-asean-blue">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description</h4>
                                <p className="text-slate-700 bg-white p-4 rounded-xl border border-slate-100 text-sm leading-relaxed">
                                  {entry.description || 'No description provided.'}
                                </p>
                              </div>
                              <div className="flex items-center gap-6">
                                <div>
                                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Registered</h4>
                                  <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Calendar size={16} />
                                    {new Date(entry.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Base Location</h4>
                                  <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <MapPin size={16} />
                                    {entry.latitude ? `${entry.latitude.toFixed(4)}, ${entry.longitude?.toFixed(4)}` : 'No GPS Tag'}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Review Summary</h4>
                              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                                <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-500">Owner Verification</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    entry.volunteerStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                  }`}>
                                    PROFILE: {entry.volunteerStatus || 'NOT_VOLUNTEER'}
                                  </span>
                                </div>
                                <div className="p-6 text-center space-y-4">
                                  {entry.status === 'PENDING' ? (
                                    <>
                                      <p className="text-sm text-slate-500 max-w-xs mx-auto">Please confirm if this asset meets safety requirements for disaster response deployment.</p>
                                      <div className="flex items-center gap-3">
                                        <button 
                                          onClick={() => handleReview(entry.id, 'REJECT')}
                                          disabled={reviewAsset.isPending}
                                          className="flex-1 py-2.5 rounded-xl border-2 border-rose-100 text-rose-600 font-bold hover:bg-rose-50 transition-all active:scale-95"
                                        >
                                          REJECT
                                        </button>
                                        <button 
                                          onClick={() => handleReview(entry.id, 'APPROVE')}
                                          disabled={reviewAsset.isPending}
                                          className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95"
                                        >
                                          APPROVE ASSET
                                        </button>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="flex flex-col items-center gap-2 py-4">
                                      <CheckCircle2 size={32} className={entry.status === 'APPROVED' ? 'text-emerald-500' : 'text-slate-300'} />
                                      <p className="text-sm font-bold text-slate-700">Review focus: Safety & Availability</p>
                                      <p className="text-xs text-slate-400 italic">This asset is currently {entry.status.toLowerCase()}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
