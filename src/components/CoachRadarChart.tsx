import React, { useState, useMemo, useCallback } from 'react';

export interface RadarChartItem {
  label: string;
  shortLabel?: string;
  current?: number;
  value?: number;
  benchmark?: number;
  icon?: string;
}

export interface CoachRadarChartProps {
  title?: string;
  data: RadarChartItem[];
  className?: string;
}

export const CoachRadarChart: React.FC<CoachRadarChartProps> = React.memo(({
  title = 'Admissions Standing vs. Top-20 Collegiate Standards',
  data = [],
  className = ''
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showStudent, setShowStudent] = useState<boolean>(true);
  const [showBenchmark, setShowBenchmark] = useState<boolean>(true);

  // Normalize data items
  const items = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((item) => {
      const score = item.current ?? item.value ?? 75;
      const benchmark = item.benchmark ?? 90;

      return {
        label: item.label,
        shortLabel: item.shortLabel || item.label.split(' ')[0] || item.label,
        score: Math.min(Math.max(score, 0), 100),
        benchmark: Math.min(Math.max(benchmark, 0), 100)
      };
    });
  }, [data]);

  const totalAxes = items.length;

  // Geometry dimensions - generous canvas for large, clear typography
  const width = 480;
  const height = 380;
  const centerX = width / 2;
  const centerY = height / 2 + 5;
  const radius = 115;
  const angleSlice = totalAxes > 0 ? (Math.PI * 2) / totalAxes : 0;

  // Levels for concentric grid (20%, 40%, 60%, 80%, 100%)
  const levels = useMemo(() => [20, 40, 60, 80, 100], []);

  // Precompute Cartesian Coordinates
  const getCoordinates = useCallback(
    (value: number, index: number) => {
      const angle = angleSlice * index - Math.PI / 2;
      const r = (value / 100) * radius;
      return {
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle),
        angle
      };
    },
    [angleSlice, centerX, centerY, radius]
  );

  // Geometry Points and Paths memoized for instant 60fps responsiveness
  const { studentCoords, benchmarkCoords, studentPath, benchmarkPath, spokeEndpoints, labelPositions } =
    useMemo(() => {
      if (totalAxes < 3) {
        return {
          studentCoords: [],
          benchmarkCoords: [],
          studentPath: '',
          benchmarkPath: '',
          spokeEndpoints: [],
          labelPositions: []
        };
      }

      const sCoords = items.map((item, i) => getCoordinates(item.score, i));
      const bCoords = items.map((item, i) => getCoordinates(item.benchmark, i));
      const spokes = items.map((_, i) => getCoordinates(100, i));

      const sPath =
        sCoords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';
      const bPath =
        bCoords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';

      // Outer label positions with generous margin and adaptive anchors
      const labels = items.map((item, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const labelRadius = radius + 32;
        const lx = centerX + labelRadius * Math.cos(angle);
        const ly = centerY + labelRadius * Math.sin(angle);

        let textAnchor: 'middle' | 'start' | 'end' = 'middle';
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        if (cos > 0.25) textAnchor = 'start';
        else if (cos < -0.25) textAnchor = 'end';

        // Fine-tune vertical alignment
        let dy1 = 0;
        let dy2 = 15;
        if (sin < -0.8) {
          dy1 = -10;
          dy2 = 6;
        } else if (sin > 0.8) {
          dy1 = 12;
          dy2 = 28;
        }

        return {
          lx,
          ly,
          textAnchor,
          dy1,
          dy2,
          angle,
          item
        };
      });

      return {
        studentCoords: sCoords,
        benchmarkCoords: bCoords,
        studentPath: sPath,
        benchmarkPath: bPath,
        spokeEndpoints: spokes,
        labelPositions: labels
      };
    }, [items, totalAxes, getCoordinates, angleSlice, centerX, centerY, radius]);

  if (totalAxes < 3) {
    return null;
  }

  const activeItem = hoveredIndex !== null ? items[hoveredIndex] : null;

  return (
    <div
      className={`my-3.5 p-4 sm:p-5 rounded-2xl bg-[#0b0c16]/95 border border-indigo-500/30 shadow-2xl shadow-black/60 space-y-3.5 backdrop-blur-md transition-colors ${className}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            <span className="material-symbols-outlined text-[19px]">radar</span>
          </div>
          <div>
            <h4 className="text-[14px] font-bold text-white tracking-wide flex items-center gap-2">
              {title}
            </h4>
            <p className="text-[11.5px] text-slate-400">
              Multi-dimensional admissions standing mapped against elite collegiate targets
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10.5px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/35">
            Multi-Dimensional Radar
          </span>
        </div>
      </div>

      {/* Radar SVG Container */}
      <div className="relative w-full flex flex-col items-center justify-center py-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[480px] h-auto overflow-visible select-none drop-shadow-md"
        >
          <defs>
            {/* Student Glow Gradient */}
            <radialGradient id="coachRadarStudentGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
              <stop offset="70%" stopColor="#6366f1" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.05" />
            </radialGradient>

            {/* Benchmark Glow Gradient */}
            <radialGradient id="coachRadarBenchmarkGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.02" />
            </radialGradient>
          </defs>

          {/* Concentric Polygonal Background Web Grid */}
          {levels.map((level) => {
            const levelPoints = items
              .map((_, i) => {
                const { x, y } = getCoordinates(level, i);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              })
              .join(' ');

            return (
              <g key={`level-${level}`}>
                <polygon
                  points={levelPoints}
                  fill={level === 100 ? 'rgba(255, 255, 255, 0.02)' : 'none'}
                  stroke={level === 100 ? 'rgba(99, 102, 241, 0.35)' : 'rgba(255, 255, 255, 0.08)'}
                  strokeWidth={level === 100 ? '1.5' : '0.9'}
                  strokeDasharray={level === 100 ? undefined : '3,3'}
                />
                {/* Level Percentage Label - Clear, crisp and larger */}
                <text
                  x={centerX + 4}
                  y={centerY - (level / 100) * radius - 3}
                  fill="rgba(148, 163, 184, 0.75)"
                  fontSize="10"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {level}%
                </text>
              </g>
            );
          })}

          {/* Axis Spokes from Center to Vertices */}
          {spokeEndpoints.map((endCoord, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <line
                key={`spoke-${i}`}
                x1={centerX}
                y1={centerY}
                x2={endCoord.x}
                y2={endCoord.y}
                stroke={isHovered ? '#818cf8' : 'rgba(255, 255, 255, 0.12)'}
                strokeWidth={isHovered ? '2' : '1'}
              />
            );
          })}

          {/* Benchmark Polygon */}
          {showBenchmark && (
            <path
              d={benchmarkPath}
              fill="url(#coachRadarBenchmarkGlow)"
              stroke="#c084fc"
              strokeWidth="1.8"
              strokeDasharray="5,3"
            />
          )}

          {/* Student Standing Polygon */}
          {showStudent && (
            <path
              d={studentPath}
              fill="url(#coachRadarStudentGlow)"
              stroke="#818cf8"
              strokeWidth="2.6"
            />
          )}

          {/* Benchmark Nodes */}
          {showBenchmark &&
            benchmarkCoords.map((benchmarkPt, i) => {
              const isHovered = hoveredIndex === i;
              return (
                <circle
                  key={`bench-dot-${i}`}
                  cx={benchmarkPt.x}
                  cy={benchmarkPt.y}
                  r={isHovered ? 4.5 : 3}
                  fill="#c084fc"
                  stroke="#1e1b4b"
                  strokeWidth="1.2"
                  opacity={0.9}
                />
              );
            })}

          {/* Student Nodes & Hit Targets */}
          {showStudent &&
            studentCoords.map((studentPt, i) => {
              const isHovered = hoveredIndex === i;
              return (
                <g key={`student-dot-${i}`}>
                  {isHovered && (
                    <circle
                      cx={studentPt.x}
                      cy={studentPt.y}
                      r={9}
                      fill="#818cf8"
                      opacity={0.25}
                    />
                  )}
                  <circle
                    cx={studentPt.x}
                    cy={studentPt.y}
                    r={isHovered ? 6 : 4.5}
                    fill={isHovered ? '#ffffff' : '#818cf8'}
                    stroke="#312e81"
                    strokeWidth="2.2"
                  />
                </g>
              );
            })}

          {/* Perimeter Labels with Large, Crisp Typography & Instant Hover Areas */}
          {labelPositions.map((pos, i) => {
            const isHovered = hoveredIndex === i;

            return (
              <g
                key={`label-${i}`}
                className="cursor-pointer"
                onPointerEnter={() => setHoveredIndex(i)}
                onPointerLeave={() => setHoveredIndex(null)}
              >
                {/* Invisible hit box for effortless, lag-free hovering */}
                <circle
                  cx={pos.lx}
                  cy={pos.ly + 4}
                  r={32}
                  fill="transparent"
                />

                {/* Primary Dimension Name - Big & Legible (13px bold) */}
                <text
                  x={pos.lx}
                  y={pos.ly + pos.dy1}
                  textAnchor={pos.textAnchor}
                  fill={isHovered ? '#ffffff' : '#e2e8f0'}
                  fontSize={isHovered ? '13.5' : '13'}
                  fontWeight="800"
                  letterSpacing="0.01em"
                >
                  {pos.item.label}
                </text>

                {/* Score Subtitle - Big & Prominent (11.5px mono) */}
                <text
                  x={pos.lx}
                  y={pos.ly + pos.dy2}
                  textAnchor={pos.textAnchor}
                  fill={isHovered ? '#a5b4fc' : '#94a3b8'}
                  fontSize="11.5"
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  {pos.item.score}%
                </text>
              </g>
            );
          })}
        </svg>

        {/* Stable Fixed-Height Floating Inspector - Zero Layout Shifting & Zero Jitter */}
        <div className="w-full min-h-[46px] mt-2 flex items-center justify-center">
          {activeItem ? (
            <div className="w-full p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-400/50 flex flex-wrap items-center justify-between gap-2 text-[12.5px] backdrop-blur-md shadow-lg shadow-black/40">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-[13px]">{activeItem.label}</span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span className="text-indigo-200 font-semibold">
                  Your Score: <strong className="text-white font-bold">{activeItem.score}%</strong>
                </span>
                <span className="text-purple-300 font-semibold">
                  T20 Target: <strong className="text-purple-200 font-bold">{activeItem.benchmark}%</strong>
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    activeItem.score >= activeItem.benchmark
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {activeItem.score >= activeItem.benchmark
                    ? `+${activeItem.score - activeItem.benchmark}% vs Target`
                    : `${activeItem.score - activeItem.benchmark}% vs Target`}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-[12px] text-slate-400">
              <span>Hover over any axis or score pill below to inspect tactical benchmark deltas</span>
            </div>
          )}
        </div>
      </div>

      {/* Metric Quick Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-white/10">
        {items.map((item, idx) => {
          const isHovered = hoveredIndex === idx;
          const delta = item.score - item.benchmark;
          return (
            <div
              key={`pill-${idx}`}
              onPointerEnter={() => setHoveredIndex(idx)}
              onPointerLeave={() => setHoveredIndex(null)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer select-none ${
                isHovered
                  ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-md shadow-indigo-950/50'
                  : 'bg-white/[0.03] border-white/5 text-slate-300 hover:bg-white/[0.07] hover:border-white/10'
              }`}
            >
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-bold truncate max-w-[130px] text-slate-100">{item.label}</span>
              </div>
              <div className="flex items-center justify-between text-[12.5px] mt-1 font-mono">
                <span className="font-bold text-indigo-300">{item.score}%</span>
                <span className={`text-[11px] font-semibold ${delta >= 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  Target: {item.benchmark}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend & Toggle Strip */}
      <div className="flex flex-wrap items-center justify-between text-[12px] text-slate-400 pt-1.5 border-t border-white/10">
        <button
          type="button"
          onClick={() => setShowStudent(!showStudent)}
          className={`flex items-center gap-2 cursor-pointer px-2.5 py-1 rounded-lg transition-all ${
            showStudent ? 'text-indigo-300 bg-indigo-500/15 border border-indigo-500/30' : 'text-slate-500 opacity-60'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8]"></span>
          <span className="font-semibold text-[12px]">Your Rating Polygon</span>
        </button>

        <button
          type="button"
          onClick={() => setShowBenchmark(!showBenchmark)}
          className={`flex items-center gap-2 cursor-pointer px-2.5 py-1 rounded-lg transition-all ${
            showBenchmark ? 'text-purple-300 bg-purple-500/15 border border-purple-500/30' : 'text-slate-500 opacity-60'
          }`}
        >
          <span className="w-3.5 h-1.5 border-t-2 border-dashed border-purple-400"></span>
          <span className="font-semibold text-[12px]">Top-20 Target Baseline</span>
        </button>
      </div>
    </div>
  );
});
CoachRadarChart.displayName = 'CoachRadarChart';
