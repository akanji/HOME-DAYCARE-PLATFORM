import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Clock,
  Eye,
  Bot,
  FileText,
  Calendar,
  Search,
  Camera,
  AlertTriangle,
  MessageSquare,
  CreditCard,
  Scale,
  ShieldCheck,
  FileCheck,
  Moon,
  Sun,
  Cloud,
  CloudOff,
  PlusCircle,
  CheckCircle,
  LogOut,
  X,
  Sparkles,
  Lock,
  RefreshCw,
  Database,
  Radio,
  ArrowUpCircle,
  HardDrive,
  Play,
  Layers,
  Check,
} from 'lucide-react';
import { UserRole } from '../types';

interface LeftPanelProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  darkMode: boolean;
  setDarkMode: (dm: boolean) => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  onOpenQuickAction: (action: string) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  pendingSyncCount: number;
}

interface OfflineSyncItem {
  id: string;
  title: string;
  category: 'ATTENDANCE' | 'MEDICAL' | 'INCIDENT' | 'AUDIT' | 'REPORT';
  size: string;
  progress: number;
  status: 'BUFFERED' | 'ENCRYPTING' | 'READY_FOR_SYNC' | 'STAGED';
  timestamp: string;
  target: string;
}

interface OfflinePendingTask {
  id: string;
  title: string;
  destination: string;
  priority: 'REGULATORY' | 'HIGH' | 'NORMAL';
  progress: number;
  status: 'AWAITING_NETWORK' | 'VERIFYING_HASH' | 'QUEUED';
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  setUserRole,
  darkMode,
  setDarkMode,
  isOnline,
  setIsOnline,
  onOpenQuickAction,
  isOpenMobile,
  setIsOpenMobile,
  pendingSyncCount,
}) => {
  const roles: { id: UserRole; label: string; icon: string }[] = [
    { id: 'provider', label: 'Provider', icon: '🏡' },
    { id: 'parent', label: 'Parent', icon: '👨‍👩‍👧' },
    { id: 'admin', label: 'Admin', icon: '🛡️' },
    { id: 'agency', label: 'Agency', icon: '👩‍💼' },
  ];

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null, roles: ['provider', 'admin', 'agency'] },
    { id: 'children', label: 'Children & Timeline', icon: Users, badge: '9', roles: ['provider', 'parent', 'admin', 'agency'] },
    { id: 'attendance', label: 'Attendance & Pickup', icon: Clock, badge: '8/10', roles: ['provider', 'admin', 'agency'] },
    { id: 'vision', label: 'Computer Vision AI', icon: Eye, badge: 'Active', roles: ['provider', 'admin', 'agency', 'parent'] },
    { id: 'a2a_judge', label: 'A2A & Judge Agent', icon: Bot, badge: 'Self-Fix', roles: ['provider', 'admin', 'agency'] },
    { id: 'reports', label: 'Daily Reports', icon: FileText, badge: null, roles: ['provider', 'parent', 'admin', 'agency'] },
    { id: 'calendar', label: 'Daycare Calendar', icon: Calendar, badge: null, roles: ['provider', 'parent', 'admin', 'agency'] },
    { id: 'marketplace', label: 'Find Care / Directory', icon: Search, badge: 'Market', roles: ['parent', 'provider', 'admin', 'agency'] },
    { id: 'media', label: 'Photos & Media', icon: Camera, badge: 'Private', roles: ['provider', 'parent', 'admin', 'agency'] },
    { id: 'incidents', label: 'Incidents & Tasks', icon: AlertTriangle, badge: '2 open', roles: ['provider', 'admin', 'agency'] },
    { id: 'messages', label: 'Copilot & Messaging', icon: MessageSquare, badge: 'AI Live', roles: ['provider', 'parent', 'admin', 'agency'] },
    { id: 'licensing', label: 'Licensing & Ratios', icon: Scale, badge: 'CA/US', roles: ['provider', 'admin', 'agency', 'parent'] },
    { id: 'security', label: 'Security, MFA & Biometrics', icon: ShieldCheck, badge: 'AES-256', roles: ['provider', 'admin', 'agency', 'parent'] },
    { id: 'subscription', label: 'Subscription & Billing', icon: CreditCard, badge: 'Trial/PayPal', roles: ['provider', 'admin', 'agency', 'parent'] },
    { id: 'audit', label: 'Audit Logs & Compliance', icon: FileCheck, badge: null, roles: ['admin', 'agency', 'provider'] },
  ];

  const quickActions = [
    { id: 'add_child', label: 'Add Child', icon: PlusCircle, color: 'hover:bg-[#52632B]/10 hover:text-[#52632B]' },
    { id: 'quick_checkin', label: 'Check In', icon: CheckCircle, color: 'hover:bg-emerald-50 hover:text-emerald-700' },
    { id: 'quick_checkout', label: 'Check Out', icon: LogOut, color: 'hover:bg-amber-50 hover:text-amber-700' },
    { id: 'daily_report', label: 'Daily Report', icon: FileText, color: 'hover:bg-blue-50 hover:text-blue-700' },
    { id: 'capture_photo', label: 'Capture Photo', icon: Camera, color: 'hover:bg-purple-50 hover:text-purple-700' },
    { id: 'visual_analysis', label: 'Visual Analysis', icon: Eye, color: 'hover:bg-[#E5A910]/20 hover:text-[#B45309]' },
    { id: 'report_incident', label: 'Report Incident', icon: AlertTriangle, color: 'hover:bg-rose-50 hover:text-rose-700' },
    { id: 'message_parent', label: 'Message Parent', icon: MessageSquare, color: 'hover:bg-indigo-50 hover:text-indigo-700' },
    { id: 'create_invoice', label: 'Create Invoice', icon: CreditCard, color: 'hover:bg-teal-50 hover:text-teal-700' },
  ];

  const visibleNavItems = navItems.filter((item) => item.roles.includes(userRole));

  // ====================================================
  // OFFLINE SYNCHRONIZATION QUEUE & PENDING TASKS STATE
  // ====================================================
  const [offlineSyncQueue, setOfflineSyncQueue] = useState<OfflineSyncItem[]>([
    {
      id: 'sync-1',
      title: 'Attendance Check-in: Maya Chen',
      category: 'ATTENDANCE',
      size: '1.4 KB',
      progress: 85,
      status: 'READY_FOR_SYNC',
      timestamp: '1m ago',
      target: 'db/attendance_ledger',
    },
    {
      id: 'sync-2',
      title: 'Allergy Directive: Leo Vance',
      category: 'MEDICAL',
      size: '2.1 KB',
      progress: 60,
      status: 'BUFFERED',
      timestamp: '3m ago',
      target: 'db/children/medical',
    },
    {
      id: 'sync-3',
      title: 'Incident Record #INC-2026-08',
      category: 'INCIDENT',
      size: '3.8 KB',
      progress: 45,
      status: 'ENCRYPTING',
      timestamp: '5m ago',
      target: 'safety/incident_store',
    },
    {
      id: 'sync-4',
      title: 'Cryptographic SHA-256 Merkle Block',
      category: 'AUDIT',
      size: '0.9 KB',
      progress: 92,
      status: 'READY_FOR_SYNC',
      timestamp: '7m ago',
      target: 'compliance/audit_chain',
    },
    {
      id: 'sync-5',
      title: 'Infant Nap Observation: Liam Smith',
      category: 'REPORT',
      size: '1.8 KB',
      progress: 30,
      status: 'STAGED',
      timestamp: '10m ago',
      target: 'reports/daily_log',
    },
  ]);

  const [offlinePendingTasks, setOfflinePendingTasks] = useState<OfflinePendingTask[]>([
    {
      id: 'task-1',
      title: 'Replicate 8 Attendance Signatures',
      destination: 'Ontario Ministry CCEYA Portal',
      priority: 'REGULATORY',
      progress: 70,
      status: 'AWAITING_NETWORK',
    },
    {
      id: 'task-2',
      title: 'Verify Pediatric Allergy Hash Seal',
      destination: 'Provincial Child Health Registry',
      priority: 'HIGH',
      progress: 55,
      status: 'VERIFYING_HASH',
    },
    {
      id: 'task-3',
      title: 'Replicate Incident Notification to Agency',
      destination: 'WeeWatch Licensed Agency Node',
      priority: 'REGULATORY',
      progress: 80,
      status: 'AWAITING_NETWORK',
    },
    {
      id: 'task-4',
      title: 'Flush Media Storage Hash Pointer',
      destination: 'Encrypted S3-Compliant Vault',
      priority: 'NORMAL',
      progress: 25,
      status: 'QUEUED',
    },
  ]);

  const [offlineViewMode, setOfflineViewMode] = useState<'all' | 'queue' | 'tasks'>('all');
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);

  // Sync all items when network returns or manual trigger
  const handleSyncAllAndReconnect = () => {
    setIsSyncingAll(true);
    // Simulate rapid progress ticks to 100%
    setOfflineSyncQueue((prev) => prev.map((q) => ({ ...q, progress: 100, status: 'READY_FOR_SYNC' })));
    setOfflinePendingTasks((prev) => prev.map((t) => ({ ...t, progress: 100, status: 'QUEUED' })));

    setTimeout(() => {
      setIsSyncingAll(false);
      setIsOnline(true);
    }, 1200);
  };

  // Allow adding a test mutation to observe live queueing
  const handleAddOfflineMutation = () => {
    const categories: Array<OfflineSyncItem['category']> = ['ATTENDANCE', 'MEDICAL', 'INCIDENT', 'AUDIT', 'REPORT'];
    const chosenCat = categories[Math.floor(Math.random() * categories.length)];
    const newItem: OfflineSyncItem = {
      id: 'sync-' + Date.now(),
      title: `Local Offline Mutation #${offlineSyncQueue.length + 1}`,
      category: chosenCat,
      size: `${(Math.random() * 3 + 1).toFixed(1)} KB`,
      progress: Math.floor(Math.random() * 40) + 20,
      status: 'BUFFERED',
      timestamp: 'Just now',
      target: `local/cache_${chosenCat.toLowerCase()}`,
    };
    setOfflineSyncQueue((prev) => [newItem, ...prev]);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          id="left-panel-mobile-backdrop"
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Main Single Left Hand Panel */}
      <aside
        id="home-daycare-left-panel"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 md:w-80 flex flex-col bg-[#2D3814] border-r border-[#52632B] text-white transition-transform duration-300 ease-in-out shadow-lg ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header Branding */}
        <div className="p-4 sm:p-5 border-b border-white/15 bg-[#252E10]">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-[#D49A00] border border-white/20 flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-xs">
                  HD
                </div>
                <div>
                  <h1 className="text-white font-bold text-base tracking-tight leading-tight uppercase font-display">
                    HOME DAYCARE<br />PLATFORM
                  </h1>
                </div>
              </div>
              <p className="text-[#ffffff99] text-[10px] mt-1.5 font-mono tracking-wide flex items-center gap-1.5">
                <span>v4.2.0</span>
                <span className="opacity-40">•</span>
                <span className="text-[#E5A910] font-semibold">SECURE-LINK</span>
              </p>
            </div>

            <button
              id="close-mobile-panel-button"
              onClick={() => setIsOpenMobile(false)}
              className="lg:hidden p-1.5 text-white/70 hover:text-white rounded hover:bg-white/10"
              aria-label="Close Navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/20 text-[#E5A910] text-[10px] font-mono font-bold border border-[#E5A910]/30">
              <Lock className="w-2.5 h-2.5" /> AES-256
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#52632B] text-white text-[10px] font-mono font-bold border border-white/20">
              COPPA 2026
            </span>
          </div>
        </div>

        {/* Role Switcher Button Group */}
        <div className="p-3 border-b border-white/10 bg-[#21290E]">
          <div className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1.5 px-1 flex items-center justify-between font-mono">
            <span>ROLE PROFILE</span>
            <span className="text-[10px] font-bold text-[#E5A910] uppercase">
              {userRole}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1 p-1 bg-black/25 rounded border border-white/10">
            {roles.map((r) => {
              const isSelected = userRole === r.id;
              return (
                <button
                  key={r.id}
                  id={`role-select-${r.id}-button`}
                  onClick={() => setUserRole(r.id)}
                  className={`flex flex-col items-center justify-center py-1.5 px-1 rounded text-[10px] font-bold uppercase tracking-tight transition-all ${
                    isSelected
                      ? 'bg-[#52632B] text-white border border-[#E5A910]/50 shadow-xs'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                  title={`${r.label} View`}
                >
                  <span className="text-xs">{r.icon}</span>
                  <span className="mt-0.5 truncate">{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Middle Body: Primary Navigation & Quick Actions */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {/* OFFLINE NOTIFICATION & DATA SYNCHRONIZATION QUEUE PANEL */}
          {!isOnline && (
            <div
              id="offline-sync-notification-panel"
              className="bg-[#21290E] border-2 border-[#E5A910] rounded-md p-3 text-white space-y-2.5 shadow-lg animate-fadeIn font-sans"
            >
              {/* Header with Pulsing Beacon & Quick Flush Reconnect */}
              <div className="flex items-center justify-between pb-2 border-b border-amber-400/30">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                  <div>
                    <h4 className="text-[11px] font-bold font-mono uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <CloudOff className="w-3.5 h-3.5" />
                      Offline Mode Active
                    </h4>
                    <p className="text-[9px] text-white/70 font-mono">
                      {offlineSyncQueue.length} Queue Items • {offlinePendingTasks.length} Pending Tasks
                    </p>
                  </div>
                </div>

                <button
                  id="offline-force-reconnect-btn"
                  onClick={handleSyncAllAndReconnect}
                  disabled={isSyncingAll}
                  className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-mono font-bold rounded shadow-xs flex items-center gap-1 transition-colors uppercase cursor-pointer disabled:opacity-50"
                  title="Trigger immediate sync of all offline items and restore cloud connection"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingAll ? 'animate-spin' : ''}`} />
                  <span>{isSyncingAll ? 'Syncing…' : 'Sync All'}</span>
                </button>
              </div>

              {/* View Switcher Pills */}
              <div className="grid grid-cols-3 gap-1 p-0.5 bg-black/40 rounded border border-white/10 text-[9px] font-mono uppercase font-bold text-center">
                <button
                  id="offline-tab-all-btn"
                  onClick={() => setOfflineViewMode('all')}
                  className={`py-1 rounded transition-colors ${
                    offlineViewMode === 'all' ? 'bg-[#556B2F] text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  All ({offlineSyncQueue.length + offlinePendingTasks.length})
                </button>
                <button
                  id="offline-tab-queue-btn"
                  onClick={() => setOfflineViewMode('queue')}
                  className={`py-1 rounded transition-colors ${
                    offlineViewMode === 'queue' ? 'bg-[#556B2F] text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Queue ({offlineSyncQueue.length})
                </button>
                <button
                  id="offline-tab-tasks-btn"
                  onClick={() => setOfflineViewMode('tasks')}
                  className={`py-1 rounded transition-colors ${
                    offlineViewMode === 'tasks' ? 'bg-[#556B2F] text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Tasks ({offlinePendingTasks.length})
                </button>
              </div>

              {/* DATA SYNCHRONIZATION QUEUE ITEMS (Waiting for Cloud Sync) */}
              {(offlineViewMode === 'all' || offlineViewMode === 'queue') && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[9px] font-mono font-bold text-amber-200 uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1">
                      <Database className="w-2.5 h-2.5" />
                      Data Sync Queue (Waiting for Cloud)
                    </span>
                    <span className="text-amber-400">{offlineSyncQueue.length} buffered</span>
                  </div>

                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
                    {offlineSyncQueue.map((item) => (
                      <div
                        key={item.id}
                        className="p-2 bg-black/35 rounded border border-white/10 text-[10px] font-mono space-y-1.5 hover:bg-black/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-bold text-white truncate text-[10px]">
                            {item.title}
                          </span>
                          <span className="px-1 py-0.2 rounded text-[8px] bg-[#556B2F] text-white shrink-0 uppercase font-bold">
                            {item.category}
                          </span>
                        </div>

                        {/* Progress indicator with bar, percentage & status */}
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between text-[8.5px] text-white/70">
                            <span className="text-amber-300 font-semibold">{item.status.replace(/_/g, ' ')}</span>
                            <span className="font-bold text-amber-200">{item.progress}% waiting for sync</span>
                          </div>
                          <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden border border-white/10">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[8.5px] text-white/50">
                          <span className="truncate">Target: {item.target}</span>
                          <span>{item.size} • {item.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PENDING TASKS LIST (Waiting for Cloud Sync) */}
              {(offlineViewMode === 'all' || offlineViewMode === 'tasks') && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[9px] font-mono font-bold text-emerald-300 uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1">
                      <Radio className="w-2.5 h-2.5" />
                      Pending Tasks (Sync Queue)
                    </span>
                    <span className="text-emerald-400">{offlinePendingTasks.length} pending</span>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                    {offlinePendingTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-2 bg-black/35 rounded border border-white/10 text-[10px] font-mono space-y-1.5 hover:bg-black/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-bold text-white truncate text-[10px]">
                            {task.title}
                          </span>
                          <span
                            className={`px-1 py-0.2 rounded text-[8px] uppercase font-bold shrink-0 ${
                              task.priority === 'REGULATORY'
                                ? 'bg-rose-900 text-rose-200 border border-rose-700'
                                : 'bg-[#556B2F] text-white'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        {/* Progress indicator with bar, percentage & status */}
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between text-[8.5px] text-white/70">
                            <span className="text-emerald-300 font-semibold">{task.status.replace(/_/g, ' ')}</span>
                            <span className="font-bold text-emerald-200">{task.progress}% prepared</span>
                          </div>
                          <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden border border-white/10">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full transition-all duration-500"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="text-[8.5px] text-white/50 truncate">
                          Endpoint: {task.destination}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Offline Actions Toolbar */}
              <div className="pt-1 flex items-center justify-between gap-2 border-t border-white/10">
                <button
                  id="offline-add-mutation-btn"
                  onClick={handleAddOfflineMutation}
                  className="text-[9px] font-mono text-amber-300 hover:text-white flex items-center gap-1 py-0.5"
                  title="Simulate a new offline data mutation entry"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>+ Queue Mutation</span>
                </button>

                <span className="text-[8.5px] font-mono text-white/50">
                  Local AES-256 Vault Active
                </span>
              </div>
            </div>
          )}

          {/* Main Navigation Buttons */}
          <div>
            <div className="px-3 mb-1.5 flex items-center justify-between text-[10px] font-bold text-white/50 uppercase tracking-wider font-mono">
              <span>SYSTEM MODULES</span>
              <span className="text-[9px] text-emerald-400 font-semibold uppercase">ONLINE</span>
            </div>
            <nav className="space-y-0.5">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}-button`}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsOpenMobile(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors uppercase tracking-tight text-xs rounded-sm ${
                      isActive
                        ? 'bg-[#52632B] text-white font-bold border-l-4 border-[#E5A910] shadow-xs'
                        : 'text-[#ffffffcc] hover:bg-[#52632B]/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isActive ? 'bg-[#E5A910]' : 'bg-transparent border border-white/70'
                        }`}
                      />
                      <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                          isActive
                            ? 'bg-[#E5A910] text-black'
                            : 'bg-black/25 text-white/80 border border-white/10'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Actions Panel: Prominent requested buttons */}
          <div className="pt-2 border-t border-[#ffffff1f]">
            <div className="px-3 mb-1.5 flex items-center justify-between text-[10px] font-bold text-white/50 uppercase tracking-wider font-mono">
              <span>QUICK ACTIONS</span>
              <span className="text-[9px] text-[#E5A910] font-bold uppercase flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> FAST
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1">
              {quickActions.map((qa) => {
                const Icon = qa.icon;
                return (
                  <button
                    key={qa.id}
                    id={`quick-action-${qa.id}-button`}
                    onClick={() => {
                      onOpenQuickAction(qa.id);
                      setIsOpenMobile(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-semibold text-white/90 hover:text-white bg-[#354318] hover:bg-[#52632B] border border-white/10 transition-all uppercase tracking-tight active:scale-[0.99]"
                  >
                    <Icon className="w-3 h-3 shrink-0 text-[#E5A910]" />
                    <span className="truncate text-[11px]">{qa.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Utility Panel: Dark Mode, Cloud Sync, System Info */}
        <div className="p-4 bg-[#1E250E] border-t border-[#52632B] space-y-2.5">
          {/* Firebase Firestore Connection Badge */}
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-white text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-1">
              <Database className="w-3 h-3 text-amber-400" /> FIRESTORE DB
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-bold font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
              CONNECTED
            </span>
          </div>

          {/* Cloud Sync Status Button */}
          <div className="flex items-center justify-between">
            <span className="text-white text-xs font-bold uppercase tracking-wider font-mono">
              CLOUD SYNC
            </span>
            <button
              id="cloud-sync-toggle-button"
              onClick={() => setIsOnline(!isOnline)}
              className="flex items-center gap-1.5 focus:outline-none"
              title="Toggle Online / Offline Sync Mode"
            >
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-sm font-bold font-mono uppercase ${
                  isOnline
                    ? 'bg-green-500 text-white'
                    : 'bg-amber-500 text-white'
                }`}
              >
                {isOnline ? 'ACTIVE' : 'OFFLINE'}
              </span>
            </button>
          </div>

          {/* Dark Mode Toggle Row matching High Density design */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-white text-xs font-bold uppercase tracking-wider font-mono">
              DARK MODE
            </span>
            <button
              id="theme-toggle-button"
              onClick={() => setDarkMode(!darkMode)}
              className="w-10 h-5 bg-[#556B2F] border border-white/20 rounded-full relative p-0.5 cursor-pointer focus:outline-none transition-colors"
              title="Toggle Dark / Light Theme"
            >
              <div
                className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${
                  darkMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Quick link to AES-256 Vault */}
          <button
            id="aes-vault-indicator-button"
            onClick={() => setActiveTab('security')}
            className="w-full mt-1 py-1.5 px-2 bg-black/25 hover:bg-black/40 border border-white/15 rounded text-[10px] text-white/80 hover:text-white font-mono flex items-center justify-between transition-colors uppercase"
          >
            <span className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-400" /> AES-256 HARDWARE VAULT
            </span>
            <span className="text-emerald-400 font-bold">VERIFIED</span>
          </button>
        </div>
      </aside>
    </>
  );
};
