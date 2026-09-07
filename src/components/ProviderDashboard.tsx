import React, { useState } from 'react';
import {
  Users,
  CheckCircle,
  Clock,
  MessageSquare,
  DollarSign,
  AlertCircle,
  Eye,
  Plus,
  FileText,
  Camera,
  AlertTriangle,
  CreditCard,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Scale,
  Sparkles,
} from 'lucide-react';
import { Child, SafetyTask, StaffMember, DaycareRoom } from '../types';
import { StaffSchedulingModule } from './StaffSchedulingModule';
import { INITIAL_STAFF_MEMBERS, INITIAL_DAYCARE_ROOMS } from '../data/staffAndRoomsData';
import { useLanguage } from '../context/LanguageContext';

interface ProviderDashboardProps {
  childrenList: Child[];
  safetyTasks: SafetyTask[];
  staffList?: StaffMember[];
  rooms?: DaycareRoom[];
  onUpdateStaff?: (staff: StaffMember[]) => void;
  onUpdateRooms?: (rooms: DaycareRoom[]) => void;
  onNavigateTab: (tab: string) => void;
  onOpenQuickAction: (action: string) => void;
  onSelectChild: (childId: string) => void;
  onLogAudit?: (action: string, resource: string, details: string) => void;
  initialSubTab?: 'overview' | 'scheduling';
}

