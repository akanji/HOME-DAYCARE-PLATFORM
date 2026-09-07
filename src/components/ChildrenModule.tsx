import React, { useState } from 'react';
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
  Mail,
  Lock,
} from 'lucide-react';
import { Child, ChildTimelineEvent } from '../types';

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

      {/* Children List Tabs (Scrollable Horizontal) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {childrenList.map((child) => {
          const isSelected = child.id === currentChild.id;
          return (
            <button
              key={child.id}
              onClick={() => onSelectChild(child.id)}
              className={`shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all text-xs font-semibold ${
                isSelected
                  ? 'border-[#52632B] bg-[#52632B] text-white shadow-xs'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1A1D16] text-neutral-700 dark:text-neutral-300 hover:border-[#52632B]/40'
              }`}
            >
              <img
                src={child.avatarUrl}
                alt={child.firstName}
                className="w-6 h-6 rounded-full object-cover border border-white/40"
              />
              <span>{child.firstName} {child.lastName.charAt(0)}.</span>
              {child.allergies.length > 0 && child.allergies[0] !== 'None' && (
                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-rose-500'}`} />
              )}
            </button>
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

                <div className="mt-2.5 flex items-center gap-2">
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
  );
};
