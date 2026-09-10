import React, { useState, useMemo } from 'react';
import {
  Users,
  AlertTriangle,
  CheckCircle,
  Plus,
  ArrowRightLeft,
  Clock,
  ShieldCheck,
  Scale,
  Sparkles,
  Phone,
  FileCheck,
  RefreshCw,
  UserPlus,
  BadgeCheck,
  X,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { Child, StaffMember, DaycareRoom, RatioConflict } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { StaffAttendanceRatioChart } from './StaffAttendanceRatioChart';

interface StaffSchedulingProps {
  staffList: StaffMember[];
  rooms: DaycareRoom[];
  childrenList: Child[];
  onUpdateStaff: (staff: StaffMember[]) => void;
  onUpdateRooms: (rooms: DaycareRoom[]) => void;
  onLogAudit?: (action: string, resource: string, details: string) => void;
}

export const StaffSchedulingModule: React.FC<StaffSchedulingProps> = ({
  staffList,
  rooms,
  childrenList,
  onUpdateStaff,
  onUpdateRooms,
  onLogAudit,
}) => {
  const { language, t } = useLanguage();
  const isFr = language === 'fr';

  // Selection states for modals
  const [selectedRoomIdForStaff, setSelectedRoomIdForStaff] = useState<string | null>(null);
  const [selectedChildForTransfer, setSelectedChildForTransfer] = useState<Child | null>(null);
  const [targetRoomForChild, setTargetRoomForChild] = useState<string>('');
  const [showAddStaffModal, setShowAddStaffModal] = useState<boolean>(false);
  const [showAuditSheetModal, setShowAuditSheetModal] = useState<boolean>(false);

  // New staff form state
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffMember['role']>('RECE');
  const [newStaffRegNum, setNewStaffRegNum] = useState('CECE #');
  const [newStaffShiftStart, setNewStaffShiftStart] = useState('08:00');
  const [newStaffShiftEnd, setNewStaffShiftEnd] = useState('16:00');
  const [newStaffRoomId, setNewStaffRoomId] = useState('room-toddler');
  const [newStaffIsBilingual, setNewStaffIsBilingual] = useState(true);

  // =========================================================================
  // AUTOMATED RATIO CONFLICT DETECTION ENGINE (Ontario CCEYA 2014 COMPLIANT)
  // Calculates real-time room ratios against statutory age-group requirements
  // =========================================================================
  const ratioAnalysis = useMemo(() => {
    const conflicts: RatioConflict[] = [];

    rooms.forEach((room) => {
      // Find on-duty staff assigned to this room
      const assignedStaff = staffList.filter(
        (s) => s.assignedRoomId === room.id && (s.status === 'On Duty' || s.status === 'Scheduled')
      );
      const staffCount = assignedStaff.length;

      // Count children assigned and present in this room
      const roomChildren = childrenList.filter((c) => room.assignedChildIds.includes(c.id));
      const childrenCount = roomChildren.length;

      // Legal ratio limit: max children allowed per 1 staff member
      const maxAllowedPerStaff = room.legalMaxRatio;
      const maxPermittedWithCurrentStaff = staffCount * maxAllowedPerStaff;

      if (childrenCount > 0 && staffCount === 0) {
        // Critical: zero staff with children present!
        conflicts.push({
          id: `conflict-${room.id}`,
          roomId: room.id,
          roomName: isFr ? room.nameFr : room.name,
          currentChildrenCount: childrenCount,
          currentStaffCount: 0,
          legalMaxRatio: maxAllowedPerStaff,
          actualRatio: `${childrenCount} : 0`,
          requiredRatio: `1 : ${maxAllowedPerStaff}`,
          deficit: Math.ceil(childrenCount / maxAllowedPerStaff),
          severity: 'CRITICAL',
          suggestedRemediation: `Room is completely unstaffed with ${childrenCount} children! Assign at least ${Math.ceil(childrenCount / maxAllowedPerStaff)} licensed RECE immediately.`,
          suggestedRemediationFr: `La salle n'a aucun personnel avec ${childrenCount} enfants ! Assigner au moins ${Math.ceil(childrenCount / maxAllowedPerStaff)} éducateur(trice) certifié(e) immédiatement.`,
        });
      } else if (childrenCount > maxPermittedWithCurrentStaff) {
        // Violation: child count exceeds staff capacity under Ontario CCEYA
        const staffNeeded = Math.ceil(childrenCount / maxAllowedPerStaff) - staffCount;
        conflicts.push({
          id: `conflict-${room.id}`,
          roomId: room.id,
          roomName: isFr ? room.nameFr : room.name,
          currentChildrenCount: childrenCount,
          currentStaffCount: staffCount,
          legalMaxRatio: maxAllowedPerStaff,
          actualRatio: `1 : ${(childrenCount / staffCount).toFixed(1)}`,
          requiredRatio: `1 : ${maxAllowedPerStaff}`,
          deficit: staffNeeded,
          severity: 'CRITICAL',
          suggestedRemediation: `Ratio violation under Ontario CCEYA: ${childrenCount} children requires at least ${staffCount + staffNeeded} staff members (1:${maxAllowedPerStaff} max). Deficit: ${staffNeeded} educator.`,
          suggestedRemediationFr: `Infraction au ratio de la Loi CCEYA : ${childrenCount} enfants requièrent au moins ${staffCount + staffNeeded} membres du personnel (max 1:${maxAllowedPerStaff}). Déficit : ${staffNeeded} éducateur(trice).`,
        });
      }
    });

    const hasCritical = conflicts.some((c) => c.severity === 'CRITICAL');
    return { conflicts, isCompliant: conflicts.length === 0, hasCritical };
  }, [rooms, staffList, childrenList, isFr]);

  // =========================================================================
  // 1-CLICK AUTOMATED AUTO-BALANCE ROSTER RESOLUTION
  // Automatically locates available/floating staff and reassigns them to deficit rooms
  // =========================================================================
  const handleAutoBalanceRoster = () => {
    if (ratioAnalysis.isCompliant) return;

    // Find rooms in deficit
    const deficitConflicts = ratioAnalysis.conflicts.filter((c) => c.deficit > 0);
    if (deficitConflicts.length === 0) return;

    const targetRoomId = deficitConflicts[0].roomId;

    // Search for unassigned or float staff members first
    let availableStaff = staffList.find(
      (s) => s.assignedRoomId === 'unassigned' || s.role === 'Float Educator'
    );

    // If none, find a staff member in an over-staffed room
    if (!availableStaff) {
      availableStaff = staffList.find((s) => {
        if (s.assignedRoomId === targetRoomId) return false;
        const currentRoom = rooms.find((r) => r.id === s.assignedRoomId);
        if (!currentRoom) return true;
        const staffInRoom = staffList.filter((x) => x.assignedRoomId === currentRoom.id);
        const childrenInRoom = currentRoom.assignedChildIds.length;
        // If room has extra staff
        return (staffInRoom.length - 1) * currentRoom.legalMaxRatio >= childrenInRoom;
      });
    }

    if (availableStaff) {
      // Reassign staff
      const updatedStaff = staffList.map((s) => {
        if (s.id === availableStaff?.id) {
          return { ...s, assignedRoomId: targetRoomId, status: 'On Duty' as const };
        }
        return s;
      });

      // Update room assignments
      const updatedRooms = rooms.map((r) => {
        let newStaffIds = [...r.assignedStaffIds];
        if (r.id === targetRoomId && !newStaffIds.includes(availableStaff!.id)) {
          newStaffIds.push(availableStaff!.id);
        } else if (r.id === availableStaff?.assignedRoomId) {
          newStaffIds = newStaffIds.filter((id) => id !== availableStaff!.id);
        }
        return { ...r, assignedStaffIds: newStaffIds };
      });

      onUpdateStaff(updatedStaff);
      onUpdateRooms(updatedRooms);

      if (onLogAudit) {
        onLogAudit(
          'RATIO_AUTO_RESOLVED',
          `rooms/${targetRoomId}`,
          `Auto-balance reassigned ${availableStaff.fullName} to room ${targetRoomId} resolving CCEYA ratio violation.`
        );
      }
    }
  };

  // Assign staff to specific room
  const handleAssignStaffToRoom = (staffId: string, roomId: string) => {
    const staffMember = staffList.find((s) => s.id === staffId);
    if (!staffMember) return;

    const oldRoomId = staffMember.assignedRoomId;

    const updatedStaff = staffList.map((s) => {
      if (s.id === staffId) {
        return { ...s, assignedRoomId: roomId, status: 'On Duty' as const };
      }
      return s;
    });

    const updatedRooms = rooms.map((r) => {
      let ids = [...r.assignedStaffIds];
      if (r.id === roomId && !ids.includes(staffId)) {
        ids.push(staffId);
      } else if (r.id === oldRoomId) {
        ids = ids.filter((id) => id !== staffId);
      }
      return { ...r, assignedStaffIds: ids };
    });

    onUpdateStaff(updatedStaff);
    onUpdateRooms(updatedRooms);

    if (onLogAudit) {
      onLogAudit(
        'STAFF_ASSIGNED_ROOM',
        `staff/${staffId}`,
        `Assigned educator ${staffMember.fullName} to ${roomId}`
      );
    }
    setSelectedRoomIdForStaff(null);
  };

  // Transfer Child from one room to another
  const handleTransferChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildForTransfer || !targetRoomForChild) return;

    const childId = selectedChildForTransfer.id;

    const updatedRooms = rooms.map((r) => {
      let ids = [...r.assignedChildIds];
      if (r.id === targetRoomForChild) {
        if (!ids.includes(childId)) ids.push(childId);
      } else {
        ids = ids.filter((id) => id !== childId);
      }
      return { ...r, assignedChildIds: ids };
    });

    onUpdateRooms(updatedRooms);

    if (onLogAudit) {
      onLogAudit(
        'CHILD_TRANSFERRED_ROOM',
        `children/${childId}`,
        `Transferred child ${selectedChildForTransfer.firstName} ${selectedChildForTransfer.lastName} to room ${targetRoomForChild}`
      );
    }
    setSelectedChildForTransfer(null);
  };

  // Add new staff member
  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const newStaff: StaffMember = {
      id: 'staff-' + Date.now(),
      fullName: newStaffName,
      role: newStaffRole,
      registrationNumber: newStaffRegNum,
      certifications: ['Standard First Aid & CPR-C', 'CCEYA Certified'],
      shiftStart: newStaffShiftStart,
      shiftEnd: newStaffShiftEnd,
      status: 'On Duty',
      assignedRoomId: newStaffRoomId,
      assignedChildrenIds: [],
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      phone: '(416) 555-0199',
      isBilingualFr: newStaffIsBilingual,
    };

    const updatedStaff = [...staffList, newStaff];
    const updatedRooms = rooms.map((r) => {
      if (r.id === newStaffRoomId) {
        return { ...r, assignedStaffIds: [...r.assignedStaffIds, newStaff.id] };
      }
      return r;
    });

    onUpdateStaff(updatedStaff);
    onUpdateRooms(updatedRooms);

    if (onLogAudit) {
      onLogAudit(
        'STAFF_MEMBER_CREATED',
        `staff/${newStaff.id}`,
        `Added new educator ${newStaff.fullName} (${newStaff.role}) to ${newStaffRoomId}`
      );
    }

    setNewStaffName('');
    setShowAddStaffModal(false);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner: Provincial Legal Standards & Conflict Alert */}
      <div className="bg-white dark:bg-[#181a15] rounded-xl border border-gray-200 dark:border-neutral-800 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-[#52632B]/10 dark:bg-[#52632B]/20 text-[#52632B] dark:text-[#9BB762]">
                <Scale className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-neutral-100 font-display">
                  {t('staff.title')}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                    Ontario CCEYA O. Reg. 137/15 S. 8
                  </span>
                  <span className="text-xs text-gray-500 dark:text-neutral-400">
                    {t('staff.subtitle')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Auto-Resolve button if conflict exists */}
            {!ratioAnalysis.isCompliant && (
              <button
                id="staff-auto-resolve-conflicts-btn"
                onClick={handleAutoBalanceRoster}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold font-mono bg-red-600 hover:bg-red-700 text-white shadow-sm animate-pulse cursor-pointer transition-all"
                title="Automatically reassign available float educator to restore Ontario legal ratio"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{t('staff.autoResolve')}</span>
              </button>
            )}

            <button
              id="staff-add-educator-btn"
              onClick={() => setShowAddStaffModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold font-mono bg-[#52632B] hover:bg-[#3E4C1E] text-white shadow-xs cursor-pointer transition-colors border border-[#E5A910]/40"
            >
              <UserPlus className="w-4 h-4 text-[#E5A910]" />
              <span>{t('staff.addStaff')}</span>
            </button>

            <button
              id="staff-export-ratio-audit-sheet-btn"
              onClick={() => setShowAuditSheetModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold font-mono bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 text-gray-800 dark:text-neutral-200 shadow-xs cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4 text-gray-500" />
              <span>{t('staff.printAudit')}</span>
            </button>
          </div>
        </div>

        {/* Real-Time Conflict Detection Status Banner */}
        <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-neutral-800">
          {ratioAnalysis.isCompliant ? (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-xs font-bold font-mono">
                  {t('staff.allCompliant')}:
                </span>
                <span className="text-xs text-emerald-700 dark:text-emerald-400">
                  {isFr
                    ? 'Tous les groupes (nourrissons 1:3, bambins 1:5, préscolaire 1:8) respectent les exigences provinciales.'
                    : 'All classroom environments (infant 1:3, toddler 1:5, preschool 1:8) satisfy Ontario statutory requirements.'}
                </span>
              </div>
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700">
                100% RATIO SAFE
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {ratioAnalysis.conflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex flex-col md:flex-row md:items-center justify-between gap-2.5 animate-fadeIn"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-rose-900 dark:text-rose-200 uppercase">
                          {t('staff.conflictsDetected')}: {conflict.roomName}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-bold uppercase bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200">
                          {t('staff.deficit')}: {conflict.deficit} {isFr ? 'éducateur' : 'staff'}
                        </span>
                      </div>
                      <p className="text-xs text-rose-800 dark:text-rose-300 mt-0.5">
                        {isFr ? conflict.suggestedRemediationFr : conflict.suggestedRemediation}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-[11px] font-mono text-rose-700 dark:text-rose-400">
                        <span>{t('staff.currentRatio')}: <strong className="font-bold">{conflict.actualRatio}</strong></span>
                        <span>•</span>
                        <span>{t('staff.legalRatioReq')}: <strong className="font-bold">{conflict.requiredRatio}</strong></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleAutoBalanceRoster}
                    className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold font-mono uppercase tracking-tight shrink-0 self-start md:self-center shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{t('staff.autoResolve')}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 7-Day Staff Coverage Hours vs. Child Attendance Ratio Recharts Widget */}
      <StaffAttendanceRatioChart
        staffList={staffList}
        rooms={rooms}
        childrenList={childrenList}
      />

      {/* Classrooms Grid: Ratios, Staff & Children */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#52632B] dark:text-[#E5A910] uppercase tracking-wider font-mono flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{t('staff.roomsTitle')}</span>
          </h3>
          <span className="text-[10px] font-mono text-gray-500">
            {rooms.length} {isFr ? 'Salles configurées' : 'Active Learning Rooms'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {rooms.map((room) => {
            const assignedStaff = staffList.filter((s) => s.assignedRoomId === room.id);
            const assignedChildren = childrenList.filter((c) => room.assignedChildIds.includes(c.id));
            const staffCount = assignedStaff.length;
            const childCount = assignedChildren.length;

            const isOverCapacity = childCount > room.capacity;
            const isRatioViolated =
              childCount > 0 &&
              (staffCount === 0 || childCount > staffCount * room.legalMaxRatio);

            const ratioDisplay = staffCount > 0 ? `1 : ${(childCount / staffCount).toFixed(1)}` : `${childCount} : 0`;

            return (
              <div
                key={room.id}
                className={`bg-white dark:bg-[#181a15] rounded-xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
                  isRatioViolated
                    ? 'border-red-400 dark:border-red-800 ring-2 ring-red-400/20'
                    : 'border-gray-200 dark:border-neutral-800'
                }`}
              >
                <div>
                  {/* Room Top Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-gray-100 dark:border-neutral-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: room.color }}
                        />
                        <h4 className="font-bold text-sm text-gray-900 dark:text-neutral-100">
                          {isFr ? room.nameFr : room.name}
                        </h4>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-neutral-400 font-mono mt-0.5">
                        {isFr ? room.ageRangeDescriptionFr : room.ageRangeDescription} • Zone: {room.floorPlanZone}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          isRatioViolated
                            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 animate-pulse'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {isRatioViolated ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                        {isRatioViolated ? 'RATIO CONFLICT' : 'RATIO COMPLIANT'}
                      </span>
                      <div className="text-[10px] font-mono text-gray-400 mt-1">
                        Legal Max: 1:{room.legalMaxRatio}
                      </div>
                    </div>
                  </div>

                  {/* Ratio Metric Indicator Gauge */}
                  <div className="my-3 p-2.5 rounded-lg bg-gray-50 dark:bg-[#12140f] border border-gray-200/80 dark:border-neutral-800 flex items-center justify-between font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase block">{t('staff.currentRatio')}</span>
                      <span className={`text-base font-black ${isRatioViolated ? 'text-red-600' : 'text-gray-900 dark:text-neutral-100'}`}>
                        {ratioDisplay}
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-[10px] text-gray-400 uppercase block">{t('staff.staffAssigned')}</span>
                      <span className="text-base font-black text-[#52632B] dark:text-[#9BB762]">
                        {staffCount} {isFr ? 'éducateur(s)' : 'staff'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 uppercase block">{t('staff.childrenEnrolled')}</span>
                      <span className="text-base font-black text-gray-900 dark:text-neutral-100">
                        {childCount} / {room.capacity}
                      </span>
                    </div>
                  </div>

                  {/* Assigned Educators Section */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-700 dark:text-neutral-300 font-mono uppercase">
                        {t('staff.staffAssigned')} ({assignedStaff.length})
                      </span>
                      <button
                        onClick={() => setSelectedRoomIdForStaff(room.id)}
                        className="text-[10px] text-[#556B2F] dark:text-[#9BB762] font-bold font-mono hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{t('staff.assignToRoom')}</span>
                      </button>
                    </div>

                    {assignedStaff.length === 0 ? (
                      <div className="p-2 rounded bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-400 font-mono italic">
                        {isFr ? 'Aucun éducateur assigné à cette salle.' : 'No staff currently assigned to this room.'}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {assignedStaff.map((staff) => (
                          <div
                            key={staff.id}
                            className="p-2 rounded border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#1c1f18] flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={staff.avatarUrl}
                                alt={staff.fullName}
                                className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-neutral-700"
                              />
                              <div>
                                <div className="text-xs font-bold text-gray-900 dark:text-neutral-100 flex items-center gap-1">
                                  <span>{staff.fullName}</span>
                                  {staff.isBilingualFr && (
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold" title="Bilingual French/English Educator">
                                      FR/EN
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-gray-500 font-mono">
                                  {staff.role} • {staff.shiftStart} - {staff.shiftEnd}
                                </div>
                              </div>
                            </div>

                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                                staff.status === 'On Duty'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {staff.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assigned Children Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-700 dark:text-neutral-300 font-mono uppercase">
                        {t('staff.childrenEnrolled')} ({assignedChildren.length})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {assignedChildren.map((child) => (
                        <div
                          key={child.id}
                          className="p-1.5 rounded bg-gray-50 dark:bg-[#141611] border border-gray-200/60 dark:border-neutral-800 flex items-center justify-between text-xs group"
                        >
                          <div className="truncate">
                            <span className="font-semibold text-gray-800 dark:text-neutral-200 block truncate text-[11px]">
                              {child.firstName} {child.lastName.slice(0, 1)}.
                            </span>
                            <span className="text-[9px] text-gray-400 font-mono">
                              {child.ageYears}y {child.ageMonths}m
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedChildForTransfer(child);
                              setTargetRoomForChild(room.id);
                            }}
                            title="Transfer child to another classroom"
                            className="text-gray-400 hover:text-[#52632B] p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Regulatory Standard Note */}
                <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-neutral-800 text-[9px] font-mono text-gray-400 flex items-center justify-between">
                  <span>{room.regulatoryStandard}</span>
                  <span className="text-[#52632B] dark:text-[#9BB762] font-semibold">Capacity: {room.capacity}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Staff Roster Table with Certifications & Shift Status */}
      <div className="bg-white dark:bg-[#181a15] rounded-xl border border-gray-200 dark:border-neutral-800 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-neutral-800">
          <h3 className="text-xs font-bold text-[#52632B] dark:text-[#E5A910] uppercase tracking-wider font-mono flex items-center gap-2">
            <BadgeCheck className="w-4 h-4" />
            <span>{t('staff.rosterTitle')}</span>
          </h3>
          <span className="text-xs font-mono text-gray-500">
            {staffList.length} {isFr ? 'Éducateurs certifiés' : 'Total Licensed Educators'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-gray-200 dark:border-neutral-800 text-gray-400 font-mono text-[10px] uppercase">
                <th className="pb-2">Educator</th>
                <th className="pb-2">Ontario Registration</th>
                <th className="pb-2">Shift Hours</th>
                <th className="pb-2">Assigned Room</th>
                <th className="pb-2">Certifications</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {staffList.map((staff) => {
                const assignedRoom = rooms.find((r) => r.id === staff.assignedRoomId);
                return (
                  <tr key={staff.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="py-2.5 pr-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={staff.avatarUrl}
                          alt={staff.fullName}
                          className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-neutral-700"
                        />
                        <div>
                          <div className="font-bold text-gray-900 dark:text-neutral-100 flex items-center gap-1">
                            <span>{staff.fullName}</span>
                            {staff.isBilingualFr && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold" title={t('staff.bilingualRece')}>
                                FR/EN
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono">{staff.role}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 font-mono text-[11px] text-gray-700 dark:text-neutral-300">
                      {staff.registrationNumber || 'In Process'}
                    </td>

                    <td className="py-2.5 font-mono text-[11px] text-gray-600 dark:text-neutral-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{staff.shiftStart} - {staff.shiftEnd}</span>
                      </div>
                    </td>

                    <td className="py-2.5">
                      {assignedRoom ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-neutral-200">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: assignedRoom.color }} />
                          <span>{isFr ? assignedRoom.nameFr : assignedRoom.name}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 italic font-mono text-[11px]">
                          {isFr ? 'Non assigné (Flottant)' : 'Unassigned (Floating)'}
                        </span>
                      )}
                    </td>

                    <td className="py-2.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {staff.certifications.slice(0, 2).map((cert, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] px-1.5 py-0.2 rounded bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 font-mono truncate"
                          >
                            {cert}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-2.5">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          staff.status === 'On Duty'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : staff.status === 'On Break'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-neutral-400'
                        }`}
                      >
                        {staff.status}
                      </span>
                    </td>

                    <td className="py-2.5 text-right">
                      <select
                        value={staff.assignedRoomId}
                        onChange={(e) => handleAssignStaffToRoom(staff.id, e.target.value)}
                        className="text-[10px] font-mono bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded px-2 py-1 text-gray-700 dark:text-neutral-300 cursor-pointer"
                      >
                        <option value="unassigned">{isFr ? 'Flottant / Relève' : 'Floating / Relief'}</option>
                        {rooms.map((r) => (
                          <option key={r.id} value={r.id}>
                            {isFr ? r.nameFr : r.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ASSIGN STAFF TO SPECIFIC ROOM */}
      {selectedRoomIdForStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#181a15] rounded-xl border border-gray-200 dark:border-neutral-800 max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-neutral-100 font-display">
                {t('staff.assignToRoom')}
              </h3>
              <button
                onClick={() => setSelectedRoomIdForStaff(null)}
                className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-neutral-400">
              {isFr
                ? 'Sélectionnez un éducateur qualifié pour l\'affecter à cette salle et rétablir la conformité aux ratios provinciaux :'
                : 'Select an educator from the roster to deploy to this room to satisfy statutory child-to-staff ratios:'}
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {staffList.map((staff) => {
                const isCurrentlyHere = staff.assignedRoomId === selectedRoomIdForStaff;
                return (
                  <div
                    key={staff.id}
                    onClick={() => handleAssignStaffToRoom(staff.id, selectedRoomIdForStaff)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      isCurrentlyHere
                        ? 'border-[#52632B] bg-[#52632B]/5 dark:bg-[#52632B]/10'
                        : 'border-gray-200 dark:border-neutral-800 hover:border-[#52632B]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={staff.avatarUrl}
                        alt={staff.fullName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="text-xs font-bold text-gray-900 dark:text-neutral-100">
                          {staff.fullName}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {staff.role} • Status: {staff.status}
                        </div>
                      </div>
                    </div>

                    <button className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-[#52632B] text-white hover:bg-[#3E4C1E]">
                      {isCurrentlyHere ? 'Assigned' : 'Assign'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TRANSFER CHILD TO ROOM */}
      {selectedChildForTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <form
            onSubmit={handleTransferChild}
            className="bg-white dark:bg-[#181a15] rounded-xl border border-gray-200 dark:border-neutral-800 max-w-md w-full p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-neutral-100 font-display">
                {t('staff.assignChildToRoom')}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedChildForTransfer(null)}
                className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-[#12140f] rounded-lg border border-gray-200 dark:border-neutral-800 flex items-center gap-3">
              <img
                src={selectedChildForTransfer.avatarUrl}
                alt={selectedChildForTransfer.firstName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h4 className="font-bold text-xs text-gray-900 dark:text-neutral-100">
                  {selectedChildForTransfer.firstName} {selectedChildForTransfer.lastName}
                </h4>
                <p className="text-[10px] font-mono text-gray-500">
                  Age: {selectedChildForTransfer.ageYears}y {selectedChildForTransfer.ageMonths}m • Status: {selectedChildForTransfer.isCheckedIn ? 'Present' : 'Expected'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold font-mono text-gray-700 dark:text-neutral-300 mb-1">
                Select Destination Classroom:
              </label>
              <select
                value={targetRoomForChild}
                onChange={(e) => setTargetRoomForChild(e.target.value)}
                className="w-full p-2 text-xs rounded border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#141611] text-gray-900 dark:text-neutral-100"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {isFr ? r.nameFr : r.name} ({isFr ? r.ageRangeDescriptionFr : r.ageRangeDescription})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setSelectedChildForTransfer(null)}
                className="px-3 py-1.5 rounded text-xs font-mono text-gray-600 dark:text-neutral-400 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded text-xs font-mono font-bold bg-[#52632B] text-white hover:bg-[#3E4C1E]"
              >
                Transfer Child
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD / SCHEDULE NEW STAFF MEMBER */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <form
            onSubmit={handleCreateStaff}
            className="bg-white dark:bg-[#181a15] rounded-xl border border-gray-200 dark:border-neutral-800 max-w-md w-full p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-neutral-100 font-display">
                {t('staff.addStaff')}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
                className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold font-mono text-gray-700 dark:text-neutral-300 mb-1">
                  Full Name & Credentials:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rachel Lapointe, RECE"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full p-2 text-xs rounded border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#141611] text-gray-900 dark:text-neutral-100 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold font-mono text-gray-700 dark:text-neutral-300 mb-1">
                    Role:
                  </label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as any)}
                    className="w-full p-2 text-xs rounded border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#141611] text-gray-900 dark:text-neutral-100 font-mono"
                  >
                    <option value="Lead RECE">Lead RECE</option>
                    <option value="RECE">RECE</option>
                    <option value="Early Childhood Assistant (ECA)">ECA (Assistant)</option>
                    <option value="Float Educator">Float Educator</option>
                    <option value="Special Needs Resource">Special Needs Resource</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono text-gray-700 dark:text-neutral-300 mb-1">
                    Ontario CECE Number:
                  </label>
                  <input
                    type="text"
                    value={newStaffRegNum}
                    onChange={(e) => setNewStaffRegNum(e.target.value)}
                    placeholder="CECE #79012"
                    className="w-full p-2 text-xs rounded border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#141611] text-gray-900 dark:text-neutral-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold font-mono text-gray-700 dark:text-neutral-300 mb-1">
                    Shift Start:
                  </label>
                  <input
                    type="time"
                    value={newStaffShiftStart}
                    onChange={(e) => setNewStaffShiftStart(e.target.value)}
                    className="w-full p-2 text-xs rounded border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#141611] text-gray-900 dark:text-neutral-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono text-gray-700 dark:text-neutral-300 mb-1">
                    Shift End:
                  </label>
                  <input
                    type="time"
                    value={newStaffShiftEnd}
                    onChange={(e) => setNewStaffShiftEnd(e.target.value)}
                    className="w-full p-2 text-xs rounded border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#141611] text-gray-900 dark:text-neutral-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold font-mono text-gray-700 dark:text-neutral-300 mb-1">
                  Assign to Classroom:
                </label>
                <select
                  value={newStaffRoomId}
                  onChange={(e) => setNewStaffRoomId(e.target.value)}
                  className="w-full p-2 text-xs rounded border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#141611] text-gray-900 dark:text-neutral-100 font-mono"
                >
                  <option value="unassigned">Floating / Unassigned</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {isFr ? r.nameFr : r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="bilingual-check"
                  checked={newStaffIsBilingual}
                  onChange={(e) => setNewStaffIsBilingual(e.target.checked)}
                  className="rounded text-[#52632B] focus:ring-[#52632B]"
                />
                <label htmlFor="bilingual-check" className="text-xs text-gray-700 dark:text-neutral-300 cursor-pointer">
                  {t('staff.bilingualRece')}
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
                className="px-3 py-1.5 rounded text-xs font-mono text-gray-600 dark:text-neutral-400 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded text-xs font-mono font-bold bg-[#52632B] text-white hover:bg-[#3E4C1E] shadow-xs"
              >
                Save & Schedule Staff
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: OFFICIAL ONTARIO RATIO AUDIT SHEET */}
      {showAuditSheetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#181a15] rounded-xl border border-gray-200 dark:border-neutral-800 max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#52632B]" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-neutral-100 font-mono uppercase">
                    Ontario Ministry of Education CCEYA Staff Ratio Audit Sheet
                  </h3>
                  <p className="text-[10px] text-gray-500 font-mono">
                    Official Verification Ledger • Date: {new Date().toLocaleDateString('en-CA')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAuditSheetModal(false)}
                className="p-1 rounded text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border border-gray-200 dark:border-neutral-700 rounded-lg p-3 font-mono text-xs space-y-2 bg-gray-50/50 dark:bg-[#12140f]">
              <div className="flex justify-between border-b pb-1 text-[11px]">
                <span className="font-bold">Agency / Facility:</span>
                <span>Sunshine Home Daycare Network (Ontario CCEYA Lic. #ON-77821)</span>
              </div>
              <div className="flex justify-between border-b pb-1 text-[11px]">
                <span className="font-bold">Director in Charge:</span>
                <span>Clara Oswald, RECE (CECE #55201)</span>
              </div>
              <div className="flex justify-between border-b pb-1 text-[11px]">
                <span className="font-bold">Ratio Status:</span>
                <span className={`font-bold ${ratioAnalysis.isCompliant ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {ratioAnalysis.isCompliant ? 'ALL ROOMS STATUTORILY COMPLIANT' : 'VIOLATION DETECTED'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold font-mono uppercase text-gray-700 dark:text-neutral-300">
                Room-by-Room Ratio Log:
              </h4>
              <div className="divide-y border rounded-lg text-xs font-mono">
                {rooms.map((r) => {
                  const sCount = staffList.filter((s) => s.assignedRoomId === r.id).length;
                  const cCount = r.assignedChildIds.length;
                  const ratio = sCount > 0 ? `1:${(cCount / sCount).toFixed(1)}` : `${cCount}:0`;
                  const isOk = cCount <= sCount * r.legalMaxRatio;
                  return (
                    <div key={r.id} className="p-2 flex items-center justify-between">
                      <div>
                        <span className="font-bold">{isFr ? r.nameFr : r.name}</span>
                        <span className="text-[10px] text-gray-400 block">{r.regulatoryStandard}</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold ${isOk ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {ratio} (Req: 1:{r.legalMaxRatio})
                        </span>
                        <span className="text-[10px] text-gray-500 block">
                          {cCount} kids / {sCount} staff
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-neutral-800">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-[#52632B] hover:bg-[#3E4C1E] text-white rounded text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official PDF / Audit Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
