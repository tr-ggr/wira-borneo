'use client';

import React, { useState, useEffect } from 'react';
import { 
  LifeBuoy, 
  HandHeart, 
  AlertCircle, 
  HelpCircle, 
  Plus, 
  MapPin, 
  History, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  User,
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  useVolunteersControllerApply, 
  useVolunteersControllerGetStatus,
  useHelpRequestsControllerMe,
  useHelpRequestsControllerListOpen,
  useHelpRequestsControllerAssignments,
  useHelpRequestsControllerClaim,
  useHelpRequestsControllerUpdateStatus,
} from '@wira-borneo/api-client';
import HelpRequestForm from '../help/HelpRequestForm';
import HelpRequestTimeline from '../help/HelpRequestTimeline';
import HazardPinForm from '../pin/HazardPinForm';

const FALLBACK_LOCATION = { latitude: 1.5533, longitude: 110.3592 };

export default function HelpDashboard({ 
  onNavigateToRequest,
  showAllPins,
  onToggleShowAllPins,
  formLocation,
  setFormLocation,
  pickLocationFor,
  setPickLocationFor,
  onNavigateToMap,
}: { 
  onNavigateToRequest: (id: string, loc: { latitude: number, longitude: number }) => void;
  showAllPins: boolean;
  onToggleShowAllPins: (show: boolean) => void;
  formLocation: { latitude: number; longitude: number } | null;
  setFormLocation: (loc: { latitude: number; longitude: number } | null) => void;
  pickLocationFor: 'hazard' | 'help' | null;
  setPickLocationFor: (v: 'hazard' | 'help' | null) => void;
  onNavigateToMap: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'request' | 'volunteer'>('request');
  const [volunteerSubTab, setVolunteerSubTab] = useState<'available' | 'assigned'>('available');
  const [showForm, setShowForm] = useState(false);
  const [showHazardPinForm, setShowHazardPinForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const { data: volunteerStatus, refetch: refetchVolunteerStatus } = useVolunteersControllerGetStatus();
  const { data: myRequests, refetch: refetchRequests } = useHelpRequestsControllerMe();
  const { data: openRequests, refetch: refetchOpen } = useHelpRequestsControllerListOpen();
  const { data: myAssignments, refetch: refetchAssignments } = useHelpRequestsControllerAssignments();

  const { mutate: applyAsVolunteer, isPending: isApplying } = useVolunteersControllerApply();
  const { mutate: claimRequest, isPending: isClaiming } = useHelpRequestsControllerClaim();
  const { mutate: updateStatus, isPending: isUpdating } = useHelpRequestsControllerUpdateStatus();

  // Default form location to user's current position when Help dashboard mounts
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setFormLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true }
    );
  }, [setFormLocation]);

  const formLocationOrFallback = formLocation ?? FALLBACK_LOCATION;

  const handleFormSuccess = () => {
    setShowForm(false);
    refetchRequests();
  };

  const handleHazardPinSuccess = () => {
    setShowHazardPinForm(false);
  };

  const handleApply = () => {
    applyAsVolunteer({ data: {} as any }, {
      onSuccess: () => refetchVolunteerStatus(),
      onError: () => alert('Failed to apply as volunteer.')
    });
  };

  const handleClaim = (id: string) => {
    claimRequest({ id }, {
      onSuccess: () => {
        refetchOpen();
        refetchAssignments();
        setVolunteerSubTab('assigned');
      },
      onError: () => alert('Failed to claim request.')
    });
  };

  const handleUpdateStatus = (id: string, nextStatus: string) => {
    updateStatus({ id, data: { nextStatus } as any }, {
      onSuccess: () => {
        refetchAssignments();
        refetchRequests(); // Also refetch my requests in case this is the same user
      },
      onError: () => alert('Failed to update status.')
    });
  };

  const isApprovedVolunteer = (volunteerStatus as any)?.profile?.status === 'APPROVED';
  const volunteerProfileStatus = (volunteerStatus as any)?.profile?.status;

  // Helper to cast API data to array safely
  const asArray = (data: any) => (Array.isArray(data) ? data : []);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <header className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-display font-bold wira-card-title">Help Center</h1>
              <HelpCircle size={20} className="text-wira-gold" />
            </div>
            
            {!showForm && !showHazardPinForm && !selectedRequest && activeTab === 'request' && (
               <button 
                 onClick={() => setShowForm(true)}
                 className="h-10 w-10 rounded-full bg-wira-teal text-white flex items-center justify-center shadow-lg shadow-wira-teal/20"
               >
                 <Plus size={20} />
               </button>
            )}
          </div>
          
          <div className="flex bg-wira-ivory-dark rounded-xl p-1">
            <button 
              onClick={() => { setActiveTab('request'); setShowForm(false); setShowHazardPinForm(false); setSelectedRequest(null); }}
              className={`flex-1 py-2 text-xs font-body font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'request' ? 'bg-white text-wira-teal shadow-sm' : 'text-wira-earth/50'}`}
            >
              Request Help
            </button>
            <button 
              onClick={() => { setActiveTab('volunteer'); setShowForm(false); setShowHazardPinForm(false); setSelectedRequest(null); }}
              className={`flex-1 py-2 text-xs font-body font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'volunteer' ? 'bg-white text-wira-teal shadow-sm' : 'text-wira-earth/50'}`}
            >
              Volunteer
            </button>
          </div>
      </header>

      {activeTab === 'request' ? (
        <div className="space-y-6 animate-slide-up">
           {showHazardPinForm ? (
             <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setShowHazardPinForm(false)}
                  className="form-back-link flex items-center gap-2"
                >
                  ← Back to Dashboard
                </button>
                <div className="wira-card p-6 border-wira-teal/10">
                   <h3 className="text-xl font-display font-bold wira-card-title mb-6">Report hazard pin</h3>
                   <HazardPinForm
                     initialLocation={formLocationOrFallback}
                     onSuccess={handleHazardPinSuccess}
                     onChangeLocation={() => {
                       setPickLocationFor('hazard');
                       onNavigateToMap();
                     }}
                   />
                </div>
             </div>
           ) : showForm ? (
             <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="form-back-link flex items-center gap-2"
                >
                  ← Back to Dashboard
                </button>
                <div className="wira-card p-6 border-wira-teal/10">
                   <h3 className="text-xl font-display font-bold wira-card-title mb-6">New Help Request</h3>
                   <HelpRequestForm
                     initialLocation={formLocationOrFallback}
                     onSuccess={handleFormSuccess}
                     onChangeLocation={() => {
                       setPickLocationFor('help');
                       onNavigateToMap();
                     }}
                   />
                </div>
             </div>
           ) : selectedRequest ? (
             <div className="space-y-6 animate-slide-up">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="form-back-link flex items-center gap-2"
                >
                  ← Back to My Requests
                </button>
                
                <div className="wira-card p-6 space-y-6">
                   <div className="flex items-start justify-between">
                      <div className="space-y-1">
                         <div className="flex items-center gap-2">
                           <span className="text-[10px] font-display font-bold uppercase tracking-widest px-2 py-0.5 bg-wira-teal/10 text-wira-teal rounded-md">
                             {selectedRequest.hazardType}
                           </span>
                         </div>
                         <h3 className="text-lg font-display font-bold wira-card-title">Emergency Detail</h3>
                      </div>
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                         selectedRequest.urgency === 'CRITICAL' ? 'bg-status-critical/10 text-status-critical' : 'bg-wira-gold/10 text-wira-gold'
                      }`}>
                         <AlertCircle size={18} />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <p className="text-sm font-body text-wira-earth/80 leading-relaxed">
                         {selectedRequest.description}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-body text-wira-earth/40">
                         <MapPin size={12} />
                         <span>{selectedRequest.latitude.toFixed(4)}, {selectedRequest.longitude.toFixed(4)}</span>
                      </div>
                   </div>

                   <div className="h-px bg-wira-ivory-dark" />

                   <HelpRequestTimeline events={selectedRequest.events || []} currentStatus={selectedRequest.status} />
                </div>
             </div>
           ) : (
             <>
               <div className="wira-card p-6 border-status-critical/20 bg-status-critical/5 space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-status-critical/10 flex items-center justify-center">
                    <AlertCircle className="text-status-critical w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-display font-bold wira-card-title">Send Emergency Signal</h3>
                    <p className="text-xs font-body wira-card-body">
                        Use this only if you require immediate assistance. Your location will be sent to authorities and nearby volunteers.
                    </p>
                  </div>
                  <button onClick={() => setShowForm(true)} className="wira-btn-emergency">
                    Request Help NOW
                  </button>
               </div>

               <div className="wira-card p-6 border-wira-teal/20 bg-wira-teal/5 space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-wira-teal/10 flex items-center justify-center">
                    <MapPin className="text-wira-teal w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-display font-bold wira-card-title">Report hazard pin</h3>
                    <p className="text-xs font-body wira-card-body">
                      Report a hazard (flood, damage, etc.) at your location. Admins will review and add it to the operations map.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHazardPinForm(true)}
                    className="w-full py-3 rounded-xl border border-wira-teal text-wira-teal text-sm font-bold uppercase tracking-wider hover:bg-wira-teal hover:text-white transition-all"
                  >
                    Report hazard
                  </button>
               </div>

               {asArray(myRequests).length > 0 && (
                 <div className="space-y-4">
                    <div className="flex items-center gap-2">
                       <History size={16} className="text-wira-earth/40" />
                       <h4 className="text-xs font-display font-bold uppercase tracking-widest text-wira-earth/40">My Active Requests</h4>
                    </div>
                    
                    <div className="space-y-3">
                       {asArray(myRequests).map((req: any) => (
                         <button 
                           key={req.id}
                           onClick={() => setSelectedRequest(req)}
                           className="w-full wira-card p-4 flex items-center justify-between hover:border-wira-teal/30 transition-all text-left"
                         >
                            <div className="flex items-center gap-4">
                               <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                                  req.status === 'RESOLVED' ? 'bg-status-safe/10 text-status-safe' : 'bg-wira-teal/10 text-wira-teal'
                               }`}>
                                  {req.status === 'RESOLVED' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                               </div>
                               <div className="space-y-0.5">
                                  <p className="text-sm font-display font-bold text-wira-earth">{req.hazardType}</p>
                                  <p className="text-[10px] font-body text-wira-earth/50">Status: {req.status}</p>
                               </div>
                            </div>
                            <ChevronRight size={16} className="text-wira-earth/20" />
                         </button>
                       ))}
                    </div>
                 </div>
               )}
             </>
           )}
        </div>
      ) : (
        <div className="space-y-6 animate-slide-up">
           {!isApprovedVolunteer ? (
             <div className="wira-card p-10 text-center space-y-6">
                <div className="h-20 w-20 rounded-full bg-wira-gold/10 flex items-center justify-center mx-auto ring-8 ring-wira-gold/5">
                   {volunteerProfileStatus === 'SUSPENDED' ? (
                     <AlertCircle size={40} className="text-status-critical" />
                   ) : (
                     <HandHeart size={40} className="text-wira-gold" />
                   )}
                </div>
                <div className="space-y-2">
                   <h3 className="text-xl font-display font-bold text-wira-earth">
                     {volunteerProfileStatus === 'SUSPENDED' ? 'Account Suspended' : 'Become a Guardian'}
                   </h3>
                   <p className="text-sm font-body text-wira-earth/60 leading-relaxed">
                      {volunteerProfileStatus === 'PENDING' ? 'Your application is currently being reviewed by our team.' :
                       volunteerProfileStatus === 'REJECTED' ? 'Your application was unfortunately rejected. Contact support for more info.' :
                       volunteerProfileStatus === 'SUSPENDED' ? 'Your volunteer account has been suspended for safety reasons.' :
                       'Wira Borneo relies on community volunteers to respond to emergencies. Apply today to help your neighbors.'}
                   </p>
                </div>
                
                {volunteerProfileStatus === 'PENDING' ? (
                   <div className="py-3 px-4 bg-wira-gold/10 rounded-xl border border-wira-gold/20 flex items-center gap-3 justify-center">
                      <Clock size={16} className="text-wira-gold" />
                      <span className="text-xs font-bold text-wira-gold uppercase tracking-wider">Application Pending</span>
                   </div>
                ) : volunteerProfileStatus === 'APPROVED' ? (
                   null // Handled by outer condition
                ) : volunteerProfileStatus === 'REJECTED' || volunteerProfileStatus === 'SUSPENDED' ? (
                   <div className="py-3 px-4 bg-status-critical/10 rounded-xl border border-status-critical/20 flex items-center gap-3 justify-center">
                      <AlertCircle size={16} className="text-status-critical" />
                      <span className="text-xs font-bold text-status-critical uppercase tracking-wider">{volunteerProfileStatus}</span>
                   </div>
                ) : (
                  <button 
                    onClick={handleApply}
                    disabled={isApplying}
                    className="wira-btn-primary w-full py-4 shadow-xl shadow-wira-teal/20"
                  >
                    {isApplying ? 'Applying...' : 'Apply as Volunteer'}
                  </button>
                )}
             </div>
           ) : (
             <div className="space-y-6">
                <div className="flex bg-wira-ivory rounded-lg p-1 border border-wira-earth/5">
                   <button 
                      onClick={() => setVolunteerSubTab('available')}
                      className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${volunteerSubTab === 'available' ? 'bg-wira-teal text-white shadow-sm' : 'text-wira-earth/40'}`}
                   >
                      Available Requests
                   </button>
                   <button 
                      onClick={() => setVolunteerSubTab('assigned')}
                      className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${volunteerSubTab === 'assigned' ? 'bg-wira-teal text-white shadow-sm' : 'text-wira-earth/40'}`}
                   >
                      My Assignments
                   </button>
                </div>

                 <div className="wira-card p-4 flex items-center justify-between border-wira-teal/10 bg-wira-teal/5">
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded-lg bg-wira-teal/10 flex items-center justify-center">
                          {showAllPins ? <Eye size={16} className="text-wira-teal" /> : <EyeOff size={16} className="text-wira-teal" />}
                       </div>
                       <div className="space-y-0.5">
                          <p className="text-[10px] font-display font-bold uppercase tracking-wider text-wira-earth">Global Map Visibility</p>
                          <p className="text-[9px] font-body text-wira-earth/50">Show all active help pins on the forecast map</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => onToggleShowAllPins(!showAllPins)}
                      className={`h-6 w-12 rounded-full transition-all relative ${showAllPins ? 'bg-wira-teal' : 'bg-wira-earth/20'}`}
                    >
                      <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${showAllPins ? 'right-1' : 'left-1'}`} />
                    </button>
                 </div>

                {volunteerSubTab === 'available' ? (
                   <div className="space-y-4">
                      {asArray(openRequests).length === 0 ? (
                         <div className="wira-card p-10 text-center space-y-3 opacity-60">
                            <LifeBuoy size={32} className="mx-auto text-wira-earth/20" />
                            <p className="text-xs font-body text-wira-earth/40">No open help requests at the moment.</p>
                         </div>
                      ) : (
                         asArray(openRequests).map((req: any) => (
                           <div key={req.id} className="wira-card p-5 space-y-4 hover:border-wira-teal/20 transition-all group">
                              <div className="flex items-start justify-between">
                                 <div className="space-y-1">
                                    <span className={`text-[9px] font-bold uppercase py-0.5 px-2 rounded-full ${
                                       req.urgency === 'CRITICAL' ? 'bg-status-critical/10 text-status-critical border border-status-critical/10' : 'bg-wira-gold/10 text-wira-gold border border-wira-gold/10'
                                    }`}>
                                       {req.urgency}
                                    </span>
                                    <h4 className="text-base font-display font-bold text-wira-earth">{req.hazardType}</h4>
                                 </div>
                                 <p className="text-[10px] font-body text-wira-earth/40">
                                    {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </p>
                              </div>
                              <p className="text-sm font-body text-wira-earth/60 line-clamp-2 italic">
                                "{req.description}"
                              </p>
                              <div className="flex items-center gap-4 text-[10px] font-body text-wira-earth/40">
                                <div className="flex items-center gap-1">
                                  <User size={12} />
                                  <span>{req.requester?.name || 'Anonymous'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin size={12} />
                                  <span>Nearby</span>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleClaim(req.id)}
                                disabled={isClaiming}
                                className="w-full py-2.5 rounded-xl border border-wira-teal text-wira-teal text-[11px] font-bold uppercase tracking-wider hover:bg-wira-teal hover:text-white transition-all disabled:opacity-50 shadow-sm shadow-wira-teal/5"
                              >
                                {isClaiming ? 'Claiming...' : 'Claim Request'}
                              </button>
                           </div>
                         ))
                      )}
                   </div>
                ) : (
                   <div className="space-y-4">
                      {asArray(myAssignments).length === 0 ? (
                         <div className="wira-card p-10 text-center space-y-3 opacity-60">
                            <Clock size={32} className="mx-auto text-wira-earth/20" />
                            <p className="text-xs font-body text-wira-earth/40">You haven't claimed any requests yet.</p>
                         </div>
                      ) : (
                         asArray(myAssignments).map((assignment: any) => (
                           <div key={assignment.id} className="wira-card p-5 space-y-5 border-wira-teal/20">
                              <div className="flex items-start justify-between">
                                 <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                       <span className="text-[9px] font-bold uppercase py-0.5 px-2 bg-wira-teal/10 text-wira-teal rounded-full">
                                          {assignment.helpRequest.status}
                                       </span>
                                       <span className="text-[10px] font-body text-wira-earth/30">
                                          ID: {assignment.helpRequest.id.substring(0, 8)}
                                       </span>
                                    </div>
                                    <h4 className="text-base font-display font-bold text-wira-earth">
                                       {assignment.helpRequest.hazardType}
                                    </h4>
                                 </div>
                                 <div className="h-10 w-10 rounded-full bg-wira-ivory-dark flex items-center justify-center border border-wira-earth/10">
                                    <User size={18} className="text-wira-teal" />
                                 </div>
                              </div>

                              <div className="p-3 bg-wira-ivory-dark/30 rounded-xl space-y-2">
                                 <p className="text-xs font-body text-wira-earth/70 leading-relaxed italic">
                                    "{assignment.helpRequest.description}"
                                 </p>
                                 <div className="flex items-center justify-between text-[10px] font-body text-wira-earth/40">
                                    <span>{assignment.helpRequest.requester?.name || 'Requester'}</span>
                                     <div 
                                        onClick={() => onNavigateToRequest(
                                          assignment.helpRequest.id, 
                                          { latitude: assignment.helpRequest.latitude, longitude: assignment.helpRequest.longitude }
                                        )}
                                        className="flex items-center gap-1 text-wira-teal cursor-pointer hover:text-wira-gold transition-colors"
                                     >
                                       <MapPin size={10} />
                                       <span className="font-bold underline">Navigate</span>
                                    </div>
                                 </div>
                              </div>

                              <div className="flex gap-2">
                                 {assignment.helpRequest.status === 'CLAIMED' && (
                                    <>
                                       <button 
                                          onClick={() => handleUpdateStatus(assignment.helpRequest.id, 'IN_PROGRESS')}
                                          disabled={isUpdating}
                                          className="flex-1 wira-btn-primary py-3 text-xs"
                                       >
                                          I am On Site
                                       </button>
                                       <button 
                                          onClick={() => handleUpdateStatus(assignment.helpRequest.id, 'CANCELLED')}
                                          disabled={isUpdating}
                                          className="px-4 bg-wira-ivory-dark text-wira-earth/60 py-3 rounded-xl font-display font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 border border-wira-earth/10 hover:bg-status-critical/10 hover:text-status-critical transition-all"
                                       >
                                          <XCircle size={14} />
                                          Cancel
                                       </button>
                                    </>
                                 )}
                              </div>
                              
                              
                              {assignment.helpRequest.status === 'RESOLVED' && (
                                 <div className="py-2 text-center text-[10px] font-bold text-status-safe uppercase tracking-widest flex items-center justify-center gap-2">
                                    <CheckCircle2 size={14} />
                                    Task Completed
                                 </div>
                              )}
                           </div>
                         ))
                      )}
                   </div>
                )}
             </div>
           )}
        </div>
      )}
    </div>
  );
}
