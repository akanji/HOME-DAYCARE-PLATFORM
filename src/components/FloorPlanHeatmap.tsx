import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Eye,
  Layers,
  Filter,
  CheckCircle2,
  Clock,
  Plus,
  Info,
  Calendar,
  X,
  Camera,
  Compass,
  Flame,
  FileDown,
  TrendingUp,
} from 'lucide-react';
import { IncidentReport, SafetyTask } from '../types';
import {
  DAYCARE_FLOOR_ZONES,
  DaycarePhysicalZone,
  HISTORICAL_INCIDENTS_HEATMAP,
} from '../data/staffAndRoomsData';
import { generateIncidentReportPdf } from '../utils/incidentPdfGenerator';
import { useLanguage } from '../context/LanguageContext';

interface FloorPlanHeatmapProps {
  incidents: IncidentReport[];
  onAddSafetyTask?: (task: Omit<SafetyTask, 'id' | 'createdAt'>) => void;
  onNavigateTab?: (tab: string) => void;
}

export const FloorPlanHeatmap: React.FC<FloorPlanHeatmapProps> = ({
  incidents,
  onAddSafetyTask,
  onNavigateTab,
}) => {
  const { language, t } = useLanguage();
  const isFr = language === 'fr';

  // Filters
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [selectedDateRange, setSelectedDateRange] = useState<'all' | '30d' | '90d'>('all');
  const [historyScope, setHistoryScope] = useState<'all' | 'historical_only' | 'recent_only'>('all');
  const [showHeatGlow, setShowHeatGlow] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null);
  const [activeHoverZone, setActiveHoverZone] = useState<DaycarePhysicalZone | null>(null);
  const [taskCreatedToast, setTaskCreatedToast] = useState<string | null>(null);

  // Combine runtime incidents and HISTORICAL_INCIDENTS_HEATMAP (deduplicated by ID)
  const unifiedIncidents = useMemo(() => {
    const map = new Map<string, IncidentReport>();
    // Seed with all historical safety incidents
    HISTORICAL_INCIDENTS_HEATMAP.forEach((item) => {
      map.set(item.id, item);
    });
    // Add or override with live incident state
    incidents.forEach((item) => {
      map.set(item.id, item);
    });
    return Array.from(map.values());
  }, [incidents]);

  // Filtered incidents based on user selections
  const filteredIncidents = useMemo(() => {
    const historicalIds = new Set(HISTORICAL_INCIDENTS_HEATMAP.map((h) => h.id));

    return unifiedIncidents.filter((inc) => {
      if (historyScope === 'historical_only' && !historicalIds.has(inc.id)) return false;
      if (historyScope === 'recent_only' && historicalIds.has(inc.id)) return false;
      if (selectedType !== 'All' && inc.type !== selectedType) return false;
      if (selectedSeverity !== 'All' && inc.hazardSeverity !== selectedSeverity) return false;
      if (selectedDateRange === '30d') {
        const incidentDate = new Date(inc.date).getTime();
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        if (incidentDate < thirtyDaysAgo) return false;
      } else if (selectedDateRange === '90d') {
        const incidentDate = new Date(inc.date).getTime();
        const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
        if (incidentDate < ninetyDaysAgo) return false;
      }
      return true;
    });
  }, [unifiedIncidents, historyScope, selectedType, selectedSeverity, selectedDateRange]);

  // Aggregate incidents per physical zone to classify danger levels and past frequency
  const zoneDensity = useMemo(() => {
    const counts: Record<
      string,
      { total: number; injuries: number; nearMisses: number; historicalCount: number; incidents: IncidentReport[] }
    > = {};

    const historicalIds = new Set(HISTORICAL_INCIDENTS_HEATMAP.map((h) => h.id));

    DAYCARE_FLOOR_ZONES.forEach((zone) => {
      counts[zone.id] = { total: 0, injuries: 0, nearMisses: 0, historicalCount: 0, incidents: [] };
    });

    filteredIncidents.forEach((inc) => {
      let matchedZone = DAYCARE_FLOOR_ZONES.find((z) => z.id === inc.locationZone);
      if (!matchedZone && inc.floorX && inc.floorY) {
        matchedZone = DAYCARE_FLOOR_ZONES.find(
          (z) =>
            inc.floorX! >= z.x &&
            inc.floorX! <= z.x + z.width &&
            inc.floorY! >= z.y &&
            inc.floorY! <= z.y + z.height
        );
      }

      const zoneKey = matchedZone ? matchedZone.id : 'zone-playroom';
      if (!counts[zoneKey]) {
        counts[zoneKey] = { total: 0, injuries: 0, nearMisses: 0, historicalCount: 0, incidents: [] };
      }
      counts[zoneKey].total += 1;
      if (historicalIds.has(inc.id)) {
        counts[zoneKey].historicalCount += 1;
      }
      if (inc.type === 'Injury') counts[zoneKey].injuries += 1;
      if (inc.type === 'Near-miss') counts[zoneKey].nearMisses += 1;
      counts[zoneKey].incidents.push(inc);
    });

    return counts;
  }, [filteredIncidents]);

  // Danger zones ranked by incident frequency
  const rankedDangerZones = useMemo(() => {
    return DAYCARE_FLOOR_ZONES.map((zone) => {
      const stats = zoneDensity[zone.id] || {
        total: 0,
        injuries: 0,
        nearMisses: 0,
        historicalCount: 0,
        incidents: [],
      };
      let riskLevel: 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
      if (stats.total >= 3 || stats.injuries >= 2) {
        riskLevel = 'HIGH';
      } else if (stats.total >= 1) {
        riskLevel = 'MODERATE';
      }
      return {
        ...zone,
        stats,
        riskLevel,
      };
    }).sort((a, b) => b.stats.total - a.stats.total);
  }, [zoneDensity]);

  // Quick Action: Create Safety Task for a Danger Zone
  const handleCreateTaskForZone = (zone: DaycarePhysicalZone) => {
    if (onAddSafetyTask) {
      onAddSafetyTask({
        area: isFr ? zone.nameFr : zone.name,
        observation: `Targeted supervision required in ${isFr ? zone.nameFr : zone.name}: ${
          isFr ? zone.supervisionRecommendationFr : zone.supervisionRecommendation
        }`,
        priority: 'High',
        assignedTo: 'Lead RECE Educator',
        status: 'Open',
      });
      setTaskCreatedToast(
        isFr
          ? `Tâche d'inspection créée pour : ${zone.nameFr}`
          : `Targeted safety task deployed for: ${zone.name}`
      );
      setTimeout(() => setTaskCreatedToast(null), 3500);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {taskCreatedToast && (
        <div className="p-3 rounded-lg bg-emerald-600 text-white text-xs font-mono font-bold flex items-center justify-between shadow-lg animate-bounce">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{taskCreatedToast}</span>
          </div>
          <button onClick={() => setTaskCreatedToast(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Controls Bar */}
      <div className="bg-white dark:bg-[#181a15] rounded-xl border border-gray-200 dark:border-neutral-800 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                <Compass className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-neutral-100 font-display">
                  {t('heatmap.title')}
                </h2>
                <p className="text-xs text-gray-500 dark:text-neutral-400">
                  {t('heatmap.subtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-right">
              <span className="text-[10px] font-mono uppercase font-bold text-rose-700 dark:text-rose-300 block">
                {t('heatmap.dangerZonesIdentified')}
              </span>
              <span className="text-base font-black font-mono text-rose-900 dark:text-rose-200">
                {rankedDangerZones.filter((z) => z.riskLevel === 'HIGH').length} High-Risk Areas
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-[#141611] border border-gray-200 dark:border-neutral-800 text-right">
              <span className="text-[10px] font-mono uppercase font-bold text-gray-500 block">
                Total Plotted Incidents
              </span>
              <span className="text-base font-black font-mono text-[#52632B] dark:text-[#9BB762]">
                {filteredIncidents.length} Records
              </span>
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Incident Type Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-gray-400 uppercase">Type:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="text-xs font-mono bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded px-2.5 py-1 text-gray-700 dark:text-neutral-300"
              >
                <option value="All">All Incident Types</option>
                <option value="Injury">Injuries (Scrapes / Bumps)</option>
                <option value="Near-miss">Near-Miss Hazards</option>
                <option value="Illness">Health / Fever</option>
                <option value="Behavioral">Behavioral Redirections</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-gray-400 uppercase">Severity:</span>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="text-xs font-mono bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded px-2.5 py-1 text-gray-700 dark:text-neutral-300"
              >
                <option value="All">All Severities</option>
                <option value="Critical">Critical (Immediate Care)</option>
                <option value="High">High Severity</option>
                <option value="Medium">Medium Severity</option>
                <option value="Low">Low / Minor</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-gray-400 uppercase">Period:</span>
              <div className="flex rounded border border-gray-200 dark:border-neutral-700 overflow-hidden font-mono text-[11px]">
                <button
                  onClick={() => setSelectedDateRange('all')}
                  className={`px-2 py-1 ${selectedDateRange === 'all' ? 'bg-[#52632B] text-white font-bold' : 'bg-white dark:bg-neutral-900 text-gray-600'}`}
                >
                  All 2026
                </button>
                <button
                  onClick={() => setSelectedDateRange('90d')}
                  className={`px-2 py-1 ${selectedDateRange === '90d' ? 'bg-[#52632B] text-white font-bold' : 'bg-white dark:bg-neutral-900 text-gray-600'}`}
                >
                  90 Days
                </button>
                <button
                  onClick={() => setSelectedDateRange('30d')}
                  className={`px-2 py-1 ${selectedDateRange === '30d' ? 'bg-[#52632B] text-white font-bold' : 'bg-white dark:bg-neutral-900 text-gray-600'}`}
                >
                  30 Days
                </button>
              </div>
            </div>

            {/* Historical Data Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-gray-400 uppercase">Source:</span>
              <div className="flex rounded border border-gray-200 dark:border-neutral-700 overflow-hidden font-mono text-[11px]">
                <button
                  onClick={() => setHistoryScope('all')}
                  className={`px-2 py-1 ${historyScope === 'all' ? 'bg-[#52632B] text-white font-bold' : 'bg-white dark:bg-neutral-900 text-gray-600'}`}
                >
                  All Hotspots
                </button>
                <button
                  onClick={() => setHistoryScope('historical_only')}
                  className={`px-2 py-1 ${historyScope === 'historical_only' ? 'bg-amber-600 text-white font-bold' : 'bg-white dark:bg-neutral-900 text-gray-600'}`}
                  title="Filter to past safety incident coordinates from HISTORICAL_INCIDENTS_HEATMAP"
                >
                  Past Incidents Archive
                </button>
              </div>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="flex items-center gap-4 text-xs font-mono text-gray-600 dark:text-neutral-400">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showHeatGlow}
                onChange={(e) => setShowHeatGlow(e.target.checked)}
                className="rounded text-[#52632B] focus:ring-[#52632B]"
              />
              <span>Heatmap Glow</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                className="rounded text-[#52632B] focus:ring-[#52632B]"
              />
              <span>Room Labels</span>
            </label>
          </div>
        </div>

        {/* High Frequency Past Incidents Callout Banner */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-neutral-800">
          <div className="p-3 rounded-lg bg-linear-to-r from-rose-50 via-amber-50 to-orange-50 dark:from-rose-950/40 dark:via-amber-950/30 dark:to-orange-950/20 border border-rose-200 dark:border-rose-900/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start md:items-center gap-2.5">
              <span className="p-1.5 rounded-md bg-rose-600 text-white shrink-0 mt-0.5 md:mt-0">
                <Flame className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-rose-950 dark:text-rose-200 uppercase tracking-tight">
                    Highest Frequency Past Safety Incident Areas (Historical Heatmap Archive)
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200">
                    HISTORICAL_INCIDENTS_HEATMAP ACTIVE
                  </span>
                </div>
                <p className="text-[11px] text-rose-800 dark:text-rose-300 mt-0.5">
                  Identified top historical incident concentrations: <strong>Art & Sensory Water Basin</strong> (3 past slips), <strong>Outdoor Soft Turf Yard</strong> (3 past scrapes & trips), and <strong>Transition Hallway</strong> (2 past door pinch incidents).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-white/80 dark:bg-neutral-900/80 px-2 py-1 rounded border border-rose-200 dark:border-rose-800">
                Top Zone: {rankedDangerZones[0]?.name || 'Art & Sensory'} ({rankedDangerZones[0]?.stats.total || 3}x)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Floor Plan Stage (SVG Heatmap Canvas) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 8 Cols: Architectural SVG Layout */}
        <div className="lg:col-span-8 bg-white dark:bg-[#181a15] rounded-xl border border-gray-200 dark:border-neutral-800 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#52632B] dark:text-[#9BB762]" />
              <h3 className="text-xs font-bold text-gray-900 dark:text-neutral-100 font-mono uppercase">
                Daycare Architectural Facility Blueprint (Scale 1:50)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-gray-400">
              Interactive Hotspot Pins: Click to inspect incident
            </span>
          </div>

          {/* SVG Floor Plan Canvas Container */}
          <div className="relative w-full aspect-16/10 bg-gray-950 rounded-lg overflow-hidden border border-gray-800 shadow-inner">
            <svg
              viewBox="0 0 960 460"
              className="w-full h-full select-none"
              style={{ background: '#0a0d08' }}
            >
              <defs>
                {/* Radial Gradient for Thermal Hotspot Glow */}
                <radialGradient id="heat-critical" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                  <stop offset="40%" stopColor="#f97316" stopOpacity="0.5" />
                  <stop offset="80%" stopColor="#eab308" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="heat-high" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.75" />
                  <stop offset="50%" stopColor="#eab308" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="heat-medium" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#eab308" stopOpacity="0.6" />
                  <stop offset="60%" stopColor="#84cc16" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#84cc16" stopOpacity="0" />
                </radialGradient>

                {/* Blueprint grid pattern */}
                <pattern id="blueprint-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1f291e" strokeWidth="0.5" />
                </pattern>
              </defs>

              {/* Grid Background */}
              <rect width="960" height="460" fill="url(#blueprint-grid)" />

              {/* Render Physical Daycare Rooms */}
              {DAYCARE_FLOOR_ZONES.map((zone) => {
                const stats = zoneDensity[zone.id] || { total: 0, injuries: 0 };
                const isHovered = activeHoverZone?.id === zone.id;
                const isHighRisk = stats.total >= 3 || stats.injuries >= 2;

                return (
                  <g
                    key={zone.id}
                    onMouseEnter={() => setActiveHoverZone(zone)}
                    onMouseLeave={() => setActiveHoverZone(null)}
                    className="cursor-pointer transition-all"
                  >
                    {/* Room Floor Rectangle */}
                    <rect
                      x={zone.x}
                      y={zone.y}
                      width={zone.width}
                      height={zone.height}
                      rx="8"
                      fill={
                        isHighRisk
                          ? 'rgba(239, 68, 68, 0.12)'
                          : stats.total > 0
                          ? 'rgba(234, 179, 8, 0.08)'
                          : 'rgba(34, 197, 94, 0.04)'
                      }
                      stroke={
                        isHighRisk
                          ? '#ef4444'
                          : isHovered
                          ? '#52632B'
                          : 'rgba(255, 255, 255, 0.15)'
                      }
                      strokeWidth={isHighRisk ? '2' : isHovered ? '2' : '1'}
                      strokeDasharray={isHighRisk ? '4 2' : 'none'}
                    />

                    {/* Room Labels */}
                    {showLabels && (
                      <g>
                        <text
                          x={zone.x + 12}
                          y={zone.y + 22}
                          fill="#f1f5f9"
                          fontSize="11"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {isFr ? zone.nameFr : zone.name}
                        </text>
                        <text
                          x={zone.x + 12}
                          y={zone.y + 36}
                          fill="#94a3b8"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {zone.cceyaCode} • {stats.total} {stats.total === 1 ? 'incident' : 'incidents'}
                        </text>

                        {/* Highest Frequency of Past Safety Incidents Badge */}
                        {stats.total >= 3 && (
                          <g>
                            <rect
                              x={zone.x + 12}
                              y={zone.y + 42}
                              width={195}
                              height={13}
                              rx="3"
                              fill="#ef4444"
                              opacity="0.9"
                            />
                            <text
                              x={zone.x + 16}
                              y={zone.y + 51.5}
                              fill="#ffffff"
                              fontSize="7.5"
                              fontFamily="monospace"
                              fontWeight="bold"
                            >
                              🔥 HIGHEST PAST FREQUENCY ({stats.total}x)
                            </text>
                          </g>
                        )}
                      </g>
                    )}

                    {/* Danger Zone Pulsing Beacon Badge if High Risk */}
                    {isHighRisk && (
                      <g transform={`translate(${zone.x + zone.width - 28}, ${zone.y + 12})`}>
                        <circle cx="8" cy="8" r="8" fill="#ef4444" opacity="0.3" className="animate-ping" />
                        <circle cx="8" cy="8" r="6" fill="#ef4444" />
                        <text
                          x="8"
                          y="11"
                          fill="white"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="sans-serif"
                        >
                          !
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Thermal Heatmap Glow Clouds around incident coordinates */}
              {showHeatGlow &&
                filteredIncidents.map((inc) => {
                  if (!inc.floorX || !inc.floorY) return null;
                  const rad = inc.hazardSeverity === 'Critical' ? 65 : inc.hazardSeverity === 'High' ? 50 : 35;
                  const grad =
                    inc.hazardSeverity === 'Critical'
                      ? 'url(#heat-critical)'
                      : inc.hazardSeverity === 'High'
                      ? 'url(#heat-high)'
                      : 'url(#heat-medium)';

                  return (
                    <circle
                      key={`glow-${inc.id}`}
                      cx={inc.floorX}
                      cy={inc.floorY}
                      r={rad}
                      fill={grad}
                      pointerEvents="none"
                    />
                  );
                })}

              {/* Plotted Incident Hotspot Interactive Pins */}
              {filteredIncidents.map((inc) => {
                if (!inc.floorX || !inc.floorY) return null;
                const isSelected = selectedIncident?.id === inc.id;
                const isCritical = inc.hazardSeverity === 'Critical' || inc.hazardSeverity === 'High';

                return (
                  <g
                    key={`pin-${inc.id}`}
                    transform={`translate(${inc.floorX}, ${inc.floorY})`}
                    onClick={() => setSelectedIncident(inc)}
                    className="cursor-pointer group"
                  >
                    {/* Radar wave for critical incidents */}
                    {isCritical && (
                      <circle cx="0" cy="0" r="14" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.6">
                        <animate attributeName="r" values="6;18;6" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}

                    {/* Pin Circle */}
                    <circle
                      cx="0"
                      cy="0"
                      r={isSelected ? '8' : '6'}
                      fill={
                        inc.hazardSeverity === 'Critical'
                          ? '#ef4444'
                          : inc.hazardSeverity === 'High'
                          ? '#f97316'
                          : inc.hazardSeverity === 'Medium'
                          ? '#eab308'
                          : '#3b82f6'
                      }
                      stroke="#ffffff"
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                      className="transition-transform group-hover:scale-125"
                    />

                    {/* Hover text label */}
                    <text
                      x="0"
                      y="-10"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                      className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none drop-shadow-md"
                    >
                      {inc.childName}: {inc.type}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Heatmap Density Legend */}
          <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-gray-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-700 dark:text-neutral-300">{t('heatmap.legend')}:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span>{t('heatmap.zeroIncidents')}</span>
              </div>
              <div className="flex items-center gap-1.5 ml-2">
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span>{t('heatmap.oneIncident')}</span>
              </div>
              <div className="flex items-center gap-1.5 ml-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span>{t('heatmap.multipleIncidents')}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-400">
                Ontario CCEYA Environmental Audit Active
              </span>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Danger Zone Ranking & Supervision Recommendations */}
        <div className="lg:col-span-4 space-y-4">
          {/* Top Danger Zones Ranking Card */}
          <div className="bg-white dark:bg-[#181a15] rounded-xl border border-gray-200 dark:border-neutral-800 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-neutral-800">
              <h3 className="text-xs font-bold text-[#52632B] dark:text-[#E5A910] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Physical Danger Zone Priority</span>
              </h3>
              <span className="text-[10px] font-mono text-gray-400">Ranked by Risk</span>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {rankedDangerZones.map((zone, idx) => (
                <div
                  key={zone.id}
                  className={`p-3 rounded-lg border text-xs transition-all ${
                    zone.riskLevel === 'HIGH'
                      ? 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20'
                      : zone.riskLevel === 'MODERATE'
                      ? 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10'
                      : 'border-gray-200 dark:border-neutral-800 bg-gray-50/30 dark:bg-[#141611]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-[10px] text-gray-400">#{idx + 1}</span>
                      <span className="font-bold text-gray-900 dark:text-neutral-100">
                        {isFr ? zone.nameFr : zone.name}
                      </span>
                    </div>

                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                        zone.riskLevel === 'HIGH'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          : zone.riskLevel === 'MODERATE'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {zone.riskLevel === 'HIGH' ? 'Danger Zone' : zone.riskLevel === 'MODERATE' ? 'Monitored' : 'Safe Area'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] font-mono text-gray-500 mb-2">
                    <span>Total Incidents: <strong className="text-gray-900 dark:text-neutral-100">{zone.stats.total}</strong></span>
                    <span>•</span>
                    <span>Injuries: <strong className="text-rose-600">{zone.stats.injuries}</strong></span>
                    <span>•</span>
                    <span>Near-Misses: <strong className="text-amber-600">{zone.stats.nearMisses}</strong></span>
                  </div>

                  <p className="text-[11px] text-gray-600 dark:text-neutral-400 mb-2 leading-relaxed">
                    <strong className="text-[#52632B] dark:text-[#9BB762] block mb-0.5">
                      {t('heatmap.supervisionRecommendation')}:
                    </strong>
                    {isFr ? zone.supervisionRecommendationFr : zone.supervisionRecommendation}
                  </p>

                  <div className="flex items-center gap-2 pt-1 border-t border-gray-200/50 dark:border-neutral-800">
                    <button
                      onClick={() => handleCreateTaskForZone(zone)}
                      className="flex-1 py-1 px-2 rounded text-[10px] font-mono font-bold bg-[#52632B] hover:bg-[#3E4C1E] text-white transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{t('heatmap.createTaskForZone')}</span>
                    </button>

                    {onNavigateTab && (
                      <button
                        onClick={() => onNavigateTab('vision')}
                        title="Focus computer vision stream on this physical area"
                        className="py-1 px-2 rounded text-[10px] font-mono font-bold bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 text-gray-700 dark:text-neutral-300 transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Camera className="w-3 h-3 text-[#52632B]" />
                        <span>CV Focus</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: INCIDENT DETAIL INSPECTION WHEN PIN IS CLICKED */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#181a15] rounded-xl border border-gray-200 dark:border-neutral-800 max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-neutral-100 font-display">
                    Incident Report #{selectedIncident.id}
                  </h3>
                  <p className="text-[10px] font-mono text-gray-400">
                    {selectedIncident.date} at {selectedIncident.time} • Plotted on Heatmap
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px] p-2.5 rounded bg-gray-50 dark:bg-[#12140f] border border-gray-200 dark:border-neutral-800">
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase">Child Involved:</span>
                  <span className="font-bold text-gray-900 dark:text-neutral-100">{selectedIncident.childName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase">Incident Type:</span>
                  <span className="font-bold text-rose-700 dark:text-rose-400">{selectedIncident.type}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase">Hazard Area:</span>
                  <span className="font-bold text-gray-900 dark:text-neutral-100">{selectedIncident.hazardArea}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase">Severity Level:</span>
                  <span className="font-bold uppercase text-amber-700 dark:text-amber-400">{selectedIncident.hazardSeverity || 'Medium'}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-gray-700 dark:text-neutral-300 block mb-1">
                  Incident Description & Narrative:
                </span>
                <p className="p-2.5 rounded bg-white dark:bg-[#141611] border border-gray-200 dark:border-neutral-800 text-gray-800 dark:text-neutral-200 leading-relaxed">
                  {selectedIncident.description}
                </p>
              </div>

              <div>
                <span className="font-bold text-gray-700 dark:text-neutral-300 block mb-1">
                  First Aid & Remedial Action Administered:
                </span>
                <p className="p-2.5 rounded bg-white dark:bg-[#141611] border border-gray-200 dark:border-neutral-800 text-gray-800 dark:text-neutral-200 leading-relaxed">
                  {selectedIncident.firstAidAdministered}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-gray-500 pt-1">
                <span>Parent Notified: {selectedIncident.parentNotified ? `Yes (${selectedIncident.parentNotificationTime})` : 'Pending'}</span>
                <span>Staff Signatures: {selectedIncident.staffSignatures.join(', ')}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-neutral-800">
              <button
                id={`download-pdf-modal-${selectedIncident.id}`}
                onClick={() => generateIncidentReportPdf(selectedIncident)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-neutral-100 dark:bg-neutral-800 hover:bg-[#52632B] hover:text-white text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Generate and download formal printable CCEYA regulatory audit PDF"
              >
                <FileDown className="w-3.5 h-3.5 text-[#52632B]" />
                <span>Download Regulatory Audit PDF</span>
              </button>

              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#52632B] text-white hover:bg-[#3E4C1E] cursor-pointer transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
