import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Save,
  Clock,
  Shield,
  Heart,
  AlertCircle,
  FileCheck,
  CheckCircle,
  X,
  Phone,
  PhoneCall,
  Mail,
  Lock,
  MessageSquare,
  ShieldAlert,
  AlertTriangle,
  ChevronDown,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Child, ChildTimelineEvent } from '../types';

interface EmergencyBadgeProps {
  child: Child;
  compact?: boolean;
}

/**
 * Quick-Access Emergency Contact Badge with hover & click popover for rapid dialing.
 */
export const EmergencyContactBadge: React.FC<EmergencyBadgeProps> = ({ child, compact = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div
      className="relative inline-block"
      ref={popoverRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        id={`child-emergency-badge-${child.id}`}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`group flex items-center gap-1.5 rounded-full font-mono font-bold tracking-tight transition-all cursor-pointer shadow-xs border ${
          compact
            ? 'px-2 py-0.5 text-[10px] bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60'
            : 'px-2.5 py-1 text-xs bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60 hover:scale-102'
        }`}
        title="Quick-Access Emergency Contacts (Hover or Click for Rapid Dialing)"
      >
        <Phone className="w-3 h-3 text-rose-600 dark:text-rose-400 animate-pulse shrink-0" />
        <span>Emergency Contact</span>
        <ChevronDown className={`w-3 h-3 text-rose-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Card for Rapid Dialing */}
      {isOpen && (
        <div
          id={`emergency-popover-${child.id}`}
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 left-0 sm:left-auto sm:right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#1A1D16] border-2 border-rose-300 dark:border-rose-800 p-4 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150 text-left"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2.5">
            <div className="flex items-center gap-2.5">
              <img
                src={child.avatarUrl}
                alt={child.firstName}
                className="w-9 h-9 rounded-full object-cover border border-rose-300"
              />
              <div>
                <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 font-display flex items-center gap-1.5">
                  <span>{child.firstName} {child.lastName}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                    Age {child.ageYears}y {child.ageMonths}m
                  </span>
                </div>
                <div className="text-[10px] font-mono text-rose-600 dark:text-rose-400 font-semibold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                  <ShieldAlert className="w-3 h-3" /> Rapid Emergency Dialing Directory
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Primary Parent Contact */}
          <div className="p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="font-bold text-rose-900 dark:text-rose-300 uppercase">Primary Parent / Guardian</span>
              <span className="text-[10px] bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 px-1.5 py-0.2 rounded font-bold">
                Priority 1
              </span>
            </div>
            <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center justify-between">
              <span>{child.parentName}</span>
              <span className="text-[11px] font-mono text-neutral-500">{child.parentPhone}</span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <a
                href={`tel:${child.parentPhone.replace(/[^0-9+]/g, '')}`}
                className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                title={`Rapid Dial ${child.parentPhone}`}
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call {child.parentPhone}</span>
              </a>
              <a
                href={`sms:${child.parentPhone.replace(/[^0-9+]/g, '')}`}
                className="py-1.5 px-2.5 rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-mono text-xs font-semibold flex items-center gap-1 border border-neutral-200 dark:border-neutral-700 transition-colors"
                title="Send SMS text message"
              >
                <MessageSquare className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
                <span>SMS</span>
              </a>
            </div>
          </div>

          {/* Emergency Contacts List */}
          <div className="space-y-1.5 text-xs">
            <div className="text-[10px] font-mono font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              Secondary Emergency Contacts:
            </div>
            {child.emergencyContacts && child.emergencyContacts.length > 0 ? (
              child.emergencyContacts.map((contact, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100 truncate text-xs">
                      {contact.name}
                    </div>
                    <div className="text-[11px] font-mono text-neutral-500 truncate">
                      {contact.relation} • {contact.phone}
                    </div>
                  </div>
                  <a
                    href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-[#52632B] hover:bg-[#3E4C1E] text-white font-mono text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                    title={`Rapid Dial ${contact.name}`}
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>Dial</span>
                  </a>
                </div>
              ))
            ) : (
              <div className="text-xs text-neutral-500 italic">No secondary emergency contacts on file.</div>
            )}
          </div>

          {/* Quick Medical Alert notice if child has allergies */}
          {child.allergies && child.allergies.length > 0 && child.allergies[0] !== 'None' && (
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] font-mono text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Medical Directives: {child.allergies.join(', ')}</span>
            </div>
          )}

          {/* EMS 911 Direct Escalation */}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] font-mono">
            <span className="text-neutral-500">Immediate Danger:</span>
            <a
              href="tel:911"
              className="font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <span>Dial 911 / EMS</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

interface ChildrenModuleProps {
  childrenList: Child[];
  selectedChildId: string | null;
  onSelectChild: (id: string) => void;
  onUpdateChild: (child: Child) => void;
  onOpenAddChildModal: () => void;
  onLogAudit: (action: string, resource: string, details: string) => void;
}

export const ChildrenModule: React.FC<ChildrenModuleProps> = ({
  childrenList,
  selectedChildId,
  onSelectChild,
  onUpdateChild,
  onOpenAddChildModal,
  onLogAudit,
}) => {
  const currentChild =
    childrenList.find((c) => c.id === selectedChildId) || childrenList[0] || null;

  const [activeChildTab, setActiveChildTab] = useState<'roster' | 'profile'>('roster');
  const [isEditingTimeline, setIsEditingTimeline] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<ChildTimelineEvent[]>(
    currentChild ? [...currentChild.timeline] : []
  );

  const [newEventTime, setNewEventTime] = useState('03:45 PM');
  const [newEventTitle, setNewEventTitle] = useState('Sensory Play');
  const [newEventCategory, setNewEventCategory] = useState<ChildTimelineEvent['category']>('activity');
  const [showAddEventRow, setShowAddEventRow] = useState(false);
  const [showEncryptedDetails, setShowEncryptedDetails] = useState(false);

  // Sync timeline when currentChild changes
  React.useEffect(() => {
    if (currentChild) {
      setTimelineEvents([...currentChild.timeline]);
    }
  }, [currentChild?.id]);

  if (!currentChild) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">No children enrolled yet.</p>
      </div>
    );
  }

  // Handle timeline actions
  const handleToggleComplete = (eventId: string) => {
    const updated = timelineEvents.map((ev) =>
      ev.id === eventId ? { ...ev, completed: !ev.completed } : ev
    );
    setTimelineEvents(updated);
    if (!isEditingTimeline) {
      onUpdateChild({ ...currentChild, timeline: updated });
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    const updated = timelineEvents.filter((ev) => ev.id !== eventId);
    setTimelineEvents(updated);
  };

  const handleAddEvent = () => {
    if (!newEventTitle.trim()) return;
    const newEv: ChildTimelineEvent = {
      id: 't-' + Date.now(),
      time: newEventTime,
      title: newEventTitle,
      category: newEventCategory,
      completed: false,
      notes: '',
    };
    setTimelineEvents([...timelineEvents, newEv]);
    setShowAddEventRow(false);
    setNewEventTitle('');
  };

  const handleSaveTimeline = () => {
    onUpdateChild({ ...currentChild, timeline: timelineEvents });
    setIsEditingTimeline(false);
    onLogAudit(
      'TIMELINE_UPDATED',
      `children/${currentChild.id}/timeline`,
      `Updated timeline events for ${currentChild.firstName}. Count: ${timelineEvents.length}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header and Child Selector */}
      <div className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 font-display">
              CHILDREN & PRIVATE TIMELINES
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#52632B]/10 text-[#52632B] dark:text-[#A4C268] font-bold border border-[#52632B]/30">
              AES-256 Protected
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Select a child to view health directives, dietary profiles, and manage the interactive daily timeline.
          </p>
        </div>

        <button
          id="add-new-child-header-button"
          onClick={onOpenAddChildModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-[#52632B] text-white hover:bg-[#3E4C1E] shadow-xs transition-colors border border-[#E5A910]/40"
        >
          <Plus className="w-4 h-4 text-[#E5A910]" />
          <span>Add New Child</span>
        </button>
      </div>

      {/* Sub-view Switcher: Roster Directory vs Individual Child Profile */}
      <div className="flex items-center justify-between bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-2 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            id="tab-children-roster"
            onClick={() => setActiveChildTab('roster')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-colors ${
              activeChildTab === 'roster'
                ? 'bg-[#52632B] text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Enrolled Children & Emergency Roster ({childrenList.length})</span>
          </button>

          <button
            id="tab-child-profile"
            onClick={() => setActiveChildTab('profile')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-colors ${
              activeChildTab === 'profile'
                ? 'bg-[#52632B] text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Daily Schedule & Care Profile ({currentChild.firstName})</span>
          </button>
        </div>

        <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 font-bold hidden sm:flex items-center gap-1.5">
          <Phone className="w-3 h-3 animate-pulse" />
          <span>Rapid Emergency Dialing Enabled</span>
        </span>
      </div>

      {/* VIEW 1: Enrolled Children Emergency Roster Table */}
      {activeChildTab === 'roster' && (
        <div className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-display flex items-center gap-2">
                <span>Enrolled Children Emergency Contact Roster</span>
                <span className="text-[10px] font-mono font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded border border-rose-300 dark:border-rose-800">
                  RAPID DIAL DIRECTORY
                </span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Hover or click the "Emergency Contact" badge on any child's row to rapidly view phone numbers and initiate calls to primary parents or secondary contacts.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-900/70 text-neutral-500 font-mono text-[11px] uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Child Information</th>
                  <th className="py-3 px-4">Attendance</th>
                  <th className="py-3 px-4">Allergies & Medical</th>
                  <th className="py-3 px-4">Primary Parent</th>
                  <th className="py-3 px-4 text-center">Emergency Contacts</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {childrenList.map((child) => {
                  const isSelected = child.id === currentChild.id;
                  return (
                    <tr
                      key={child.id}
                      className={`hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-colors ${
                        isSelected ? 'bg-[#52632B]/5' : ''
                      }`}
                    >
                      {/* Child Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={child.avatarUrl}
                            alt={child.firstName}
                            className="w-10 h-10 rounded-xl object-cover border border-neutral-200 dark:border-neutral-700 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                              <span>{child.firstName} {child.lastName}</span>
                              <span className="text-[10px] text-neutral-400 font-normal">
                                (&quot;{child.preferredName}&quot;)
                              </span>
                            </div>
                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                              Age {child.ageYears}y {child.ageMonths}m • DOB: {child.dateOfBirth}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Attendance */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono ${
                            child.isCheckedIn
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${child.isCheckedIn ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                          <span>{child.isCheckedIn ? `Checked In ${child.checkInTime || ''}` : 'Expected Today'}</span>
                        </span>
                      </td>

                      {/* Medical Alerts */}
                      <td className="py-3.5 px-4">
                        {child.allergies && child.allergies.length > 0 && child.allergies[0] !== 'None' ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {child.allergies.map((allergy, i) => (
                              <span
                                key={i}
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                  allergy.toLowerCase().includes('peanut') || allergy.toLowerCase().includes('severe')
                                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300'
                                    : 'bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300'
                                }`}
                              >
                                ⚠️ {allergy}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-neutral-400 font-mono">No known allergies</span>
                        )}
                      </td>

                      {/* Primary Parent Contact */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                          {child.parentName}
                        </div>
                        <a
                          href={`tel:${child.parentPhone.replace(/[^0-9+]/g, '')}`}
                          className="text-[11px] text-[#52632B] dark:text-[#A4C268] hover:underline flex items-center gap-1 font-bold"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{child.parentPhone}</span>
                        </a>
                      </td>

                      {/* Emergency Contacts Quick-Access Badge (Hover or Click) */}
                      <td className="py-3.5 px-4 text-center">
                        <EmergencyContactBadge child={child} />
                      </td>

                      {/* Row Actions */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`tel:${child.parentPhone.replace(/[^0-9+]/g, '')}`}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors"
                            title="Direct call primary parent"
                          >
                            <PhoneCall className="w-3 h-3" />
                            <span>Call</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              onSelectChild(child.id);
                              setActiveChildTab('profile');
                            }}
                            className="px-2.5 py-1 rounded border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-[11px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <span>Timeline</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: Individual Child Profile & Daily Schedule Timeline */}
      {activeChildTab === 'profile' && (
        <div className="space-y-4">
          {/* Children List Tabs (Scrollable Horizontal) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {childrenList.map((child) => {
              const isSelected = child.id === currentChild.id;
              return (
                <div
                  key={child.id}
                  className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-xs font-semibold ${
                    isSelected
                      ? 'border-[#52632B] bg-[#52632B] text-white shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1A1D16] text-neutral-700 dark:text-neutral-300 hover:border-[#52632B]/40'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectChild(child.id)}
                    className="flex items-center gap-2"
                  >
                    <img
                      src={child.avatarUrl}
                      alt={child.firstName}
                      className="w-6 h-6 rounded-full object-cover border border-white/40"
                    />
                    <span>{child.firstName} {child.lastName.charAt(0)}.</span>
                  </button>

                  <EmergencyContactBadge child={child} compact={true} />
                </div>
              );
            })}
          </div>

          {/* Child Profile Details & Interactive Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 5 Columns: Basic & Care Info */}
            <div className="lg:col-span-5 space-y-4">
              {/* Main ID Card */}
              <div className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs">
                <div className="flex items-start gap-4">
                  <img
                    src={currentChild.avatarUrl}
                    alt={currentChild.firstName}
                    className="w-16 h-16 rounded-xl object-cover border-2 border-[#52632B]/40"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 font-display">
                        {currentChild.firstName} {currentChild.lastName}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                        {currentChild.enrollmentStatus.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Preferred: &quot;{currentChild.preferredName}&quot; • DOB: {currentChild.dateOfBirth} ({currentChild.ageYears}y {currentChild.ageMonths}m)
                    </p>

                    <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap">
                      <span
                        className={`text-xs px-2 py-1 rounded-md font-bold ${
                          currentChild.isCheckedIn
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {currentChild.isCheckedIn
                          ? `Checked In at ${currentChild.checkInTime}`
                          : 'Expected today'}
                      </span>

                      {/* Emergency Contact Badge on active profile */}
                      <EmergencyContactBadge child={currentChild} />
                    </div>
                  </div>
                </div>

            {/* Parent & Emergency Contacts */}
            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-2.5 text-xs">
              <div className="font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider text-[10px]">
                Parent / Guardian & Emergency Contacts
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">Primary:</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {currentChild.parentName} ({currentChild.parentPhone})
                </span>
              </div>
              {currentChild.emergencyContacts.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500">{c.relation}:</span>
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    {c.name} • {c.phone}
                  </span>
                </div>
              ))}
            </div>

            {/* Authorized Pickup Persons (Safety critical) */}
            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider text-[10px]">
                  Authorized Pickups (Verified)
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                  <Shield className="w-3 h-3" /> ID Verified
                </span>
              </div>
              <div className="space-y-1.5">
                {currentChild.authorizedPickups.map((p, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                      {p.name}
                    </span>
                    <span className="text-neutral-500 text-[11px]">{p.relation} • {p.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Care Information & Allergies */}
          <div className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs space-y-3.5 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-[#52632B]" /> Care & Medical Directives
              </h4>
              <button
                onClick={() => setShowEncryptedDetails(!showEncryptedDetails)}
                className="text-[10px] font-semibold text-[#52632B] dark:text-[#A4C268] flex items-center gap-1 hover:underline"
              >
                <Lock className="w-2.5 h-2.5" />
                <span>{showEncryptedDetails ? 'Hide Encrypted Notes' : 'Decrypt Medical Records'}</span>
              </button>
            </div>

            {/* Allergies Highlight */}
            <div>
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                Allergies & Medical Alerts:
              </span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {currentChild.allergies.map((all, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-1 rounded-md text-xs font-bold border ${
                      all.toLowerCase().includes('peanuts') || all.toLowerCase().includes('severe')
                        ? 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-200'
                        : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                    }`}
                  >
                    ⚠️ {all}
                  </span>
                ))}
              </div>
            </div>

            {/* Authorized Medications */}
            {Array.isArray(currentChild.authorizedMedications) && currentChild.authorizedMedications.length > 0 && (
              <div>
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                  Authorized Medications:
                </span>
                <p className="mt-0.5 text-neutral-800 dark:text-neutral-200 font-semibold">
                  {currentChild.authorizedMedications.join(', ')}
                </p>
              </div>
            )}

            {/* Sleep & Comfort Preferences */}
            <div className="grid grid-cols-1 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px]">
              <div>
                <span className="font-bold text-neutral-500">Sleep Preferences:</span>
                <p className="text-neutral-700 dark:text-neutral-300 mt-0.5">{currentChild.sleepPreferences}</p>
              </div>
              <div>
                <span className="font-bold text-neutral-500">Comfort Preferences:</span>
                <p className="text-neutral-700 dark:text-neutral-300 mt-0.5">{currentChild.comfortPreferences}</p>
              </div>
            </div>

            {/* Decrypted Clinical Vault */}
            {showEncryptedDetails && (
              <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-[11px] space-y-1">
                <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> AES-256 Decrypted Medical Record
                </span>
                <p className="text-emerald-800 dark:text-emerald-300">
                  {currentChild.specialInstructions || 'Standard pediatric immunization status verified. No contraindicated sensory conditions.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right 7 Columns: Interactive Child Timeline (Subject to edit, update, and save) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs">
            {/* Timeline Header with Add/Delete/Save buttons as requested */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-display">
                  Daily Daycare Schedule & Timeline
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Timeline for {currentChild.firstName} • Click checkmark to toggle completed
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!isEditingTimeline ? (
                  <button
                    id="edit-timeline-button"
                    onClick={() => setIsEditingTimeline(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Timeline</span>
                  </button>
                ) : (
                  <button
                    id="save-timeline-button"
                    onClick={handleSaveTimeline}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-[#52632B] text-white hover:bg-[#435222] shadow-xs transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                )}

                <button
                  id="add-event-timeline-button"
                  onClick={() => setShowAddEventRow(!showAddEventRow)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#52632B] text-white hover:bg-[#3E4C1E] shadow-xs transition-colors border border-[#E5A910]/40"
                >
                  <Plus className="w-3.5 h-3.5 text-[#E5A910]" />
                  <span>Add Event</span>
                </button>
              </div>
            </div>

            {/* Add Event Inline Drawer */}
            {showAddEventRow && (
              <div className="my-4 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center gap-2 text-xs">
                <input
                  type="text"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                  placeholder="e.g. 03:45 PM"
                  className="w-24 px-2.5 py-1.5 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-mono"
                />
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="Event name (e.g. Story Time)"
                  className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs"
                />
                <select
                  value={newEventCategory}
                  onChange={(e) => setNewEventCategory(e.target.value as any)}
                  className="px-2 py-1.5 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs"
                >
                  <option value="activity">Activity</option>
                  <option value="meal">Meal</option>
                  <option value="nap">Nap</option>
                  <option value="checkin">Check-in</option>
                  <option value="checkout">Check-out</option>
                  <option value="other">Other</option>
                </select>
                <button
                  id="confirm-add-event-button"
                  onClick={handleAddEvent}
                  className="px-3 py-1.5 rounded bg-[#52632B] text-white font-bold hover:bg-[#3E4C1E] border border-[#E5A910]/40"
                >
                  Confirm Add
                </button>
                <button
                  onClick={() => setShowAddEventRow(false)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Interactive Timeline List */}
            <div className="relative mt-4 space-y-3">
              {/* Central vertical line */}
              <div className="absolute top-2 bottom-2 left-6 w-0.5 bg-neutral-200 dark:bg-neutral-800" />

              {timelineEvents.map((event, index) => {
                const isCompleted = event.completed;
                return (
                  <div
                    key={event.id || index}
                    className="relative flex items-start gap-4 group"
                  >
                    {/* Timestamp bubble / status toggle */}
                    <button
                      onClick={() => handleToggleComplete(event.id)}
                      className={`relative z-10 w-12 h-12 rounded-xl flex flex-col items-center justify-center font-mono text-[10px] shrink-0 border transition-all ${
                        isCompleted
                          ? 'bg-[#52632B] text-white border-[#52632B] shadow-xs'
                          : 'bg-white dark:bg-[#1A1D16] text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:border-[#52632B]'
                      }`}
                      title="Click to toggle completed"
                    >
                      <span className="font-bold">{event.time.split(' ')[0]}</span>
                      <span className="text-[8px] opacity-80">{event.time.split(' ')[1]}</span>
                    </button>

                    {/* Event Content Card */}
                    <div
                      className={`flex-1 p-3 rounded-xl border transition-all ${
                        isCompleted
                          ? 'bg-[#FAF9F6] dark:bg-[#141612] border-neutral-200/80 dark:border-neutral-800'
                          : 'bg-white dark:bg-[#1A1D16] border-neutral-200 dark:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold font-display ${
                              isCompleted
                                ? 'text-neutral-900 dark:text-neutral-100'
                                : 'text-neutral-700 dark:text-neutral-300'
                            }`}
                          >
                            {event.title}
                          </span>
                          {isCompleted && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                              Done
                            </span>
                          )}
                        </div>

                        {/* Delete Button (Visible during edit mode or on hover) */}
                        {isEditingTimeline && (
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {event.notes && (
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                          {event.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Summary Notice */}
            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
              <span>{timelineEvents.filter((e) => e.completed).length} of {timelineEvents.length} daily events completed</span>
              <span className="text-[11px] text-[#52632B] font-semibold">Real-time sync enabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}
</div>
);
};
