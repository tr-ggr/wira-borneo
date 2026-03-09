import React, { useState } from 'react';
import { Users, UserPlus, Copy, Map as MapIcon, Plus, X, AlertCircle } from 'lucide-react';
import { 
  useFamiliesControllerGetMyFamilyMap, 
  useFamiliesControllerCreateFamily, 
  useFamiliesControllerJoinFamily,
  useAuthControllerGetSession,
  getFamiliesControllerGetMyFamilyMapQueryKey
} from '@wira-borneo/api-client';
import { useQueryClient } from '@tanstack/react-query';
import Login from '../auth/Login';
import Register from '../auth/Register';

interface FamilyMember {
  userId: string;
  name: string;
  email: string;
  role: string;
  location: { latitude: number; longitude: number } | null;
}

interface FamilyData {
  familyId: string;
  familyName: string;
  familyCode: string;
  members: FamilyMember[];
}

export default function Family() {
  const queryClient = useQueryClient();
  const { data: session } = useAuthControllerGetSession();
  const { data: familiesData, isLoading } = useFamiliesControllerGetMyFamilyMap({
    query: {
      enabled: !!session?.user
    }
  });

  const families = (familiesData as unknown as FamilyData[]) || [];

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  
  const [newFamilyName, setNewFamilyName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createFamily = useFamiliesControllerCreateFamily({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getFamiliesControllerGetMyFamilyMapQueryKey() });
        setShowCreateForm(false);
        setNewFamilyName('');
        setError(null);
      },
      onError: (err: { response?: { data?: { message?: string } } }) => {
        setError(err?.response?.data?.message || 'Failed to create family');
      }
    }
  });

  const joinFamily = useFamiliesControllerJoinFamily({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getFamiliesControllerGetMyFamilyMapQueryKey() });
        setShowJoinForm(false);
        setJoinCode('');
        setError(null);
      },
      onError: (err: { response?: { data?: { message?: string } } }) => {
        const msg = err?.response?.data?.message;
        if (msg === 'Family code not found.') {
          setError('Invalid family code. Please check and try again.');
        } else if (msg?.includes('already a member')) {
          setError('You are already a member of this family.');
        } else {
          setError(msg || 'Failed to join family');
        }
      }
    }
  });

  const handleActionGated = (action: () => void) => {
    if (!session?.user) {
      setShowAuthModal(true);
    } else {
      action();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-wira-teal border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono text-wira-teal uppercase tracking-widest font-bold">Syncing Family Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative pb-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-display font-bold wira-card-title leading-tight">Family Party</h1>
        <p className="text-xs font-body text-wira-earth/70">WIRA ensures the safety of your loved ones.</p>
      </header>

      {/* Auth Modal overlay */}
      {showAuthModal ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-wira-night/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-wira-ivory rounded-3xl p-6 relative shadow-2xl overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5"
            >
              <X size={20} className="text-wira-night" />
            </button>
            <div className="mt-4">
               {authView === 'login' ? (
                <Login onToggleRegister={() => setAuthView('register')} />
              ) : (
                <Register onToggleLogin={() => setAuthView('login')} />
              )}
            </div>
            <p className="text-center text-[10px] text-wira-earth/50 mt-4 font-body">Login to access family features and syncing</p>
          </div>
        </div>
      ) : null}

      {/* Create/Join Modals */}
      {(showCreateForm || showJoinForm) ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-wira-night/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-wira-ivory rounded-3xl p-8 relative shadow-2xl">
            <button 
              onClick={() => { setShowCreateForm(false); setShowJoinForm(false); setError(null); }}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 transition-colors"
            >
              <X size={20} className="text-wira-night" />
            </button>
            
            <h2 className="text-xl font-display font-bold wira-card-title mb-1">
              {showCreateForm ? 'Create Family' : 'Join Family'}
            </h2>
            <p className="text-xs font-body text-wira-earth/60 mb-6">
              {showCreateForm ? 'Start a new safety group for your circle.' : 'Enter the invitation code to join a party.'}
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-wira-teal pl-1">
                  {showCreateForm ? 'Family Name' : 'Invitation Code'}
                </label>
                <input 
                  type="text"
                  value={showCreateForm ? newFamilyName : joinCode}
                  onChange={(e) => showCreateForm ? setNewFamilyName(e.target.value) : setJoinCode(e.target.value)}
                  placeholder={showCreateForm ? "The Smith Family" : "ABC-123-XYZ"}
                  className="w-full bg-white border border-wira-ivory-dark rounded-xl px-4 py-3 font-body text-sm focus:ring-2 focus:ring-wira-gold outline-none transition-all shadow-sm"
                />
              </div>

              {error && (
                <div className="bg-status-critical/5 border border-status-critical/20 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle size={14} className="text-status-critical shrink-0 mt-0.5" />
                  <p className="text-[10px] font-body font-bold text-status-critical leading-tight">{error}</p>
                </div>
              )}

              <button 
                onClick={() => {
                  if (showCreateForm) {
                    createFamily.mutate({ data: { name: newFamilyName } });
                  } else {
                    joinFamily.mutate({ data: { code: joinCode } });
                  }
                }}
                disabled={createFamily.isPending || joinFamily.isPending}
                className="w-full wira-btn-primary py-3 flex items-center justify-center gap-2"
              >
                {createFamily.isPending || joinFamily.isPending ? 'Processing...' : (showCreateForm ? 'Create Party' : 'Join Party')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {families && families.length > 0 ? (
        <div className="space-y-8">
          {families.map((family: FamilyData) => (
            <div key={family.familyId} className="space-y-6">
              {/* Family Code Card */}
              <div className="wira-card bg-gradient-to-br from-wira-gold to-wira-gold-dark border-none p-6 space-y-4 relative overflow-hidden group shadow-lg shadow-wira-gold/20">
                <div className="absolute top-0 right-0 opacity-10 wira-batik-bg w-24 h-24 -mr-4 -mt-4 rotate-12"></div>
                <div className="space-y-1 relative">
                  <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{family.familyName} Code</p>
                  <div className="flex items-center justify-between bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20">
                    <span className="text-xl font-mono font-bold text-white">{family.familyCode}</span>
                    <button 
                      onClick={() => copyToClipboard(family.familyCode)}
                      className="text-white/80 active:scale-90 transition-transform hover:text-white"
                    >
                      <Copy size={20} />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] font-body text-white/60 italic">Share this code to invite family members to your WIRA party.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-display font-bold wira-card-title flex items-center gap-2">
                      <Users size={16} className="text-wira-teal" />
                      Family Members
                    </h3>
                    <button className="text-[10px] font-body font-bold text-wira-teal uppercase tracking-widest flex items-center gap-1 bg-wira-teal/5 px-3 py-1.5 rounded-full hover:bg-wira-teal/10 transition-colors">
                        <MapIcon size={12} /> View Map
                    </button>
                </div>

                <div className="space-y-3">
                  {family.members.map((member: FamilyMember) => (
                    <div key={member.userId} className="wira-card flex items-center gap-4 active:scale-[0.98] transition-all border-wira-ivory-dark/40 hover:border-wira-teal/30">
                       <div className="relative shrink-0">
                          <div className="h-12 w-12 rounded-full bg-wira-ivory-dark flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                              {/* If we had avatars, we'd use them here */}
                              <Users className="text-wira-teal-light w-5 h-5 opacity-60" />
                          </div>
                          <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${member.location ? 'bg-status-safe' : 'bg-status-warning'}`}></span>
                       </div>
                       
                       <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-display font-bold wira-card-title truncate">{member.name} {member.userId === session?.user?.id && '(You)'}</h4>
                          <p className="text-[10px] font-body wira-card-body uppercase font-bold tracking-tighter">
                            {member.role} — <span className="opacity-70">{member.location ? 'Active Now' : 'Last seen unknown'}</span>
                          </p>
                       </div>

                       <div className="text-right space-y-1 text-[9px] font-bold text-wira-earth/40 uppercase tracking-tighter">
                          {member.location ? 'Safe' : 'Offline'}
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 px-6 flex flex-col items-center text-center space-y-4 bg-white/50 rounded-[32px] border border-dashed border-wira-ivory-dark">
          <div className="h-16 w-16 rounded-full bg-wira-ivory-dark flex items-center justify-center">
            <Users className="text-wira-teal-light w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-display font-bold wira-card-title">No Family Found</h3>
            <p className="text-xs font-body text-wira-earth/60">Join an existing family or create a new one to start tracking your circle's safety.</p>
          </div>
          <div className="flex flex-col w-full gap-3 pt-4">
             <button 
              onClick={() => handleActionGated(() => setShowCreateForm(true))}
              className="wira-btn-primary flex items-center justify-center gap-2 py-4"
            >
              <Plus size={18} />
              Create New Family
            </button>
            <button 
              onClick={() => handleActionGated(() => setShowJoinForm(true))}
              className="w-full border-2 border-wira-teal-light text-wira-teal-light py-4 rounded-2xl flex items-center justify-center gap-2 font-body font-bold text-sm active:bg-wira-teal-light/5 transition-colors"
            >
              <UserPlus size={18} />
              Join by Code
            </button>
          </div>
        </div>
      )}

      {families && families.length > 0 && (
        <div className="flex gap-3">
          <button 
            onClick={() => handleActionGated(() => setShowJoinForm(true))}
            className="flex-1 border-2 border-dashed border-wira-teal-light text-wira-teal-light py-4 rounded-2xl flex items-center justify-center gap-2 font-body font-bold text-sm active:bg-wira-teal-light/5 transition-colors"
          >
            <UserPlus size={18} />
            Join Another
          </button>
          <button 
            onClick={() => handleActionGated(() => setShowCreateForm(true))}
            className="flex-1 border-2 border-dashed border-wira-gold text-wira-gold py-4 rounded-2xl flex items-center justify-center gap-2 font-body font-bold text-sm active:bg-wira-gold/5 transition-colors"
          >
            <Plus size={18} />
            New Family
          </button>
        </div>
      )}
    </div>
  );
}