export const ProviderDashboard: React.FC<ProviderDashboardProps> = ({
  childrenList,
  safetyTasks,
  staffList,
  rooms,
  onUpdateStaff,
  onUpdateRooms,
  onNavigateTab,
  onOpenQuickAction,
  onSelectChild,
  onLogAudit,
  initialSubTab = 'overview',
}) => {
  const { language, t } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'scheduling'>(initialSubTab);

  // Local state fallback if not managed at App level
  const [localStaffList, setLocalStaffList] = useState<StaffMember[]>(staffList || INITIAL_STAFF_MEMBERS);
  const [localRooms, setLocalRooms] = useState<DaycareRoom[]>(rooms || INITIAL_DAYCARE_ROOMS);

  const effectiveStaff = staffList || localStaffList;
  const effectiveRooms = rooms || localRooms;

  const handleStaffUpdate = (newStaff: StaffMember[]) => {
    if (onUpdateStaff) {
      onUpdateStaff(newStaff);
    } else {
      setLocalStaffList(newStaff);
    }
  };

  const handleRoomsUpdate = (newRooms: DaycareRoom[]) => {
    if (onUpdateRooms) {
      onUpdateRooms(newRooms);
    } else {
      setLocalRooms(newRooms);
    }
  };

  // Check overall ratio conflict status across rooms
  const hasRatioConflict = effectiveRooms.some((room) => {
    const assignedStaff = effectiveStaff.filter((s) => s.assignedRoomId === room.id && s.shiftStatus !== 'off');
    const capacity = assignedStaff.length * room.legalMaxRatio;
    return room.currentChildrenCount > capacity;
  });

  const checkedInCount = childrenList.filter((c) => c.isCheckedIn).length;
  const totalCapacity = 10;
  const expectedToday = 9;
  const checkedOutCount = 0;
  const pendingRequests = 2;
  const unreadMessages = 3;
  const outstandingPayments = 420.0;

  return (
    <div className="space-y-5 font-sans">
      {/* Top Dashboard Navigation Sub-Tabs: Overview vs. Staff Scheduling */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#181a15] p-2 rounded-xl border border-gray-200 dark:border-neutral-800 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            id="provider-dashboard-tab-overview"
            onClick={() => setActiveSubTab('overview')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'overview'
                ? 'bg-[#52632B] text-white shadow-xs border border-[#E5A910]/40'
                : 'text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{language === 'fr' ? '1. Opérations & Supervision' : '1. Overview & Live Vision'}</span>
          </button>

          <button
            id="provider-dashboard-tab-scheduling"
            onClick={() => setActiveSubTab('scheduling')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'scheduling'
                ? 'bg-[#52632B] text-white shadow-xs border border-[#E5A910]/40'
                : 'text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{language === 'fr' ? '2. Planification du personnel' : '2. Staff Scheduling'}</span>
            <span
              className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                hasRatioConflict
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }`}
            >
              {hasRatioConflict ? (language === 'fr' ? 'Déficit Ratio' : 'Ratio Deficit') : (language === 'fr' ? 'Ratios Conformes' : 'CCEYA Valid')}
            </span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-gray-500 pr-2">
          <Scale className="w-3.5 h-3.5 text-[#52632B]" />
          <span>Ontario CCEYA Ratio Watchdog Active</span>
        </div>
      </div>

      {/* Conditionally Render: Overview vs. Staff Scheduling */}
      {activeSubTab === 'scheduling' ? (
        <StaffSchedulingModule
          staffList={effectiveStaff}
          rooms={effectiveRooms}
          childrenList={childrenList}
          onUpdateStaff={handleStaffUpdate}
          onUpdateRooms={handleRoomsUpdate}
          onLogAudit={onLogAudit}
        />
      ) : (
        <>
      {/* High Density System Overview Grid (Exact Design Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Computer Vision Live Feed: Main Playroom (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#181a15] border border-gray-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-3 bg-gray-50 dark:bg-[#1f221c] border-b border-gray-200 dark:border-neutral-800 flex justify-between items-center">
            <h3 className="text-xs font-bold text-[#556B2F] dark:text-[#9BB762] uppercase tracking-wider font-mono flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-[#556B2F]" />
              <span>Computer Vision Live Feed: Main Playroom</span>
            </h3>
            <span className="text-[10px] font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-200 dark:border-red-900 font-bold uppercase tracking-wider">
              RECOGNITION ACTIVE
            </span>
          </div>

          <div className="h-56 bg-gray-900 relative flex items-center justify-center overflow-hidden group">
            {/* Background Feed Imagery */}
            <img
              src="https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=1000&auto=format&fit=crop&q=80"
              alt="Playroom Live Feed"
              className="absolute inset-0 w-full h-full object-cover opacity-50 filter brightness-90"
            />

            {/* Bounding Box Overlays */}
            <div className="absolute top-4 left-6 border-2 border-green-400 w-32 h-36 bg-green-400/10 pointer-events-none">
              <span className="absolute -top-5 left-0 text-[10px] text-green-400 font-mono font-bold bg-black/70 px-1 py-0.5 rounded">
                Person: Child_A (94%)
              </span>
            </div>

            <div className="absolute bottom-6 right-16 border-2 border-[#52632B] w-28 h-24 bg-[#52632B]/20 pointer-events-none">
              <span className="absolute -top-5 left-0 text-[10px] text-[#E5A910] font-mono font-bold bg-black/70 px-1 py-0.5 rounded">
                Object: Safety Gate (100%)
              </span>
            </div>

            <div className="absolute top-4 right-4 text-white text-[10px] font-mono opacity-70 bg-black/60 px-2 py-1 rounded border border-white/10">
              LIVE STREAM // 1080p // 60 FPS // BUFFER 0.2ms
            </div>

            <button
              onClick={() => onNavigateTab('vision')}
              className="absolute bottom-4 left-4 z-10 px-3 py-1.5 bg-[#52632B] hover:bg-[#3E4C1E] text-white text-[11px] font-mono font-bold rounded shadow-md flex items-center gap-1.5 uppercase transition-all border border-[#E5A910]/40"
            >
              <Eye className="w-3.5 h-3.5" /> Full Vision Suite & Hazard Analysis
            </button>
          </div>
        </div>

        {/* Security Audit Log (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#181a15] border border-gray-200 dark:border-neutral-800 rounded-xl shadow-sm p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-gray-100 dark:border-neutral-800">
              <h3 className="text-xs font-bold text-[#52632B] dark:text-[#E5A910] uppercase tracking-wider font-mono">
                Security Audit Log
              </h3>
              <span className="text-[9px] font-mono text-gray-400">REALTIME</span>
            </div>
            <div className="font-mono text-[10px] space-y-1.5 overflow-hidden">
              <p className="text-green-600 dark:text-green-400 font-semibold truncate">
                [09:41:22] MFA Verified: SMS to +1***902
              </p>
              <p className="text-gray-500 dark:text-gray-400 truncate">
                [09:40:05] Token Lifecycle Refresh: FaceID Handshake
              </p>
              <p className="text-blue-600 dark:text-blue-400 truncate">
                [09:38:11] Cloud Sync Complete: Multi-Region
              </p>
              <p className="text-red-600 dark:text-red-400 font-bold truncate">
                [09:35:44] Unauthorized Access Attempt Blocked (IP: 192.x.x.x)
              </p>
              <p className="text-gray-500 dark:text-gray-400 truncate">
                [09:30:12] AES-256 Rotation Triggered
              </p>
              <p className="text-gray-500 dark:text-gray-400 truncate">
                [09:25:55] Role Assigned: ChildCare_Standard
              </p>
              <p className="text-gray-500 dark:text-gray-400 truncate">
                [09:20:01] System Health Check: All Regions Normal
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('audit')}
            className="mt-3 w-full py-2 bg-gray-100 dark:bg-neutral-800 text-[10px] font-bold text-[#556B2F] dark:text-[#9BB762] rounded hover:bg-[#556B2F] hover:text-white transition-colors uppercase tracking-tight font-mono"
          >
            EXPORT FULL COMPLIANCE REPORT
          </button>
        </div>

        {/* Authentication Status (3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-[#181a15] border border-gray-200 dark:border-neutral-800 rounded-xl shadow-sm p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-[#52632B] dark:text-[#E5A910] mb-3 uppercase tracking-wider font-mono">
              Authentication Status
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 pb-1.5">
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 font-mono">Biometric (Face ID)</span>
                <span className="text-[10px] text-green-600 dark:text-green-400 font-bold font-mono">SYNCED</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 pb-1.5">
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 font-mono">Fingerprint Protocol</span>
                <span className="text-[10px] text-gray-400 font-bold font-mono">STANDBY</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 pb-1.5">
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 font-mono">MFA Integration</span>
                <span className="text-[10px] text-green-600 dark:text-green-400 font-bold font-mono">ENFORCED</span>
              </div>
            </div>
          </div>

          <div className="mt-3 p-2 bg-[#52632B]/10 dark:bg-[#52632B]/20 border border-[#52632B]/20 rounded">
            <p className="text-[9px] text-[#52632B] dark:text-[#E5A910] font-medium leading-relaxed">
              Enterprise-grade RBAC protects sensitive system access points.
            </p>
          </div>
        </div>

        {/* Real-Time Analytics Dashboard (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#181a15] border border-gray-200 dark:border-neutral-800 rounded-xl shadow-sm p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-[#556B2F] dark:text-[#9BB762] uppercase tracking-wider font-mono">
              Real-Time Analytics Dashboard
            </h3>
            <span className="text-[9px] font-mono text-gray-400">TELEMETRY</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-[#556B2F]/10 dark:bg-[#52632B]/20 p-3 rounded border border-[#556B2F]/20">
              <p className="text-[10px] text-[#556B2F] dark:text-[#9BB762] font-bold font-mono uppercase">
                SYSTEM LATENCY
              </p>
              <p className="text-2xl font-bold font-mono mt-1 text-gray-900 dark:text-white">
                14ms
              </p>
              <div className="w-full h-1 bg-gray-200 dark:bg-neutral-700 mt-2 rounded-full overflow-hidden">
                <div className="w-1/4 h-full bg-[#556B2F]"></div>
              </div>
            </div>

            <div className="bg-[#D49A00]/10 dark:bg-[#D49A00]/20 p-3 rounded border border-[#D49A00]/30">
              <p className="text-[10px] text-[#D49A00] dark:text-[#E5A910] font-bold font-mono uppercase">
                ACTIVE CHILDREN
              </p>
              <p className="text-2xl font-bold font-mono mt-1 text-gray-900 dark:text-white">
                {checkedInCount}/{totalCapacity}
              </p>
              <div className="w-full h-1 bg-gray-200 dark:bg-neutral-700 mt-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#D49A00]"
                  style={{ width: `${(checkedInCount / totalCapacity) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-[#1f221c] border border-gray-200 dark:border-neutral-800 rounded p-2 flex items-center justify-around font-mono">
            <div className="text-center">
              <p className="text-[9px] text-gray-400 uppercase">UPTIME</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">99.998%</p>
            </div>
            <div className="w-px h-6 bg-gray-300 dark:bg-neutral-700"></div>
            <div className="text-center">
              <p className="text-[9px] text-gray-400 uppercase">ENCRYPTION</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">AES-256</p>
            </div>
            <div className="w-px h-6 bg-gray-300 dark:bg-neutral-700"></div>
            <div className="text-center">
              <p className="text-[9px] text-gray-400 uppercase">THROUGHPUT</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">1.2 GB/s</p>
            </div>
          </div>
        </div>

        {/* Recovery Node Status (4 cols) */}
        <div className="lg:col-span-4 bg-[#556B2F] rounded-xl shadow-sm p-4 text-white flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold tracking-widest opacity-80 uppercase font-mono">
              Recovery Node Status
            </h3>
            <p className="text-lg font-light leading-tight font-display">
              Disaster Recovery Protocol Ready
            </p>
          </div>

          <div className="my-2 bg-white/15 p-2.5 rounded text-[10px] italic leading-relaxed">
            "Proactively detect and neutralize potential unauthorized activities with periodic vulnerability audits."
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('security')}
              className="flex-1 h-8 bg-white text-[#556B2F] font-bold text-[10px] flex items-center justify-center rounded uppercase tracking-tight font-mono shadow-xs hover:bg-neutral-100 transition-colors"
            >
              Run Audit
            </button>
            <button
              onClick={() => onNavigateTab('licensing')}
              className="flex-1 h-8 border border-white font-bold text-[10px] flex items-center justify-center rounded uppercase tracking-tight font-mono hover:bg-white/10 transition-colors"
            >
              Vulnerability Scan
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row: High Density Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
        {/* Children Present */}
        <div className="p-3.5 rounded-lg bg-white dark:bg-[#181a15] border border-gray-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 dark:text-neutral-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Present</span>
            <Users className="w-3.5 h-3.5 text-[#52632B]" />
          </div>
          <div className="text-xl font-black text-gray-900 dark:text-neutral-100 font-mono">
            {checkedInCount} / {totalCapacity}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-0.5 font-mono">
            <CheckCircle className="w-2.5 h-2.5" /> Ratio Valid
          </div>
        </div>

        {/* Expected Today */}
        <div className="p-3.5 rounded-lg bg-white dark:bg-[#181a15] border border-gray-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 dark:text-neutral-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Expected</span>
            <Clock className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-black text-gray-900 dark:text-neutral-100 font-mono">
            {expectedToday}
          </div>
          <div className="text-[10px] text-gray-500 dark:text-neutral-400 mt-1 font-mono">
            1 late drop-off
          </div>
        </div>

        {/* Checked In */}
        <div className="p-3.5 rounded-lg bg-white dark:bg-[#181a15] border border-gray-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 dark:text-neutral-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Checked In</span>
            <CheckCircle className="w-3.5 h-3.5 text-[#556B2F]" />
          </div>
          <div className="text-xl font-black text-[#556B2F] dark:text-[#9BB762] font-mono">
            {checkedInCount}
          </div>
          <div className="text-[10px] text-gray-500 dark:text-neutral-400 mt-1 font-mono">
            Biometric logged
          </div>
        </div>

        {/* Checked Out */}
        <div className="p-3.5 rounded-lg bg-white dark:bg-[#181a15] border border-gray-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 dark:text-neutral-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Checked Out</span>
            <LogOut className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <div className="text-xl font-black text-gray-900 dark:text-neutral-100 font-mono">
            {checkedOutCount}
          </div>
          <div className="text-[10px] text-gray-500 dark:text-neutral-400 mt-1 font-mono">
            Pickups 4:30 PM
          </div>
        </div>

        {/* Pending Requests */}
        <div className="p-3.5 rounded-lg bg-white dark:bg-[#181a15] border border-gray-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 dark:text-neutral-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Requests</span>
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-700 dark:text-amber-400 font-mono">
            {pendingRequests}
          </div>
          <div className="text-[10px] text-gray-500 dark:text-neutral-400 mt-1 font-mono">
            Waitlist pending
          </div>
        </div>

        {/* Unread Messages */}
        <div className="p-3.5 rounded-lg bg-white dark:bg-[#181a15] border border-gray-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 dark:text-neutral-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Messages</span>
            <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-indigo-700 dark:text-indigo-400 font-mono">
            {unreadMessages}
          </div>
          <div className="text-[10px] text-gray-500 dark:text-neutral-400 mt-1 font-mono">
            Parent inquiries
          </div>
        </div>

        {/* Outstanding Payments */}
        <div className="p-3.5 rounded-lg bg-white dark:bg-[#181a15] border border-gray-200 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 dark:text-neutral-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Outstanding</span>
            <DollarSign className="w-3.5 h-3.5 text-[#52632B]" />
          </div>
          <div className="text-lg font-black text-[#52632B] dark:text-[#E5A910] font-mono">
            ${outstandingPayments.toFixed(2)}
          </div>
          <div className="text-[10px] text-gray-500 dark:text-neutral-400 mt-1 font-mono">
            Stripe Invoices
          </div>
        </div>
      </div>

      {/* Present Children Overview & Open Safety Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Present Children Cards */}
        <div className="lg:col-span-8 bg-white dark:bg-[#181a15] rounded-xl border border-gray-200 dark:border-neutral-800 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-neutral-800">
            <h3 className="text-xs font-bold text-[#52632B] dark:text-[#E5A910] uppercase tracking-wider font-mono">
              Children In Care ({checkedInCount} Present)
            </h3>
            <button
              onClick={() => onNavigateTab('children')}
              className="text-xs font-bold text-[#556B2F] dark:text-[#9BB762] hover:underline flex items-center gap-1 font-mono uppercase"
            >
              <span>View All Profiles & Timelines</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {childrenList.map((child) => {
              const hasAllergy = child.allergies.length > 0 && child.allergies[0] !== 'None' && child.allergies[0] !== 'None reported';
              return (
                <div
                  key={child.id}
                  onClick={() => {
                    onSelectChild(child.id);
                    onNavigateTab('children');
                  }}
                  className="p-2.5 rounded border border-gray-200 dark:border-neutral-800 hover:border-[#52632B] bg-gray-50/50 dark:bg-[#12140f] cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={child.avatarUrl}
                      alt={child.firstName}
                      className="w-9 h-9 rounded object-cover border border-gray-200 dark:border-neutral-700"
                    />
                    <div>
                      <div className="font-bold text-xs text-gray-900 dark:text-neutral-100 group-hover:text-[#52632B] transition-colors">
                        {child.firstName} {child.lastName}
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-neutral-400 font-mono">
                        Age: {child.ageYears}y {child.ageMonths}m • In: {child.checkInTime}
                      </div>
                      {hasAllergy && (
                        <div className="mt-0.5 flex items-center gap-1 text-[9px] text-rose-700 dark:text-rose-400 font-mono font-bold bg-rose-50 dark:bg-rose-950/40 px-1 py-0.2 rounded border border-rose-200/60 w-fit">
                          <AlertCircle className="w-2.5 h-2.5" />
                          <span>{child.allergies[0]}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      child.isCheckedIn
                        ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {child.isCheckedIn ? 'Checked In' : 'Expected'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Open Safety Tasks & Ratio Status */}
        <div className="lg:col-span-4 space-y-3">
          {/* Safety Tasks widget */}
          <div className="bg-white dark:bg-[#181a15] rounded-xl border border-gray-200 dark:border-neutral-800 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-gray-100 dark:border-neutral-800">
              <h3 className="text-xs font-bold text-[#52632B] dark:text-[#E5A910] uppercase tracking-wider font-mono">
                Safety Tasks (CV Generated)
              </h3>
              <button
                onClick={() => onNavigateTab('incidents')}
                className="text-[10px] text-[#556B2F] dark:text-[#9BB762] font-bold font-mono hover:underline uppercase"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2">
              {safetyTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-2 rounded bg-gray-50 dark:bg-[#12140f] border border-gray-200 dark:border-neutral-800 text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-gray-800 dark:text-neutral-200 font-mono text-[11px]">
                    <span>{t.area}</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                        t.priority === 'High'
                          ? 'bg-red-100 text-red-800'
                          : t.priority === 'Medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-neutral-400 mt-1 line-clamp-2">
                    {t.observation}
                  </p>
                  <div className="mt-1 flex items-center justify-between text-[9px] text-gray-400 font-mono">
                    <span>Status: {t.status}</span>
                    <span>Assigned: {t.assignedTo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance & Ratios Summary */}
          <div className="bg-[#556B2F]/10 dark:bg-[#52632B]/20 rounded-xl border border-[#556B2F]/30 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#556B2F] dark:text-[#9BB762] uppercase tracking-wider mb-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" /> Ontario CCEYA 2014 Active
            </div>
            <p className="text-[11px] text-gray-700 dark:text-neutral-300 leading-relaxed font-sans">
              Provider license valid for 6 children under 13 (max 10 with certified second staff). Zero violations logged.
            </p>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
