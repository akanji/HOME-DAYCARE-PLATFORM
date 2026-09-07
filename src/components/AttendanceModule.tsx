import React, { useState } from 'react';
import {
  Clock,
  CheckCircle,
  LogOut,
  QrCode,
  ShieldCheck,
  Download,
  Printer,
  Search,
  Filter,
  Users,
  Check,
} from 'lucide-react';
import { Child, AttendanceRecord } from '../types';

interface AttendanceModuleProps {
  childrenList: Child[];
  attendanceRecords: AttendanceRecord[];
  onCheckIn: (childId: string, authorizedAdult: string, note?: string) => void;
  onCheckOut: (childId: string, authorizedAdult: string, note?: string) => void;
  onLogAudit: (action: string, resource: string, details: string) => void;
}

export const AttendanceModule: React.FC<AttendanceModuleProps> = ({
  childrenList,
  attendanceRecords,
  onCheckIn,
  onCheckOut,
  onLogAudit,
}) => {
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChildForAction, setSelectedChildForAction] = useState<Child | null>(null);
  const [actionType, setActionType] = useState<'checkin' | 'checkout'>('checkin');
  const [selectedAdult, setSelectedAdult] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<'Face ID' | 'QR Code' | 'Staff PIN'>('Face ID');
  const [isVerifying, setIsVerifying] = useState(false);

  // Present and absent counts
  const presentCount = childrenList.filter((c) => c.isCheckedIn).length;
  const totalCount = childrenList.length;

  const handleOpenActionModal = (child: Child, type: 'checkin' | 'checkout') => {
    setSelectedChildForAction(child);
    setActionType(type);
    setSelectedAdult(child.authorizedPickups[0]?.name || child.parentName);
    setActionNote('');
  };

  const handleConfirmAction = () => {
    if (!selectedChildForAction) return;
    setIsVerifying(true);

    setTimeout(() => {
      if (actionType === 'checkin') {
        onCheckIn(selectedChildForAction.id, selectedAdult, actionNote);
        onLogAudit(
          'CHECKIN_RECORDED',
          `attendance/${selectedChildForAction.id}`,
          `Checked in ${selectedChildForAction.firstName}. Adult: ${selectedAdult}. Verification: ${verificationMethod}`
        );
      } else {
        onCheckOut(selectedChildForAction.id, selectedAdult, actionNote);
        onLogAudit(
          'CHECKOUT_RECORDED',
          `attendance/${selectedChildForAction.id}`,
          `Checked out ${selectedChildForAction.firstName}. Pickup: ${selectedAdult}. Verification: ${verificationMethod}`
        );
      }
      setIsVerifying(false);
      setSelectedChildForAction(null);
    }, 600);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Child Name', 'Date', 'Check-In Time', 'Check-Out Time', 'Authorized Adult', 'Verification', 'Status'];
    const rows = attendanceRecords.map((r) => [
      r.childName,
      r.date,
      r.checkInTime,
      r.checkOutTime || '--',
      r.authorizedAdult,
      r.verificationMethod,
      r.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `daycare_attendance_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onLogAudit('ATTENDANCE_EXPORT_CSV', 'reports/attendance', 'Exported attendance log to CSV');
  };

  const filteredRecords = attendanceRecords.filter((rec) =>
    rec.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.authorizedAdult.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 font-display">
              ATTENDANCE & AUTHORIZED PICKUP VERIFICATION
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
              {presentCount} / {totalCount} Present
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Digital check-in / check-out with biometric Face ID, QR codes, and authorized pickup identity match.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="export-attendance-csv-button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-[#23271D] border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#52632B]" />
            <span>Export CSV</span>
          </button>
          <button
            id="print-attendance-button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#52632B] text-white hover:bg-[#3E4C1E] shadow-xs transition-colors border border-[#E5A910]/40"
          >
            <Printer className="w-3.5 h-3.5 text-[#E5A910]" />
            <span>Print Attendance</span>
          </button>
        </div>
      </div>

      {/* Roster Quick Check-In / Check-Out Grid */}
      <div className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs">
        <h3 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-3">
          Live Roster Check-In / Check-Out Controls
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {childrenList.map((child) => (
            <div
              key={child.id}
              className="p-3 rounded-lg border border-neutral-200/80 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <img
                  src={child.avatarUrl}
                  alt={child.firstName}
                  className="w-9 h-9 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                />
                <div>
                  <div className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
                    {child.firstName} {child.lastName}
                  </div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    {child.isCheckedIn ? `In at ${child.checkInTime}` : 'Not checked in'}
                  </div>
                </div>
              </div>

              <div>
                {!child.isCheckedIn ? (
                  <button
                    onClick={() => handleOpenActionModal(child, 'checkin')}
                    className="px-3 py-1 rounded-md text-xs font-bold bg-[#52632B] text-white hover:bg-[#435222] shadow-xs transition-colors"
                  >
                    Check In
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenActionModal(child, 'checkout')}
                    className="px-3 py-1 rounded-md text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 shadow-xs transition-colors"
                  >
                    Check Out
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Audit Log Table */}
      <div className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              Attendance Records
            </span>
            <div className="flex items-center gap-1 text-xs">
              {(['today', 'week', 'month'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setFilterPeriod(period)}
                  className={`px-2 py-0.5 rounded capitalize ${
                    filterPeriod === period
                      ? 'bg-[#52632B] text-white font-semibold'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search child or adult..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612] focus:outline-hidden focus:ring-1 focus:ring-[#52632B]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-500 text-[10px] uppercase tracking-wider font-bold">
                <th className="py-2.5 px-3">Child Name</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Check In</th>
                <th className="py-2.5 px-3">Check Out</th>
                <th className="py-2.5 px-3">Authorized Pickup Adult</th>
                <th className="py-2.5 px-3">Verification</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40">
                  <td className="py-2.5 px-3 font-semibold text-neutral-900 dark:text-neutral-100">
                    {record.childName}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">{record.date}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                    {record.checkInTime}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-500">
                    {record.checkOutTime || '--'}
                  </td>
                  <td className="py-2.5 px-3 font-medium">{record.authorizedAdult}</td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#52632B] dark:text-[#A4C268] bg-[#52632B]/10 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      {record.verificationMethod}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        record.status === 'present'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : record.status === 'checked_out'
                          ? 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {record.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Action Modal */}
      {selectedChildForAction && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200 dark:border-neutral-800 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 font-display">
                {actionType === 'checkin' ? 'Check In Child' : 'Check Out Child'}
              </h3>
              <button
                onClick={() => setSelectedChildForAction(null)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900">
              <img
                src={selectedChildForAction.avatarUrl}
                alt={selectedChildForAction.firstName}
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div>
                <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                  {selectedChildForAction.firstName} {selectedChildForAction.lastName}
                </div>
                <div className="text-xs text-neutral-500">
                  Parent: {selectedChildForAction.parentName}
                </div>
              </div>
            </div>

            {/* Select Authorized Adult */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Authorized Adult for Drop-Off / Pickup:
              </label>
              <select
                value={selectedAdult}
                onChange={(e) => setSelectedAdult(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 font-medium text-neutral-800 dark:text-neutral-200"
              >
                {selectedChildForAction.authorizedPickups.map((p, i) => (
                  <option key={i} value={`${p.name} (${p.relation})`}>
                    {p.name} — {p.relation} ({p.phone})
                  </option>
                ))}
              </select>
            </div>

            {/* Verification Method */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Biometric / Physical Verification Protocol:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Face ID', 'QR Code', 'Staff PIN'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setVerificationMethod(m)}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold border text-center transition-all ${
                      verificationMethod === m
                        ? 'border-[#52632B] bg-[#52632B]/10 text-[#52632B] dark:text-[#E5A910]'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Note */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Optional Notes:
              </label>
              <input
                type="text"
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="e.g. Diaper bag received, medicine authorization active"
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
              />
            </div>

            {/* Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedChildForAction(null)}
                className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={isVerifying}
                className="px-5 py-2 text-xs font-bold bg-[#52632B] text-white rounded-lg hover:bg-[#3E4C1E] shadow-xs flex items-center gap-1.5 disabled:opacity-50 border border-[#E5A910]/40"
              >
                {isVerifying && <Clock className="w-3.5 h-3.5 animate-spin text-[#E5A910]" />}
                <span>
                  {actionType === 'checkin' ? 'Verify & Check In' : 'Verify & Check Out'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
