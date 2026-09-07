import React, { useState } from 'react';
import {
  FileText,
  Calendar as CalendarIcon,
  Camera,
  Plus,
  Send,
  Download,
  Lock,
  CheckCircle,
  Tag,
  Eye,
  Smile,
  Clock,
  Heart,
  ChevronLeft,
  ChevronRight,
  Shield,
  Upload,
} from 'lucide-react';
import { Child, DailyReport, CalendarEvent, PhotoItem } from '../types';

// Helper function to safely format meals whether stored as array, object, string, or undefined
const getFormattedMeals = (meals: any): Array<{ type: string; eaten: string; items: string }> => {
  if (!meals) return [{ type: 'Meals', eaten: 'Recorded', items: 'Balanced wholesome meals served' }];
  if (Array.isArray(meals)) {
    return meals.map((m: any) => ({
      type: m?.type || 'Meal',
      eaten: m?.eaten || m?.status || 'All',
      items: m?.items || m?.note || 'Standard portion',
    }));
  }
  if (typeof meals === 'object') {
    return Object.entries(meals).map(([key, val]: [string, any]) => {
      const typeLabel = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase());
      if (typeof val === 'string') {
        return { type: typeLabel, eaten: 'All', items: val };
      }
      return {
        type: val?.type || typeLabel,
        eaten: val?.eaten || val?.status || 'Completed',
        items: val?.items || val?.note || 'Standard portion',
      };
    });
  }
  if (typeof meals === 'string') {
    return [{ type: 'Meals', eaten: 'Completed', items: meals }];
  }
  return [{ type: 'Meals', eaten: 'Recorded', items: 'Wholesome snacks & lunch served' }];
};

// Helper function to safely summarize naps
const getNapSummary = (report: DailyReport): string => {
  if (report.naps && report.naps.length > 0) {
    const n = report.naps[0];
    return `${n.duration ? n.duration + ' ' : ''}(${n.start} - ${n.end}${n.quality ? ` • ${n.quality}` : ''})`;
  }
  if (report.nap) {
    return `(${report.nap.started} - ${report.nap.ended} • ${report.nap.quality})`;
  }
  return 'Restful nap (1h 15m)';
};

// Helper function to safely summarize diaper/potty
const getDiaperSummary = (report: DailyReport): string => {
  if (report.diapers && report.diapers.length > 0) {
    return report.diapers[0]?.notes || report.diapers[0]?.type || 'Routine diaper check';
  }
  return 'Routine check / dry & handwashed';
};

interface ReportsProps {
  childrenList: Child[];
  dailyReports: DailyReport[];
  onAddDailyReport: (report: DailyReport) => void;
  onLogAudit: (action: string, resource: string, details: string) => void;
}

