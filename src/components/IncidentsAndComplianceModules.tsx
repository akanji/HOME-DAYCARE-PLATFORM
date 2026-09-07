import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
  Plus,
  Filter,
  Scale,
  FileCheck,
  Clock,
  UserCheck,
  AlertCircle,
  Info,
  Compass,
} from 'lucide-react';
import { IncidentReport, SafetyTask } from '../types';
import { LICENSING_REGIONS, LicensingRegionRule } from '../mockData';
import { FloorPlanHeatmap } from './FloorPlanHeatmap';

interface IncidentsProps {
  incidents: IncidentReport[];
  safetyTasks: SafetyTask[];
  onAddIncident: (inc: IncidentReport) => void;
  onUpdateIncident?: (inc: IncidentReport) => void;
  onUpdateSafetyTask: (task: SafetyTask) => void;
  onAddSafetyTask: (task: Omit<SafetyTask, 'id' | 'createdAt'>) => void;
  onLogAudit: (action: string, resource: string, details: string) => void;
}

export const IncidentsAndSafetyModule: React.FC<IncidentsProps> = ({
  incidents,
  safetyTasks,
  onAddIncident,
  onUpdateIncident,
  onUpdateSafetyTask,
  onAddSafetyTask,
  onLogAudit,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'tasks' | 'incidents' | 'heatmap'>('tasks');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [incidentFilter, setIncidentFilter] = useState<'all' | 'drafts' | 'finalized'>('all');
  const [showNewIncidentModal, setShowNewIncidentModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [reviewingDraft, setReviewingDraft] = useState<IncidentReport | null>(null);
  const [signerName, setSignerName] = useState('Clara Oswald, RECE');

  // New incident form state
  const [childName, setChildName] = useState('Oliver Vance');
  const [incidentType, setIncidentType] = useState<IncidentReport['type']>('Injury');
  const [description, setDescription] = useState('Minor scrape on left knee during playground tricycle tag.');
  const [bodyLocation, setBodyLocation] = useState('Left knee');
  const [firstAid, setFirstAid] = useState('Cleaned with saline, applied adhesive bandage.');
  const [parentNotified, setParentNotified] = useState(true);

  // New task form state
  const [taskArea, setTaskArea] = useState('Indoor Play Area');
  const [taskObs, setTaskObs] = useState('Inspect safety gate latch after morning drop-off.');
  const [taskPriority, setTaskPriority] = useState<SafetyTask['priority']>('Medium');

  const filteredTasks = safetyTasks.filter((t) => filterPriority === 'all' || t.priority === filterPriority);

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    const newInc: IncidentReport = {
      id: 'inc-' + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      childName,
      type: incidentType,
      description,
      bodyLocation,
      firstAidAdministered: firstAid,
      parentNotified,
      parentNotificationTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      staffSignatures: ['Clara Oswald, RECE'],
      licensingNotificationRequired: false,
    };
    onAddIncident(newInc);
    onLogAudit(
      'INCIDENT_LOGGED',
      `incidents/${newInc.id}`,
      `Logged ${incidentType} incident for ${childName}. Parent notified: ${parentNotified}`
    );
    setShowNewIncidentModal(false);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    onAddSafetyTask({
      area: taskArea,
      observation: taskObs,
      priority: taskPriority,
      assignedTo: 'Lead Daycare Provider',
      status: 'Open',
    });
    onLogAudit('TASK_CREATED', 'tasks/new', `Manual safety task added: ${taskObs}`);
    setShowNewTaskModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 font-display">
              INCIDENTS & SAFETY TASK MANAGEMENT
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 font-bold">
              {incidents.length} Logged Incidents
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Formal child injury & incident reports, staff sign-offs, and actionable Computer Vision safety tasks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-800 p-1 bg-neutral-100/70 dark:bg-neutral-900">
            <button
              id="subtab-safety-tasks"
              onClick={() => setActiveSubTab('tasks')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                activeSubTab === 'tasks'
                  ? 'bg-white dark:bg-neutral-800 text-[#52632B] dark:text-[#E5A910] shadow-xs'
                  : 'text-neutral-600'
              }`}
            >
              Safety Tasks ({safetyTasks.length})
            </button>
            <button
              id="subtab-incident-logs"
              onClick={() => setActiveSubTab('incidents')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                activeSubTab === 'incidents'
                  ? 'bg-white dark:bg-neutral-800 text-[#52632B] dark:text-[#E5A910] shadow-xs'
                  : 'text-neutral-600'
              }`}
            >
              Incident Logs ({incidents.length})
            </button>
            <button
              id="subtab-danger-heatmap"
              onClick={() => setActiveSubTab('heatmap')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 ${
                activeSubTab === 'heatmap'
                  ? 'bg-white dark:bg-neutral-800 text-[#52632B] dark:text-[#E5A910] shadow-xs'
                  : 'text-neutral-600'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Danger Heatmap</span>
            </button>
          </div>

          {activeSubTab === 'tasks' ? (
            <button
              id="new-safety-task-button"
              onClick={() => setShowNewTaskModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[#52632B] text-white hover:bg-[#435222] shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
          ) : activeSubTab === 'incidents' ? (
            <button
              id="report-incident-btn"
              onClick={() => setShowNewIncidentModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[#52632B] text-white hover:bg-[#3E4C1E] shadow-xs border border-[#E5A910]/40"
            >
              <AlertTriangle className="w-4 h-4 text-[#E5A910]" />
              <span>Report Incident</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Sub-View: Safety Tasks */}
      {activeSubTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-neutral-400 uppercase tracking-wider">
              Safety Inspection Tasks
            </span>
            <div className="flex items-center gap-1">
              {['all', 'High', 'Medium', 'Low'].map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPriority(p)}
                  className={`px-2.5 py-1 rounded-md capitalize font-semibold ${
                    filterPriority === p
                      ? 'bg-[#52632B] text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-4 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
                      {task.area}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        task.priority === 'High'
                          ? 'bg-rose-100 text-rose-800'
                          : task.priority === 'Medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {task.priority} Priority
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-2 leading-relaxed">
                    {task.observation}
                  </p>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500">Assignee: {task.assignedTo}</span>
                  <button
                    onClick={() =>
                      onUpdateSafetyTask({
                        ...task,
                        status: task.status === 'Closed' ? 'Open' : 'Closed',
                      })
                    }
                    className={`px-2.5 py-1 rounded-md font-bold transition-colors ${
                      task.status === 'Closed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                  >
                    {task.status === 'Closed' ? '✓ Resolved' : 'Mark Done'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-View: Incidents */}
      {activeSubTab === 'incidents' && (
        <div className="space-y-4">
          {/* AI Draft Banner if any drafts exist */}
          {incidents.some((i) => i.status === 'Draft' || i.source === 'Computer Vision Judge Agent') && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300/80 dark:border-amber-700/60 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-amber-900 dark:text-amber-200 uppercase font-mono tracking-tight">
                    Action Required: Computer Vision Judge Agent Drafts
                  </h4>
                  <p className="text-amber-800 dark:text-amber-300 text-[11px] mt-0.5">
                    {incidents.filter((i) => i.status === 'Draft' || i.source === 'Computer Vision Judge Agent').length} high-severity hazard near-miss draft(s) awaiting lead provider verification and counter-signature.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIncidentFilter('drafts')}
                className="px-2.5 py-1 rounded bg-amber-200 dark:bg-amber-900 hover:bg-amber-300 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-100 font-mono text-[10px] font-bold uppercase transition-colors shrink-0"
              >
                View Drafts Only
              </button>
            </div>
          )}

          {/* Incidents Filter Bar */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-neutral-400 uppercase tracking-wider font-mono">
              Incident & Near-Miss Records
            </span>
            <div className="flex items-center gap-1 font-mono">
              {(['all', 'drafts', 'finalized'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setIncidentFilter(filter)}
                  className={`px-2.5 py-1 rounded-md capitalize font-semibold transition-colors ${
                    incidentFilter === filter
                      ? 'bg-[#52632B] text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {filter === 'all'
                    ? `All (${incidents.length})`
                    : filter === 'drafts'
                    ? `AI Drafts (${incidents.filter((i) => i.status === 'Draft' || i.source === 'Computer Vision Judge Agent').length})`
                    : `Finalized (${incidents.filter((i) => i.status !== 'Draft').length})`}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incidents
              .filter((inc) => {
                const isDraft = inc.status === 'Draft' || inc.source === 'Computer Vision Judge Agent';
                if (incidentFilter === 'drafts') return isDraft;
                if (incidentFilter === 'finalized') return !isDraft;
                return true;
              })
              .map((inc) => {
                const isDraft = inc.status === 'Draft' || inc.source === 'Computer Vision Judge Agent';

                return (
                  <div
                    key={inc.id}
                    className={`rounded-xl border p-5 shadow-xs space-y-3 transition-all ${
                      isDraft
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-400/30'
                        : 'bg-white dark:bg-[#1A1D16] border-neutral-200/80 dark:border-neutral-800'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                      <div>
                        <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                          {inc.childName} — {inc.type}
                        </h4>
                        <span className="text-[11px] text-neutral-500 font-mono">
                          {inc.date} at {inc.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isDraft ? (
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-[#52632B] text-white flex items-center gap-1 uppercase tracking-tight border border-[#E5A910]/40">
                            <AlertTriangle className="w-3 h-3 text-[#E5A910]" />
                            <span>AI DRAFT • JUDGE CONFIRMED</span>
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-100 text-emerald-800 font-bold uppercase">
                            Official Form
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs space-y-1.5 text-neutral-700 dark:text-neutral-300 font-sans">
                      <div>
                        <strong className="text-neutral-900 dark:text-neutral-100">Description:</strong> {inc.description}
                      </div>
                      <div>
                        <strong className="text-neutral-900 dark:text-neutral-100">Body Location / Area:</strong> {inc.bodyLocation}
                      </div>
                      <div>
                        <strong className="text-neutral-900 dark:text-neutral-100">First Aid / Mitigation:</strong> {inc.firstAidAdministered}
                      </div>
                      {inc.judgeVerificationStamp && (
                        <div className="text-[10px] font-mono text-amber-800 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-950/50 p-1.5 rounded border border-amber-200/60 dark:border-amber-800/40">
                          <strong>Judge Agent Verification Seal:</strong> {inc.judgeVerificationStamp}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                      <span>Parent notified: {inc.parentNotificationTime}</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        {Array.isArray(inc.staffSignatures) && inc.staffSignatures.length > 0
                          ? inc.staffSignatures[0]
                          : (inc as any).witnesses || 'Clara Oswald, RECE'}
                      </span>
                    </div>

                    {/* Draft Action Workflow Button */}
                    {isDraft && (
                      <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/40 flex items-center justify-end gap-2">
                        <button
                          id={`review-draft-${inc.id}-button`}
                          onClick={() => setReviewingDraft(inc)}
                          className="w-full py-1.5 px-3 rounded-lg text-xs font-mono font-bold bg-[#52632B] hover:bg-[#435222] text-white flex items-center justify-center gap-1.5 transition-colors uppercase tracking-tight"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Review, Counter-Sign & Finalize Report</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Sub-View: Floor Plan Danger Zone Heatmap */}
      {activeSubTab === 'heatmap' && (
        <FloorPlanHeatmap
          incidents={incidents}
          onAddSafetyTask={onAddSafetyTask}
        />
      )}

      {/* Review & Finalize Draft Modal */}
      {reviewingDraft && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200 dark:border-neutral-800 max-w-lg w-full p-6 shadow-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#E5A910]" />
                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 uppercase tracking-tight font-mono">
                  Finalize AI CV Draft Incident Report
                </h3>
              </div>
              <button
                onClick={() => setReviewingDraft(null)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200 space-y-1">
                <div className="font-bold font-mono">Draft ID: {reviewingDraft.id}</div>
                <div><strong>Location / Room:</strong> {reviewingDraft.bodyLocation}</div>
                <div><strong>Classification:</strong> {reviewingDraft.type} (Environmental Hazard Near-Miss)</div>
                <div><strong>A2A Judge Verification:</strong> {reviewingDraft.judgeVerificationStamp || 'VERIFIED_HIGH_SEVERITY'}</div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Incident Description (Editable):</label>
                <textarea
                  value={reviewingDraft.description}
                  onChange={(e) =>
                    setReviewingDraft({ ...reviewingDraft, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612] text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Provider First Aid / Mitigating Action:</label>
                <input
                  type="text"
                  value={reviewingDraft.firstAidAdministered}
                  onChange={(e) =>
                    setReviewingDraft({ ...reviewingDraft, firstAidAdministered: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612] text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Authorized Provider Counter-Signature:</label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612] text-xs font-mono font-bold"
                  placeholder="e.g. Clara Oswald, RECE #CA-8841"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => setReviewingDraft(null)}
                className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const finalized: IncidentReport = {
                    ...reviewingDraft,
                    status: 'Submitted',
                    staffSignatures: [
                      signerName,
                      `CV Judge Agent Automated Seal (${reviewingDraft.judgeVerificationStamp || 'APPROVED'})`,
                    ],
                    parentNotificationTime: 'Logged in daily portal summary',
                  };
                  if (onUpdateIncident) {
                    onUpdateIncident(finalized);
                  } else {
                    onAddIncident(finalized);
                  }
                  onLogAudit(
                    'INCIDENT_DRAFT_FINALIZED',
                    `incidents/${finalized.id}`,
                    `Caregiver ${signerName} counter-signed and finalized CV draft report.`
                  );
                  setReviewingDraft(null);
                }}
                className="px-4 py-2 rounded-lg bg-[#52632B] hover:bg-[#3E4C1E] text-white font-bold uppercase tracking-tight flex items-center gap-1.5 border border-[#E5A910]/40"
              >
                <CheckCircle className="w-3.5 h-3.5 text-[#E5A910]" />
                <span>Submit Official Finalized Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Incident Modal */}
      {showNewIncidentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200 dark:border-neutral-800 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-display">
                Create Formal Incident / Injury Report
              </h3>
              <button
                onClick={() => setShowNewIncidentModal(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Child Involved:</label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Incident Classification:</label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612]"
                >
                  <option value="Injury">Injury</option>
                  <option value="Illness">Illness</option>
                  <option value="Behavioral">Behavioral</option>
                  <option value="Property damage">Property damage</option>
                  <option value="Near-miss">Near-miss</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Detailed Description:</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Body Location / Injury Point:</label>
                <input
                  type="text"
                  value={bodyLocation}
                  onChange={(e) => setBodyLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">First Aid Administered:</label>
                <input
                  type="text"
                  value={firstAid}
                  onChange={(e) => setFirstAid(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612]"
                  required
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewIncidentModal(false)}
                  className="px-4 py-2 font-semibold text-neutral-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-[#52632B] text-white rounded-lg hover:bg-[#3E4C1E] border border-[#E5A910]/40"
                >
                  Save & Notify Parents
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200 dark:border-neutral-800 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-display">
                Add Safety Inspection Task
              </h3>
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Area / Room:</label>
                <input
                  type="text"
                  value={taskArea}
                  onChange={(e) => setTaskArea(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Observation / Task:</label>
                <textarea
                  rows={2}
                  value={taskObs}
                  onChange={(e) => setTaskObs(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Priority:</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612]"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 font-semibold text-neutral-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-[#52632B] text-white rounded-lg hover:bg-[#435222]"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Regional Licensing & Interactive Ratio Calculator (Section 16)
export const LicensingModule: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<LicensingRegionRule>(LICENSING_REGIONS[0]);
  const [infantsCount, setInfantsCount] = useState(2);
  const [toddlersCount, setToddlersCount] = useState(3);
  const [preschoolCount, setPreschoolCount] = useState(1);
  const [caregiversCount, setCaregiversCount] = useState(1);

  const totalChildren = infantsCount + toddlersCount + preschoolCount;
  const isOverTotal = totalChildren > selectedRegion.maxHomeCapacity;
  const isOverInfants = infantsCount > selectedRegion.infantLimit;

  let complianceStatus = 'COMPLIANT';
  let statusColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';

  if (isOverTotal || isOverInfants) {
    complianceStatus = 'NON-COMPLIANT';
    statusColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200';
  } else if (totalChildren === selectedRegion.maxHomeCapacity) {
    complianceStatus = 'AT FULL CAPACITY';
    statusColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 font-display">
              LICENSING REGULATIONS & STATUTORY RATIO CALCULATOR
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#52632B]/15 text-[#52632B] dark:text-[#A4C268] font-bold">
              Canada & USA Regs
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Real-time compliance engine enforcing CCEYA 2014, California Title 22, Texas DFPS, and NY OCFS limits.
          </p>
        </div>
      </div>

      {/* Region Selector */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {LICENSING_REGIONS.map((rule) => {
          const isSelected = selectedRegion.regionCode === rule.regionCode;
          return (
            <button
              key={rule.regionCode}
              onClick={() => setSelectedRegion(rule)}
              className={`p-4 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-[#52632B] bg-[#52632B]/10 dark:bg-[#52632B]/20 ring-1 ring-[#52632B]'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1A1D16]'
              }`}
            >
              <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
                {rule.name} ({rule.country})
              </div>
              <div className="text-[11px] text-[#52632B] dark:text-[#E5A910] font-semibold mt-0.5 line-clamp-1">
                {rule.licensingBody}
              </div>
              <div className="text-[10px] text-neutral-500 mt-1">
                Max {rule.maxHomeCapacity} children (max {rule.infantLimit} infants)
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Live Calculator */}
      <div className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-6 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Live Child-to-Staff Ratio Simulator
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border">
              <label className="text-[11px] font-semibold text-neutral-500 block mb-1">
                Infants (under 2):
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInfantsCount(Math.max(0, infantsCount - 1))}
                  className="w-6 h-6 rounded bg-neutral-200 dark:bg-neutral-800 font-bold"
                >
                  -
                </button>
                <span className="font-black text-sm">{infantsCount}</span>
                <button
                  onClick={() => setInfantsCount(infantsCount + 1)}
                  className="w-6 h-6 rounded bg-neutral-200 dark:bg-neutral-800 font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border">
              <label className="text-[11px] font-semibold text-neutral-500 block mb-1">
                Toddlers (2-3):
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setToddlersCount(Math.max(0, toddlersCount - 1))}
                  className="w-6 h-6 rounded bg-neutral-200 dark:bg-neutral-800 font-bold"
                >
                  -
                </button>
                <span className="font-black text-sm">{toddlersCount}</span>
                <button
                  onClick={() => setToddlersCount(toddlersCount + 1)}
                  className="w-6 h-6 rounded bg-neutral-200 dark:bg-neutral-800 font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border">
              <label className="text-[11px] font-semibold text-neutral-500 block mb-1">
                Preschool (3-5):
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreschoolCount(Math.max(0, preschoolCount - 1))}
                  className="w-6 h-6 rounded bg-neutral-200 dark:bg-neutral-800 font-bold"
                >
                  -
                </button>
                <span className="font-black text-sm">{preschoolCount}</span>
                <button
                  onClick={() => setPreschoolCount(preschoolCount + 1)}
                  className="w-6 h-6 rounded bg-neutral-200 dark:bg-neutral-800 font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border">
              <label className="text-[11px] font-semibold text-neutral-500 block mb-1">
                Caregivers Present:
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCaregiversCount(Math.max(1, caregiversCount - 1))}
                  className="w-6 h-6 rounded bg-neutral-200 dark:bg-neutral-800 font-bold"
                >
                  -
                </button>
                <span className="font-black text-sm">{caregiversCount}</span>
                <button
                  onClick={() => setCaregiversCount(caregiversCount + 1)}
                  className="w-6 h-6 rounded bg-neutral-200 dark:bg-neutral-800 font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border text-xs text-neutral-600 dark:text-neutral-300">
            <strong>Key Statutory Requirements:</strong>{' '}
            {Array.isArray(selectedRegion?.keyRequirements)
              ? selectedRegion.keyRequirements.join(' • ')
              : ''}
          </div>
        </div>

        {/* Live Calculation Output Card */}
        <div className="lg:col-span-5 bg-[#FAF9F6] dark:bg-[#141612] p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 uppercase">Compliance Result</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${statusColor}`}>
                {complianceStatus}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b">
                <span>Total Children Present:</span>
                <strong className={isOverTotal ? 'text-rose-600' : 'text-neutral-900 dark:text-neutral-100'}>
                  {totalChildren} / {selectedRegion.maxHomeCapacity} allowed
                </strong>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Infants Under Age 2:</span>
                <strong className={isOverInfants ? 'text-rose-600' : 'text-neutral-900 dark:text-neutral-100'}>
                  {infantsCount} / {selectedRegion.infantLimit} max allowed
                </strong>
              </div>
              <div className="flex justify-between py-1">
                <span>Qualified Staff Count:</span>
                <strong>{caregiversCount}</strong>
              </div>
            </div>
          </div>

          {isOverTotal || isOverInfants ? (
            <div className="mt-4 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-[11px] text-rose-800 dark:text-rose-200 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Warning: Ratios violate {selectedRegion.manualTitle}. Immediate caregiver assistance or enrollment cap enforcement required.</span>
            </div>
          ) : (
            <div className="mt-4 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-[11px] text-emerald-800 dark:text-emerald-200 font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Perfect compliance under {selectedRegion.name} home childcare statutory standards.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
