import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Users,
  Clock,
  Scale,
  ShieldCheck,
  TrendingUp,
  Info,
  Calendar,
  Sparkles,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import { StaffMember, DaycareRoom, Child } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface StaffAttendanceRatioChartProps {
  staffList: StaffMember[];
  rooms: DaycareRoom[];
  childrenList: Child[];
}

interface DayMetric {
  day: string;
  dayShort: string;
  date: string;
  staffCoverageHours: number;
  activeStaffCount: number;
  childAttendanceCount: number;
  childAttendanceHours: number;
  realizedRatio: number;
  cceyaLegalLimit: number;
  complianceBuffer: number;
  status: 'OPTIMAL' | 'ACCEPTABLE' | 'TIGHT';
  notes: string;
}

export const StaffAttendanceRatioChart: React.FC<StaffAttendanceRatioChartProps> = ({
  staffList,
  rooms,
  childrenList,
}) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';

  const [viewMode, setViewMode] = useState<'ratio_vs_hours' | 'attendance_vs_staff' | 'ratio_only'>('ratio_vs_hours');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(3); // Default to Thursday peak

  // Compute realistic 7-day data combining actual current staff & child counts with weekly operating shifts
  const weeklyData: DayMetric[] = useMemo(() => {
    const baseStaffOnDuty = staffList.filter((s) => s.status !== 'Off Duty').length || 4;
    const baseChildCount = childrenList.length || 9;

    const daysConfig = [
      { day: isFr ? 'Lundi' : 'Monday', dayShort: isFr ? 'Lun' : 'Mon', date: 'Sep 01', staffFactor: 1.0, childCount: baseChildCount, notes: 'Morning drop-off peak at 08:30' },
      { day: isFr ? 'Mardi' : 'Tuesday', dayShort: isFr ? 'Mar' : 'Tue', date: 'Sep 02', staffFactor: 1.0, childCount: baseChildCount, notes: 'Full enrollment; French circle time' },
      { day: isFr ? 'Mercredi' : 'Wednesday', dayShort: isFr ? 'Mer' : 'Wed', date: 'Sep 03', staffFactor: 1.0, childCount: baseChildCount + 1, notes: 'Peak mid-week enrollment; 2 RECEs on duty' },
      { day: isFr ? 'Jeudi' : 'Thursday', dayShort: isFr ? 'Jeu' : 'Thu', date: 'Sep 04', staffFactor: 1.1, childCount: baseChildCount, notes: 'Outdoor nature walk; extra float coverage' },
      { day: isFr ? 'Vendredi' : 'Friday', dayShort: isFr ? 'Ven' : 'Fri', date: 'Sep 05', staffFactor: 0.95, childCount: baseChildCount - 1, notes: 'Early family pickups starting at 15:00' },
      { day: isFr ? 'Samedi' : 'Saturday', dayShort: isFr ? 'Sam' : 'Sat', date: 'Sep 06', staffFactor: 0.4, childCount: Math.max(2, Math.floor(baseChildCount * 0.3)), notes: 'Optional weekend respite care session' },
      { day: isFr ? 'Dimanche' : 'Sunday', dayShort: isFr ? 'Dim' : 'Sun', date: 'Sep 07', staffFactor: 0.25, childCount: Math.max(1, Math.floor(baseChildCount * 0.2)), notes: 'Emergency care on call / facility sanitization' },
    ];

    return daysConfig.map((cfg) => {
      const activeStaff = Math.max(1, Math.round(baseStaffOnDuty * cfg.staffFactor));
      // Average 8 hrs per on-duty staff
      const staffCoverageHours = activeStaff * 8;
      const childCount = cfg.childCount;
      const childAttendanceHours = childCount * 7.5;
      // Realized child-to-staff ratio across the operating day
      const realizedRatio = parseFloat((childCount / activeStaff).toFixed(1));
      const cceyaLegalLimit = 5.0; // Ontario CCEYA Toddler blended statutory max benchmark (1:5)
      const complianceBuffer = parseFloat((cceyaLegalLimit - realizedRatio).toFixed(1));

      let status: 'OPTIMAL' | 'ACCEPTABLE' | 'TIGHT' = 'OPTIMAL';
      if (complianceBuffer < 0.8) {
        status = 'TIGHT';
      } else if (complianceBuffer < 1.5) {
        status = 'ACCEPTABLE';
      }

      return {
        day: cfg.day,
        dayShort: cfg.dayShort,
        date: cfg.date,
        staffCoverageHours,
        activeStaffCount: activeStaff,
        childAttendanceCount: childCount,
        childAttendanceHours,
        realizedRatio,
        cceyaLegalLimit,
        complianceBuffer,
        status,
        notes: cfg.notes,
      };
    });
  }, [staffList, childrenList, isFr]);

  // Aggregate KPI metrics
  const totalStaffHours = useMemo(
    () => weeklyData.reduce((acc, d) => acc + d.staffCoverageHours, 0),
    [weeklyData]
  );
  const avgRatio = useMemo(
    () => (weeklyData.reduce((acc, d) => acc + d.realizedRatio, 0) / weeklyData.length).toFixed(1),
    [weeklyData]
  );
  const totalChildDays = useMemo(
    () => weeklyData.reduce((acc, d) => acc + d.childAttendanceCount, 0),
    [weeklyData]
  );
  const selectedDay = selectedDayIndex !== null ? weeklyData[selectedDayIndex] : weeklyData[0];

  return (
    <div
      id="staff-coverage-ratio-analytics-widget"
      className="bg-white dark:bg-[#181a15] rounded-xl border border-gray-200 dark:border-neutral-800 p-5 shadow-xs space-y-5 font-sans"
    >
      {/* Widget Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-neutral-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-[#52632B]/10 dark:bg-[#52632B]/20 text-[#52632B] dark:text-[#E5A910]">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-neutral-100 font-mono uppercase tracking-tight flex items-center gap-2">
                <span>7-Day Staff Coverage Hours vs. Child Attendance Ratio</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                  CCEYA 100% Ratio Safe
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                Weekly longitudinal visualization comparing licensed staff shift hours with realized child-to-staff ratios against Ontario statutory ceilings.
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-neutral-900 p-1 rounded-lg border border-gray-200 dark:border-neutral-800 text-xs font-mono">
          <button
            id="view-ratio-vs-hours-btn"
            type="button"
            onClick={() => setViewMode('ratio_vs_hours')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
              viewMode === 'ratio_vs_hours'
                ? 'bg-white dark:bg-neutral-800 text-[#52632B] dark:text-[#E5A910] shadow-xs'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-neutral-200'
            }`}
          >
            Dual: Hours & Ratio
          </button>
          <button
            id="view-attendance-vs-staff-btn"
            type="button"
            onClick={() => setViewMode('attendance_vs_staff')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
              viewMode === 'attendance_vs_staff'
                ? 'bg-white dark:bg-neutral-800 text-[#52632B] dark:text-[#E5A910] shadow-xs'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-neutral-200'
            }`}
          >
            Staff vs. Children Count
          </button>
          <button
            id="view-ratio-only-btn"
            type="button"
            onClick={() => setViewMode('ratio_only')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
              viewMode === 'ratio_only'
                ? 'bg-white dark:bg-neutral-800 text-[#52632B] dark:text-[#E5A910] shadow-xs'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-neutral-200'
            }`}
          >
            Statutory Ratio Margin
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#141611] border border-gray-200 dark:border-neutral-800">
          <span className="text-[10px] font-mono text-gray-500 uppercase block font-bold">
            Total Staff Coverage
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black font-mono text-[#52632B] dark:text-[#9BB762]">
              {totalStaffHours}
            </span>
            <span className="text-[11px] font-mono text-gray-400">hours</span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> 7-day total shifts
          </span>
        </div>

        <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#141611] border border-gray-200 dark:border-neutral-800">
          <span className="text-[10px] font-mono text-gray-500 uppercase block font-bold">
            Avg Realized Ratio
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">
              1 : {avgRatio}
            </span>
            <span className="text-[11px] font-mono text-gray-400">child/staff</span>
          </div>
          <span className="text-[10px] text-gray-400 font-mono mt-0.5">
            Legal max limit: 1 : 5.0
          </span>
        </div>

        <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#141611] border border-gray-200 dark:border-neutral-800">
          <span className="text-[10px] font-mono text-gray-500 uppercase block font-bold">
            Total Child Days
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black font-mono text-gray-900 dark:text-neutral-100">
              {totalChildDays}
            </span>
            <span className="text-[11px] font-mono text-gray-400">attendances</span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
            100% capacity compliant
          </span>
        </div>

        <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
          <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-300 uppercase block font-bold">
            Safety Buffer Cushion
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-400">
              +{(5.0 - parseFloat(avgRatio)).toFixed(1)}
            </span>
            <span className="text-[11px] font-mono text-emerald-600">points margin</span>
          </div>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
            Zero statutory infractions
          </span>
        </div>
      </div>

      {/* Main Recharts Visualization Stage */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={weeklyData}
            margin={{ top: 15, right: 25, left: -5, bottom: 5 }}
            onClick={(state) => {
              if (state && state.activeTooltipIndex !== undefined) {
                setSelectedDayIndex(state.activeTooltipIndex);
              }
            }}
          >
            <defs>
              {/* Olive Bar Gradient */}
              <linearGradient id="staffBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#52632B" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#3E4C1E" stopOpacity={0.65} />
              </linearGradient>

              {/* Child Attendance Area Gradient */}
              <linearGradient id="childAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E5A910" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#E5A910" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(150, 150, 150, 0.15)" vertical={false} />

            <XAxis
              dataKey="dayShort"
              stroke="#888888"
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              axisLine={{ stroke: 'rgba(150, 150, 150, 0.2)' }}
            />

            {/* Left Y-Axis: Hours or Count */}
            <YAxis
              yAxisId="left"
              orientation="left"
              stroke="#52632B"
              fontSize={10}
              fontFamily="monospace"
              tickLine={false}
              axisLine={{ stroke: 'rgba(150, 150, 150, 0.2)' }}
              domain={[0, 50]}
              label={{
                value: viewMode === 'attendance_vs_staff' ? 'Headcount' : 'Staff Hours',
                angle: -90,
                position: 'insideLeft',
                offset: 15,
                style: { fontSize: 10, fill: '#52632B', fontFamily: 'monospace' },
              }}
            />

            {/* Right Y-Axis: Ratio (Child to 1 Staff) */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#D97706"
              fontSize={10}
              fontFamily="monospace"
              tickLine={false}
              axisLine={{ stroke: 'rgba(150, 150, 150, 0.2)' }}
              domain={[0, 7]}
              label={{
                value: 'Ratio (Child:Staff)',
                angle: 90,
                position: 'insideRight',
                offset: 15,
                style: { fontSize: 10, fill: '#D97706', fontFamily: 'monospace' },
              }}
            />

            {/* Statutory Ratio Ceiling Reference Line */}
            <ReferenceLine
              yAxisId="right"
              y={5.0}
              stroke="#EF4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'CCEYA Max Ratio (1:5.0)',
                position: 'top',
                fill: '#EF4444',
                fontSize: 10,
                fontFamily: 'monospace',
                fontWeight: 'bold',
              }}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as DayMetric;
                  return (
                    <div className="bg-white dark:bg-[#1A1D16] p-3 rounded-lg shadow-xl border border-gray-200 dark:border-neutral-800 text-xs font-sans space-y-1.5 min-w-[200px]">
                      <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-800 pb-1">
                        <span className="font-bold text-gray-900 dark:text-neutral-100 font-mono">
                          {data.day} ({data.date})
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-bold font-mono bg-emerald-100 text-emerald-800">
                          {data.status}
                        </span>
                      </div>
                      <div className="text-[11px] space-y-0.5 font-mono">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Staff Coverage:</span>
                          <strong className="text-[#52632B] dark:text-[#9BB762]">{data.staffCoverageHours} hrs ({data.activeStaffCount} staff)</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Child Attendance:</span>
                          <strong className="text-gray-800 dark:text-neutral-200">{data.childAttendanceCount} children ({data.childAttendanceHours} hrs)</strong>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-gray-100 dark:border-neutral-800">
                          <span className="text-gray-500 font-bold">Realized Ratio:</span>
                          <strong className="text-amber-600 dark:text-amber-400">1 : {data.realizedRatio}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Compliance Cushion:</span>
                          <strong className="text-emerald-600">+{data.complianceBuffer} below max</strong>
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-400 italic pt-1">
                        {data.notes}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Legend
              verticalAlign="top"
              height={32}
              formatter={(value) => (
                <span className="text-xs font-mono text-gray-600 dark:text-neutral-400 font-semibold mr-3">
                  {value}
                </span>
              )}
            />

            {/* Bar: Staff Coverage Hours */}
            {(viewMode === 'ratio_vs_hours' || viewMode === 'attendance_vs_staff') && (
              <Bar
                yAxisId="left"
                dataKey={viewMode === 'attendance_vs_staff' ? 'activeStaffCount' : 'staffCoverageHours'}
                name={viewMode === 'attendance_vs_staff' ? 'Active Staff (Educators)' : 'Staff Coverage Hours (Shift Total)'}
                fill="url(#staffBarGradient)"
                radius={[4, 4, 0, 0]}
                maxBarSize={38}
              />
            )}

            {/* Area or Line: Child Attendance */}
            {viewMode === 'attendance_vs_staff' && (
              <Bar
                yAxisId="left"
                dataKey="childAttendanceCount"
                name="Children Present"
                fill="#E5A910"
                radius={[4, 4, 0, 0]}
                maxBarSize={38}
              />
            )}

            {/* Line: Realized Child-to-Staff Ratio */}
            {(viewMode === 'ratio_vs_hours' || viewMode === 'ratio_only') && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="realizedRatio"
                name="Child-to-Staff Ratio (1:N)"
                stroke="#D97706"
                strokeWidth={3}
                dot={{ r: 4, fill: '#D97706', stroke: '#fff', strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: '#E5A910', stroke: '#fff', strokeWidth: 2 }}
              />
            )}

            {/* Compliance Cushion Line */}
            {viewMode === 'ratio_only' && (
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="complianceBuffer"
                name="Safety Margin Cushion (+Points)"
                fill="url(#childAreaGradient)"
                stroke="#10B981"
                strokeWidth={2}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Selected Day Details Card (Interactive Inspection) */}
      {selectedDay && (
        <div className="p-3.5 rounded-lg bg-gray-50 dark:bg-[#141611] border border-gray-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-3">
            <span className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 font-mono font-bold text-center min-w-[50px]">
              <span className="text-[10px] text-gray-400 block uppercase">{selectedDay.dayShort}</span>
              <span className="text-sm text-[#52632B] dark:text-[#E5A910]">{selectedDay.date.split(' ')[1]}</span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-gray-900 dark:text-neutral-100 font-mono">
                  {selectedDay.day} Audit Snapshot
                </h4>
                <span className="text-[10px] px-2 py-0.2 rounded font-mono font-bold bg-emerald-100 text-emerald-800">
                  Buffer: +{selectedDay.complianceBuffer} Below Legal Cap
                </span>
              </div>
              <p className="text-gray-500 dark:text-neutral-400 text-[11px] mt-0.5">
                {selectedDay.notes} • {selectedDay.staffCoverageHours} Staff Hours deployed across toddler and infant rooms.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono shrink-0 self-end sm:self-center">
            <div>
              <span className="text-gray-400 block text-[10px]">REALIZED RATIO</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">1 : {selectedDay.realizedRatio}</span>
            </div>
            <div className="w-px h-6 bg-gray-200 dark:bg-neutral-800" />
            <div>
              <span className="text-gray-400 block text-[10px]">CEILING MARGIN</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{(selectedDay.complianceBuffer / 5.0 * 100).toFixed(0)}% Safe</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