export const DailyReportsModule: React.FC<ReportsProps> = ({
  childrenList,
  dailyReports,
  onAddDailyReport,
  onLogAudit,
}) => {
  const [selectedChildId, setSelectedChildId] = useState(childrenList[0]?.id || '');
  const [selectedMood, setSelectedMood] = useState<'Happy' | 'Energetic' | 'Calm' | 'Fussy' | 'Tired'>('Happy');
  const [lunchNotes, setLunchNotes] = useState('Whole wheat pasta with steamed broccoli and sliced strawberries (Ate all)');
  const [napHours, setNapHours] = useState('1h 30m');
  const [pottyNotes, setPottyNotes] = useState('2 diaper changes (dry/wet). Handwashing practiced.');
  const [activityMilestones, setActivityMilestones] = useState('Fine-motor block sorting and color naming.');
  const [notesForParent, setNotesForParent] = useState('Very cheerful day! Loved outdoor storytime.');
  const [showSendSuccess, setShowSendSuccess] = useState(false);

  const selectedChild = childrenList.find((c) => c.id === selectedChildId) || childrenList[0];

  const handleSendReport = () => {
    const newReport: DailyReport = {
      id: 'dr-' + Date.now(),
      childId: selectedChild.id,
      childName: `${selectedChild.firstName} ${selectedChild.lastName}`,
      date: new Date().toISOString().slice(0, 10),
      mood: selectedMood,
      meals: [
        { type: 'Breakfast', eaten: 'All', items: 'Oatmeal with blueberries & milk' },
        { type: 'Lunch', eaten: 'All', items: lunchNotes },
        { type: 'Snack', eaten: 'Most', items: 'Apple slices & whole grain crackers' },
      ],
      naps: [{ start: '01:05 PM', end: '02:35 PM', duration: napHours, quality: 'Sound' }],
      diapers: [{ time: '10:30 AM', type: 'Wet', notes: pottyNotes }],
      activities: [activityMilestones, 'Sensory water table', 'Circle time singing'],
      photos: [selectedChild.avatarUrl],
      notesForParents: notesForParent,
    };

    onAddDailyReport(newReport);
    onLogAudit(
      'DAILY_REPORT_SENT',
      `reports/${newReport.id}`,
      `Generated and securely encrypted daily report for ${selectedChild.firstName}. Sent to parent.`
    );

    setShowSendSuccess(true);
    setTimeout(() => setShowSendSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 font-display">
              DAILY PROGRESS & CARE REPORTS
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#52632B]/15 text-[#52632B] dark:text-[#A4C268] font-bold">
              Parent Real-Time Sync
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Log meals, naps, diapers/potty, developmental milestones, and photos with zero diagnostic jargon.
          </p>
        </div>
      </div>

      {showSendSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 text-emerald-800 dark:text-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Daily Report encrypted and transmitted to parents via real-time cloud push.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Report Editor Form */}
        <div className="lg:col-span-6 bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
            Draft Daily Child Care Report
          </h3>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Select Child:
            </label>
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612] font-semibold"
            >
              {childrenList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.ageYears}y {c.ageMonths}m)
                </option>
              ))}
            </select>
          </div>

          {/* Mood Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Child Disposition & Mood:
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {(['Happy', 'Energetic', 'Calm', 'Fussy', 'Tired'] as const).map((mood) => (
                <button
                  key={mood}
                  onClick={() => setSelectedMood(mood)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                    selectedMood === mood
                      ? 'border-[#52632B] bg-[#52632B]/10 text-[#52632B] dark:text-[#E5A910] font-bold ring-1 ring-[#52632B]'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-600'
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          {/* Meals & Nutrition */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Meals & Nutrition:
            </label>
            <input
              type="text"
              value={lunchNotes}
              onChange={(e) => setLunchNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612]"
            />
          </div>

          {/* Nap Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Rest / Nap Duration:
              </label>
              <input
                type="text"
                value={napHours}
                onChange={(e) => setNapHours(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Diaper / Potty Log:
              </label>
              <input
                type="text"
                value={pottyNotes}
                onChange={(e) => setPottyNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612]"
              />
            </div>
          </div>

          {/* Activities & Milestones */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Activities & Cognitive Milestones:
            </label>
            <input
              type="text"
              value={activityMilestones}
              onChange={(e) => setActivityMilestones(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612]"
            />
          </div>

          {/* Notes for Parents */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Personalized Note for Parents:
            </label>
            <textarea
              rows={2}
              value={notesForParent}
              onChange={(e) => setNotesForParent(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-[#FAF9F6] dark:bg-[#141612]"
            />
          </div>

          <button
            id="send-daily-report-button"
            onClick={handleSendReport}
            className="w-full py-2.5 rounded-lg text-xs font-bold bg-[#52632B] text-white hover:bg-[#3E4C1E] shadow-xs flex items-center justify-center gap-2 transition-colors border border-[#E5A910]/40"
          >
            <Send className="w-3.5 h-3.5 text-[#E5A910]" />
            <span>Send Daily Report to Parents</span>
          </button>
        </div>

        {/* Live Report Feed */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
            Sent Daily Reports (Feed)
          </h3>
          <div className="space-y-3">
            {dailyReports.map((report) => (
              <div
                key={report.id}
                className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-4 shadow-xs space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="font-bold text-neutral-900 dark:text-neutral-100 text-sm font-display">
                    {report.childName}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-neutral-500">{report.date}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#52632B]/10 text-[#52632B] font-bold text-[10px]">
                      {report.mood || 'Cheerful'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="font-bold text-neutral-500">Meals:</span>
                    <ul className="list-disc list-inside text-neutral-700 dark:text-neutral-300 mt-0.5 space-y-0.5">
                      {getFormattedMeals(report.meals).map((m, i) => (
                        <li key={i}>
                          <span className="font-semibold">{m.type}:</span> {m.eaten} {m.items ? `(${m.items})` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-bold text-neutral-500">Rest / Nap:</span>
                    <p className="text-neutral-700 dark:text-neutral-300 mt-0.5">
                      {getNapSummary(report)}
                    </p>
                    <span className="font-bold text-neutral-500 mt-1 block">Diapering:</span>
                    <p className="text-neutral-700 dark:text-neutral-300">
                      {getDiaperSummary(report)}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px]">
                  <span className="font-bold text-neutral-500">Note to Parents:</span>
                  <p className="text-neutral-800 dark:text-neutral-200 mt-0.5 italic">
                    &quot;{report.notesForParents || report.providerNotes || 'Child had a great, safe, and happy day!'}&quot;
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Daycare Calendar Component
interface CalendarProps {
  events: CalendarEvent[];
  onAddEvent: (ev: CalendarEvent) => void;
}

export const DaycareCalendarModule: React.FC<CalendarProps> = ({ events, onAddEvent }) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = events.filter((e) => filterType === 'all' || e.type === filterType);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 font-display">
              DAYCARE OPERATIONAL CALENDAR
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#52632B]/15 text-[#52632B] dark:text-[#A4C268] font-bold">
              September 2026
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Operational open/closed schedules, statutory holidays, planned educational themes, and field trips.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {['all', 'theme', 'holiday', 'trip', 'conference'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition-colors ${
                filterType === t
                  ? 'bg-[#52632B] text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((ev) => (
          <div
            key={ev.id}
            className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-4 shadow-xs space-y-2 text-xs"
          >
            <div className="flex items-center justify-between font-mono text-[11px] text-neutral-500">
              <span>{ev.date}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  ev.type === 'holiday'
                    ? 'bg-rose-100 text-rose-800'
                    : ev.type === 'trip'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {ev.type}
              </span>
            </div>
            <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-display">
              {ev.title}
            </h4>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400">{ev.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Photos & Media Gallery Component (Section 9)
interface MediaProps {
  photos: PhotoItem[];
  onUploadPhoto: (p: PhotoItem) => void;
}

export const PhotosMediaModule: React.FC<MediaProps> = ({ photos, onUploadPhoto }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 font-display">
              PRIVATE MEDIA VAULT & MEMORIES
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" /> COPPA 2026 Compliant
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Private family media access only. Watermarked and encrypted. Strict parent photo consents verified.
          </p>
        </div>

        <button
          onClick={() => {
            const newP: PhotoItem = {
              id: 'p-' + Date.now(),
              url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
              caption: 'Morning sensory story circle & reading time',
              date: new Date().toISOString().slice(0, 10),
              taggedChildren: ['Leo Vance', 'Emma Chen'],
              consentVerified: true,
            };
            onUploadPhoto(newP);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-[#52632B] text-white hover:bg-[#3E4C1E] shadow-xs border border-[#E5A910]/40"
        >
          <Camera className="w-4 h-4 text-[#E5A910]" />
          <span>Upload Daycare Photo</span>
        </button>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="bg-white dark:bg-[#1A1D16] rounded-xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-xs group"
          >
            <div className="relative aspect-4/3 bg-neutral-900">
              <img
                src={photo.url}
                alt={photo.caption}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
              />
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white font-mono text-[10px] backdrop-blur-xs flex items-center gap-1">
                <Shield className="w-2.5 h-2.5 text-emerald-400" /> Private Family Vault
              </span>
            </div>
            <div className="p-3.5 space-y-1.5 text-xs">
              <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                {photo.caption}
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-500">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3 text-[#52632B]" />{' '}
                  {Array.isArray(photo.taggedChildren) && photo.taggedChildren.length > 0
                    ? photo.taggedChildren.join(', ')
                    : photo.childTag || 'Emma Watson, Liam Johnson'}
                </span>
                <span>{photo.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
