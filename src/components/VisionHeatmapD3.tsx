import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Activity,
  AlertTriangle,
  Flame,
  Clock,
  Filter,
  Layers,
  MapPin,
  ShieldCheck,
  Sparkles,
  Info,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { CVHazardLog, DAYCARE_AREAS, TIME_SLOTS, INITIAL_CV_HAZARD_LOGS } from '../data/cvHazardLogs';

export interface MatrixCell {
  area: string;
  timeSlot: string;
  count: number;
  highCount: number;
  medCount: number;
  lowCount: number;
  dominantHazard: string;
  avgConfidence: number;
  logs: CVHazardLog[];
}

interface VisionHeatmapD3Props {
  additionalLogs?: CVHazardLog[];
  onSelectArea?: (area: string) => void;
}

export const VisionHeatmapD3: React.FC<VisionHeatmapD3Props> = ({
  additionalLogs = [],
  onSelectArea,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Filter states
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'high' | 'medium_high'>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<'all' | 'today' | 'recent'>('all');
  const [hoveredCell, setHoveredCell] = useState<{
    area: string;
    timeSlot: string;
    count: number;
    highCount: number;
    medCount: number;
    lowCount: number;
    dominantHazard: string;
    avgConfidence: number;
    x: number;
    y: number;
  } | null>(null);

  const [selectedCellLogs, setSelectedCellLogs] = useState<{
    area: string;
    timeSlot: string;
    logs: CVHazardLog[];
  } | null>(null);

  // Combine static and dynamically added logs
  const allLogs = useMemo(() => {
    return [...additionalLogs, ...INITIAL_CV_HAZARD_LOGS];
  }, [additionalLogs]);

  // Apply filters
  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      // Date filter
      if (selectedDateFilter === 'today' && log.date !== '2026-09-04') return false;
      if (selectedDateFilter === 'recent' && log.date < '2026-09-03') return false;

      // Severity filter
      if (selectedSeverity === 'high' && log.severity !== 'high') return false;
      if (selectedSeverity === 'medium_high' && log.severity === 'low') return false;

      return true;
    });
  }, [allLogs, selectedSeverity, selectedDateFilter]);

  // Compute 2D matrix of counts: area x timeSlot
  const matrixData = useMemo(() => {
    const areas = Array.from(DAYCARE_AREAS);
    const timeSlots = Array.from(TIME_SLOTS);

    const cells: Array<{
      area: string;
      timeSlot: string;
      count: number;
      highCount: number;
      medCount: number;
      lowCount: number;
      dominantHazard: string;
      avgConfidence: number;
      logs: CVHazardLog[];
    }> = [];

    areas.forEach((area) => {
      timeSlots.forEach((slot) => {
        const matchingLogs = filteredLogs.filter(
          (l) => l.area === area && l.timeSlot === slot
        );

        const count = matchingLogs.length;
        const highCount = matchingLogs.filter((l) => l.severity === 'high').length;
        const medCount = matchingLogs.filter((l) => l.severity === 'medium').length;
        const lowCount = matchingLogs.filter((l) => l.severity === 'low').length;

        // Find dominant hazard
        const typeCounts: Record<string, number> = {};
        matchingLogs.forEach((l) => {
          typeCounts[l.hazardType] = (typeCounts[l.hazardType] || 0) + 1;
        });
        let dominantHazard = 'None';
        let maxC = 0;
        Object.entries(typeCounts).forEach(([t, c]) => {
          if (c > maxC) {
            maxC = c;
            dominantHazard = t;
          }
        });

        const avgConfidence =
          count > 0
            ? matchingLogs.reduce((acc, l) => acc + l.confidence, 0) / count
            : 0;

        cells.push({
          area,
          timeSlot: slot,
          count,
          highCount,
          medCount,
          lowCount,
          dominantHazard,
          avgConfidence,
          logs: matchingLogs,
        });
      });
    });

    return cells;
  }, [filteredLogs]);

  // Overall analytics
  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const high = filteredLogs.filter((l) => l.severity === 'high').length;

    // Highest risk area
    const areaCounts: Record<string, number> = {};
    filteredLogs.forEach((l) => {
      areaCounts[l.area] = (areaCounts[l.area] || 0) + 1;
    });
    let topArea = 'Playroom Central Walkway';
    let maxAreaC = 0;
    Object.entries(areaCounts).forEach(([a, c]) => {
      if (c > maxAreaC) {
        maxAreaC = c;
        topArea = a;
      }
    });

    // Peak time window
    const timeCounts: Record<string, number> = {};
    filteredLogs.forEach((l) => {
      timeCounts[l.timeSlot] = (timeCounts[l.timeSlot] || 0) + 1;
    });
    let peakTime = '09:30 - 11:30 (Morning Play)';
    let maxTimeC = 0;
    Object.entries(timeCounts).forEach(([t, c]) => {
      if (c > maxTimeC) {
        maxTimeC = c;
        peakTime = t;
      }
    });

    return { total, high, topArea, maxAreaC, peakTime };
  }, [filteredLogs]);

  // D3 Rendering Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 760;
    const margin = { top: 40, right: 30, bottom: 65, left: 190 };
    const width = Math.max(680, containerWidth) - margin.left - margin.right;
    const height = 310 - margin.top - margin.bottom;

    svg
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr('width', '100%')
      .attr('height', '100%');

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const areas = Array.from(DAYCARE_AREAS);
    const timeSlots = Array.from(TIME_SLOTS);

    // X scale (Time Slots)
    const xScale = d3
      .scaleBand()
      .domain(timeSlots)
      .range([0, width])
      .padding(0.08);

    // Y scale (Daycare Areas)
    const yScale = d3
      .scaleBand()
      .domain(areas)
      .range([0, height])
      .padding(0.1);

    // Color scale for frequency heatmap: White/Light Gold -> Rich Golden Yellow -> Olive Green -> Deep Forest Olive
    const maxCountVal = d3.max(matrixData, (d: MatrixCell) => d.count);
    const maxCount = Math.max(1, typeof maxCountVal === 'number' ? maxCountVal : 1);
    const colorScale = d3
      .scaleLinear<string>()
      .domain([0, Math.max(1, maxCount * 0.25), Math.max(2, maxCount * 0.5), Math.max(3, maxCount * 0.75), maxCount])
      .range(['#FAF9F6', '#FEF08A', '#E5A910', '#7E9543', '#354318']);

    // Draw X Axis (Time Slots)
    const xAxis = d3
      .axisBottom(xScale)
      .tickFormat((d) => {
        // Shorten labels on smaller widths
        const parts = (d as string).split(' ');
        return parts[0] + ' ' + (parts[2] || '');
      });

    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis)
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-25)')
      .style('font-size', '10px')
      .style('font-family', 'monospace')
      .style('fill', 'currentColor')
      .attr('class', 'text-neutral-600 dark:text-neutral-400');

    // Draw Y Axis (Daycare Areas)
    const yAxis = d3.axisLeft(yScale);
    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .style('font-size', '10.5px')
      .style('font-weight', '600')
      .style('font-family', 'monospace')
      .style('fill', 'currentColor')
      .attr('class', 'text-neutral-700 dark:text-neutral-300');

    // Remove axis domain lines for clean modern look
    g.selectAll('.domain').remove();
    g.selectAll('.tick line').attr('stroke', '#e5e7eb').attr('stroke-opacity', 0.4);

    // Heatmap Cells (Rectangles with rounded corners and D3 hover events)
    const cells = g
      .selectAll('.heatmap-cell')
      .data<MatrixCell>(matrixData)
      .enter()
      .append('g')
      .attr('class', 'heatmap-cell');

    cells
      .append('rect')
      .attr('x', (d: MatrixCell) => xScale(d.timeSlot) || 0)
      .attr('y', (d: MatrixCell) => yScale(d.area) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', (d: MatrixCell) => {
        if (d.count === 0) return 'rgba(128, 128, 128, 0.08)';
        return colorScale(d.count);
      })
      .attr('stroke', (d: MatrixCell) => (d.highCount > 0 ? '#b91c1c' : 'rgba(0,0,0,0.06)'))
      .attr('stroke-width', (d: MatrixCell) => (d.highCount > 0 ? 1.5 : 0.75))
      .attr('stroke-dasharray', (d: MatrixCell) => (d.highCount > 0 ? '2,2' : 'none'))
      .style('cursor', 'pointer')
      .style('transition', 'transform 0.15s ease, stroke-width 0.15s ease')
      .on('mouseenter', function (this: SVGRectElement, event: MouseEvent, d: MatrixCell) {
        d3.select(this)
          .attr('stroke', '#52632B')
          .attr('stroke-width', 2.5)
          .attr('stroke-dasharray', 'none');

        const bounds = containerRef.current?.getBoundingClientRect();
        const clientX = event.clientX - (bounds?.left || 0);
        const clientY = event.clientY - (bounds?.top || 0);

        setHoveredCell({
          area: d.area,
          timeSlot: d.timeSlot,
          count: d.count,
          highCount: d.highCount,
          medCount: d.medCount,
          lowCount: d.lowCount,
          dominantHazard: d.dominantHazard,
          avgConfidence: d.avgConfidence,
          x: clientX,
          y: clientY,
        });
      })
      .on('mouseleave', function (this: SVGRectElement, _event: MouseEvent, d: MatrixCell) {
        d3.select(this)
          .attr('stroke', d.highCount > 0 ? '#b91c1c' : 'rgba(0,0,0,0.06)')
          .attr('stroke-width', d.highCount > 0 ? 1.5 : 0.75)
          .attr('stroke-dasharray', d.highCount > 0 ? '2,2' : 'none');

        setHoveredCell(null);
      })
      .on('click', (_event: MouseEvent, d: MatrixCell) => {
        setSelectedCellLogs({
          area: d.area,
          timeSlot: d.timeSlot,
          logs: d.logs,
        });
        if (onSelectArea) {
          onSelectArea(d.area);
        }
      });

    // Display occurrence count label on each cell
    cells
      .append('text')
      .attr('x', (d: MatrixCell) => (xScale(d.timeSlot) || 0) + xScale.bandwidth() / 2)
      .attr('y', (d: MatrixCell) => (yScale(d.area) || 0) + yScale.bandwidth() / 2 + 3.5)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('font-family', 'monospace')
      .style('pointer-events', 'none')
      .style('fill', (d: MatrixCell) => {
        if (d.count === 0) return 'rgba(128, 128, 128, 0.4)';
        return d.count >= 2 ? '#ffffff' : '#374151';
      })
      .text((d: MatrixCell) => (d.count > 0 ? d.count : '0'));
  }, [matrixData, onSelectArea]);

  return (
    <div className="bg-white dark:bg-[#181a15] rounded-xl border border-gray-200 dark:border-neutral-800 p-4 shadow-sm space-y-4">
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-[#52632B]/10 dark:bg-[#52632B]/25 text-[#52632B] dark:text-[#9BB762]">
              <Flame className="w-4 h-4 text-[#D49A00]" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900 dark:text-neutral-100 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <span>D3 Computer Vision Hazard Occurrence Heatmap</span>
                <span className="text-[10px] font-normal text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                  REAL-TIME DENSITY
                </span>
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-neutral-400 font-mono">
                Spatial-temporal distribution of CV-detected physical obstacles, gate statuses, and safety alerts
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-neutral-800 p-1 rounded-lg border border-gray-200 dark:border-neutral-700">
            <Filter className="w-3 h-3 text-[#52632B]" />
            <button
              id="filter-severity-all"
              onClick={() => setSelectedSeverity('all')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                selectedSeverity === 'all'
                  ? 'bg-[#52632B] text-white'
                  : 'text-gray-600 dark:text-neutral-300 hover:text-black dark:hover:text-white'
              }`}
            >
              All
            </button>
            <button
              id="filter-severity-high"
              onClick={() => setSelectedSeverity('high')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                selectedSeverity === 'high'
                  ? 'bg-[#52632B] text-white'
                  : 'text-gray-600 dark:text-neutral-300 hover:text-black dark:hover:text-white'
              }`}
            >
              High Severity
            </button>
            <button
              id="filter-severity-med-high"
              onClick={() => setSelectedSeverity('medium_high')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                selectedSeverity === 'medium_high'
                  ? 'bg-[#52632B] text-white'
                  : 'text-gray-600 dark:text-neutral-300 hover:text-black dark:hover:text-white'
              }`}
            >
              Med & High
            </button>
          </div>

          <select
            id="filter-date-select"
            value={selectedDateFilter}
            onChange={(e) => setSelectedDateFilter(e.target.value as any)}
            className="px-2 py-1 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded text-[10px] font-bold text-gray-700 dark:text-neutral-200"
          >
            <option value="all">All Logs (Past 7 Days)</option>
            <option value="today">Today (Sept 4 Only)</option>
            <option value="recent">Past 48 Hours</option>
          </select>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-[#1f221c] border border-gray-200 dark:border-neutral-800">
          <div className="text-[10px] text-gray-400 uppercase">Total Hazard Events</div>
          <div className="text-base font-bold text-gray-900 dark:text-neutral-100 mt-0.5">
            {stats.total} <span className="text-[10px] font-normal text-gray-500">detected</span>
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-red-50/70 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40">
          <div className="text-[10px] text-red-700 dark:text-red-300 uppercase font-bold">
            High Severity Warnings
          </div>
          <div className="text-base font-bold text-red-800 dark:text-red-200 mt-0.5">
            {stats.high} <span className="text-[10px] font-normal">critical points</span>
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40">
          <div className="text-[10px] text-amber-700 dark:text-amber-300 uppercase font-bold">
            Highest Frequency Zone
          </div>
          <div className="text-xs font-bold text-amber-900 dark:text-amber-200 truncate mt-0.5" title={stats.topArea}>
            {stats.topArea.split(' ')[0]} {stats.topArea.split(' ')[1]} ({stats.maxAreaC})
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-[#556B2F]/10 dark:bg-[#556B2F]/20 border border-[#556B2F]/30">
          <div className="text-[10px] text-[#556B2F] dark:text-[#9BB762] uppercase font-bold">
            Peak Hazard Window
          </div>
          <div className="text-xs font-bold text-[#556B2F] dark:text-[#9BB762] truncate mt-0.5" title={stats.peakTime}>
            {stats.peakTime.split('(')[0]}
          </div>
        </div>
      </div>

      {/* SVG Container with Interactive Tooltip */}
      <div ref={containerRef} className="relative w-full overflow-x-auto select-none pt-2">
        <svg ref={svgRef} className="min-w-[660px] h-[310px]" />

        {/* Hover Tooltip Overlay */}
        {hoveredCell && (
          <div
            style={{
              left: Math.min(window.innerWidth - 300, hoveredCell.x + 15),
              top: Math.max(10, hoveredCell.y - 80),
            }}
            className="pointer-events-none absolute z-40 bg-neutral-900/95 text-white p-2.5 rounded-lg shadow-xl text-[11px] font-mono border border-neutral-700 min-w-[210px] backdrop-blur-xs transition-all duration-75"
          >
            <div className="font-bold text-amber-300 text-xs border-b border-neutral-700 pb-1 mb-1.5 flex items-center justify-between">
              <span>{hoveredCell.area}</span>
              <span className="text-[9px] text-neutral-400">{hoveredCell.timeSlot.split(' ')[0]}</span>
            </div>
            <div className="space-y-1 text-neutral-300">
              <div className="flex justify-between">
                <span>Frequency Count:</span>
                <span className="font-bold text-white">{hoveredCell.count} hazard events</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>Severity Breakdown:</span>
                <span>
                  <strong className="text-red-400">{hoveredCell.highCount} high</strong> •{' '}
                  <strong className="text-amber-400">{hoveredCell.medCount} med</strong> •{' '}
                  <strong className="text-emerald-400">{hoveredCell.lowCount} low</strong>
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>Dominant Hazard:</span>
                <span className="text-amber-200 truncate max-w-[120px]" title={hoveredCell.dominantHazard}>
                  {hoveredCell.dominantHazard}
                </span>
              </div>
              {hoveredCell.count > 0 && (
                <div className="flex justify-between text-[10px] text-neutral-400 pt-1 border-t border-neutral-800">
                  <span>CV AI Confidence:</span>
                  <span className="text-emerald-300">{Math.round(hoveredCell.avgConfidence * 100)}%</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Heatmap Legend */}
      <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-gray-100 dark:border-neutral-800 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span>Hazard Frequency:</span>
          <span className="w-3.5 h-3 rounded bg-gray-100 dark:bg-neutral-800 border border-gray-300" />
          <span>0</span>
          <span className="w-3.5 h-3 rounded bg-[#FEF08A] border border-gray-200" />
          <span>1</span>
          <span className="w-3.5 h-3 rounded bg-[#E5A910]" />
          <span>2</span>
          <span className="w-3.5 h-3 rounded bg-[#7E9543]" />
          <span>3</span>
          <span className="w-3.5 h-3 rounded bg-[#354318] text-white" />
          <span>4+ events</span>
          <span className="ml-2 flex items-center gap-1 text-red-600 font-bold">
            <span className="w-3.5 h-3 rounded border-2 border-dashed border-red-600 inline-block" /> High Severity
          </span>
        </div>

        <div className="text-[10px] text-neutral-400">
          Click any cell to inspect logged incidents & AI observations
        </div>
      </div>

      {/* Selected Cell Drill-Down Modal / Section */}
      {selectedCellLogs && (
        <div className="mt-3 p-3.5 rounded-xl bg-gray-50 dark:bg-[#141612] border border-gray-200 dark:border-neutral-800 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#52632B]" />
              <span className="font-bold text-xs text-gray-800 dark:text-neutral-200 font-mono">
                Inspecting: {selectedCellLogs.area} // {selectedCellLogs.timeSlot}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 font-bold">
                {selectedCellLogs.logs.length} Recorded Detections
              </span>
            </div>
            <button
              onClick={() => setSelectedCellLogs(null)}
              className="text-[11px] font-mono text-gray-500 hover:text-black dark:hover:text-white px-2 py-0.5 rounded border border-gray-300 dark:border-neutral-700"
            >
              Close Drill-down
            </button>
          </div>

          {selectedCellLogs.logs.length === 0 ? (
            <div className="py-4 text-center text-xs text-gray-500 font-mono">
              Zero safety hazards detected during this operational period. Area was clean and fully compliant.
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-neutral-800 max-h-48 overflow-y-auto mt-2 text-xs font-mono">
              {selectedCellLogs.logs.map((log) => (
                <div key={log.id} className="py-2 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          log.severity === 'high'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {log.severity}
                      </span>
                      <span className="font-bold text-gray-800 dark:text-neutral-200">{log.hazardType}</span>
                      <span className="text-gray-400 text-[10px]">{log.timestamp}</span>
                    </div>
                    <p className="text-gray-600 dark:text-neutral-400 text-[11px] mt-0.5">
                      Detected object: <strong className="text-gray-800 dark:text-neutral-200">{log.detectedObject}</strong> ({Math.round(log.confidence * 100)}% conf). Feed: {log.cameraFeed}
                    </p>
                    {log.mitigationNotes && (
                      <p className="text-emerald-700 dark:text-emerald-400 text-[10px] mt-0.5 italic">
                        Mitigation: {log.mitigationNotes}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 uppercase font-bold shrink-0">
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
