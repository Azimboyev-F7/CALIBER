import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

export interface RadarDimension {
  key: string;
  name: string;
  shortName: string;
  studentScore: number; // 0 - 100
  benchmarkScore: number; // 0 - 100
  nationalAvg: number; // 0 - 100
  icon: string;
  color: string;
  description: string;
  rubricRating?: string;
}

interface SpikeRadarChartProps {
  dimensions: RadarDimension[];
  benchmarkTitle: string;
  onSelectDimension?: (key: string) => void;
  selectedDimensionKey?: string;
  className?: string;
}

export const SpikeRadarChart: React.FC<SpikeRadarChartProps> = ({
  dimensions,
  benchmarkTitle,
  onSelectDimension,
  selectedDimensionKey,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredDimension, setHoveredDimension] = useState<RadarDimension | null>(null);
  const [showBenchmark, setShowBenchmark] = useState<boolean>(true);
  const [showNationalAvg, setShowNationalAvg] = useState<boolean>(false);
  const [activePolygonHover, setActivePolygonHover] = useState<'student' | 'benchmark' | 'national' | null>(null);

  const totalAxes = dimensions.length;

  // Calculate polygon points in SVG coordinate system
  const size = 380;
  const margin = 60;
  const radius = (size - margin * 2) / 2;
  const center = size / 2;
  const angleSlice = (Math.PI * 2) / totalAxes;

  // D3 linear scale: 0 to 100 -> 0 to radius
  const rScale = useMemo(() => {
    return d3.scaleLinear().domain([0, 100]).range([0, radius]);
  }, [radius]);

  // Concentric levels (e.g., 20%, 40%, 60%, 80%, 100%)
  const levels = [20, 40, 60, 80, 100];

  // Helper to convert polar (angle, value) to Cartesian (x, y)
  const getCoordinates = (value: number, index: number) => {
    const angle = angleSlice * index - Math.PI / 2;
    const r = rScale(value);
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
      angle
    };
  };

  // Build SVG path strings
  const studentPoints = dimensions.map((d, i) => getCoordinates(d.studentScore, i));
  const benchmarkPoints = dimensions.map((d, i) => getCoordinates(d.benchmarkScore, i));
  const nationalPoints = dimensions.map((d, i) => getCoordinates(d.nationalAvg, i));

  const studentPathString = d3.lineRadial<RadarDimension>()
    .radius((d) => rScale(d.studentScore))
    .angle((_, i) => i * angleSlice)
    .curve(d3.curveLinearClosed)(dimensions) || '';

  const benchmarkPathString = d3.lineRadial<RadarDimension>()
    .radius((d) => rScale(d.benchmarkScore))
    .angle((_, i) => i * angleSlice)
    .curve(d3.curveLinearClosed)(dimensions) || '';

  const nationalPathString = d3.lineRadial<RadarDimension>()
    .radius((d) => rScale(d.nationalAvg))
    .angle((_, i) => i * angleSlice)
    .curve(d3.curveLinearClosed)(dimensions) || '';

  // Render or update D3 elements for smooth transitions if needed
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    // Subtle animated entrance on student polygon path
    svg.select('.student-polygon-path')
      .transition()
      .duration(750)
      .ease(d3.easeCubicOut)
      .attr('d', studentPathString);

    if (showBenchmark) {
      svg.select('.benchmark-polygon-path')
        .transition()
        .duration(750)
        .ease(d3.easeCubicOut)
        .attr('d', benchmarkPathString);
    }
  }, [studentPathString, benchmarkPathString, showBenchmark]);

  // Average calculation for overall spike metric
  const avgStudentScore = Math.round(
    dimensions.reduce((acc, curr) => acc + curr.studentScore, 0) / (dimensions.length || 1)
  );

  const avgBenchmarkScore = Math.round(
    dimensions.reduce((acc, curr) => acc + curr.benchmarkScore, 0) / (dimensions.length || 1)
  );

  return (
    <div ref={containerRef} className={`flex flex-col items-center select-none ${className}`}>
      {/* Controls & Layer Toggles */}
      <div className="w-full flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(129,140,248,0.8)]"></span>
          <span className="text-[12.5px] font-bold text-white tracking-tight">
            Multi-Dimensional Spike Radar
          </span>
        </div>

        {/* Layer Checkboxes / Pills */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <button
            onClick={() => setShowBenchmark(!showBenchmark)}
            className={`px-2 py-0.5 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer border ${
              showBenchmark
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
            }`}
            title="Toggle Target Benchmark overlay"
          >
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span>{benchmarkTitle}</span>
          </button>

          <button
            onClick={() => setShowNationalAvg(!showNationalAvg)}
            className={`px-2 py-0.5 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer border ${
              showNationalAvg
                ? 'bg-slate-500/30 text-slate-200 border-slate-400/40 shadow-sm'
                : 'bg-white/5 text-slate-500 border-white/10 hover:text-slate-300'
            }`}
            title="Toggle National Applicant Average baseline"
          >
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span>National Avg</span>
          </button>
        </div>
      </div>

      {/* SVG Radar Chart Container */}
      <div className="relative flex items-center justify-center w-full max-w-[420px] aspect-square py-1">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full overflow-visible drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
        >
          <defs>
            {/* Radial Gradient for Student Spike fill */}
            <radialGradient id="spikeStudentGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.75" />
              <stop offset="60%" stopColor="#a855f7" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.15" />
            </radialGradient>

            {/* Benchmark Polygon Gradient */}
            <radialGradient id="spikeBenchmarkGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.05" />
            </radialGradient>

            {/* Glow Filter */}
            <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Node highlight glow */}
            <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Concentric Radar Webs */}
          <g className="radar-grid" transform={`translate(${center}, ${center})`}>
            {levels.map((level) => {
              const r = rScale(level);
              // Polygon web string for each concentric level
              const levelPoints = Array.from({ length: totalAxes }).map((_, i) => {
                const angle = i * angleSlice - Math.PI / 2;
                return `${r * Math.cos(angle)},${r * Math.sin(angle)}`;
              }).join(' ');

              return (
                <g key={level}>
                  <polygon
                    points={levelPoints}
                    fill="transparent"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="1"
                    strokeDasharray={level === 100 ? 'none' : '3 3'}
                  />
                  {/* Axis level labels on top-most axis */}
                  <text
                    x={4}
                    y={-r + 3}
                    fill="rgba(148, 163, 184, 0.55)"
                    fontSize="9"
                    fontWeight="600"
                    textAnchor="start"
                  >
                    {level}%
                  </text>
                </g>
              );
            })}

            {/* Radial Axis Spokes */}
            {dimensions.map((dim, i) => {
              const angle = i * angleSlice - Math.PI / 2;
              const x2 = radius * Math.cos(angle);
              const y2 = radius * Math.sin(angle);
              const isSelected = selectedDimensionKey === dim.shortName || selectedDimensionKey === dim.key;

              return (
                <line
                  key={`spoke-${dim.key}`}
                  x1={0}
                  y1={0}
                  x2={x2}
                  y2={y2}
                  stroke={isSelected ? 'rgba(129, 140, 248, 0.6)' : 'rgba(255, 255, 255, 0.12)'}
                  strokeWidth={isSelected ? '1.5' : '1'}
                />
              );
            })}
          </g>

          {/* 1. National Average Polygon (Baseline) */}
          {showNationalAvg && (
            <g
              transform={`translate(${center}, ${center})`}
              className="transition-opacity duration-300"
              opacity={activePolygonHover && activePolygonHover !== 'national' ? 0.3 : 0.85}
              onMouseEnter={() => setActivePolygonHover('national')}
              onMouseLeave={() => setActivePolygonHover(null)}
            >
              <path
                d={nationalPathString}
                fill="rgba(148, 163, 184, 0.12)"
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            </g>
          )}

          {/* 2. Benchmark Pool Polygon */}
          {showBenchmark && (
            <g
              transform={`translate(${center}, ${center})`}
              className="transition-opacity duration-300"
              opacity={activePolygonHover && activePolygonHover !== 'benchmark' ? 0.35 : 0.9}
              onMouseEnter={() => setActivePolygonHover('benchmark')}
              onMouseLeave={() => setActivePolygonHover(null)}
            >
              <path
                className="benchmark-polygon-path"
                d={benchmarkPathString}
                fill="url(#spikeBenchmarkGradient)"
                stroke="#c084fc"
                strokeWidth="2"
                strokeDasharray="5 3"
              />
              {/* Benchmark Vertex Dots */}
              {benchmarkPoints.map((pt, i) => (
                <circle
                  key={`bm-dot-${i}`}
                  cx={pt.x - center}
                  cy={pt.y - center}
                  r="3.5"
                  fill="#c084fc"
                  stroke="#1e1b4b"
                  strokeWidth="1.5"
                />
              ))}
            </g>
          )}

          {/* 3. Student Spike Polygon (Hero Layer) */}
          <g
            transform={`translate(${center}, ${center})`}
            className="transition-opacity duration-300"
            opacity={activePolygonHover && activePolygonHover !== 'student' ? 0.4 : 1}
            onMouseEnter={() => setActivePolygonHover('student')}
            onMouseLeave={() => setActivePolygonHover(null)}
          >
            <path
              className="student-polygon-path"
              d={studentPathString}
              fill="url(#spikeStudentGradient)"
              stroke="#818cf8"
              strokeWidth="2.5"
              filter="url(#radarGlow)"
            />

            {/* Student Vertex Nodes (Interactive) */}
            {dimensions.map((dim, i) => {
              const pt = studentPoints[i];
              const isSelected = selectedDimensionKey === dim.shortName || selectedDimensionKey === dim.key;
              const isHovered = hoveredDimension?.key === dim.key;

              return (
                <g
                  key={`student-node-${dim.key}`}
                  transform={`translate(${pt.x - center}, ${pt.y - center})`}
                  className="cursor-pointer"
                  onClick={() => onSelectDimension && onSelectDimension(dim.shortName || dim.key)}
                  onMouseEnter={() => setHoveredDimension(dim)}
                  onMouseLeave={() => setHoveredDimension(null)}
                >
                  {/* Outer pulse ring if selected or hovered */}
                  {(isSelected || isHovered) && (
                    <circle
                      r="9"
                      fill="none"
                      stroke={dim.color || '#818cf8'}
                      strokeWidth="1.5"
                      opacity="0.8"
                      className="animate-ping"
                    />
                  )}
                  <circle
                    r={isSelected || isHovered ? '6' : '4.5'}
                    fill={dim.color || '#818cf8'}
                    stroke="#0c0c14"
                    strokeWidth="2"
                    filter="url(#nodeGlow)"
                    className="transition-all duration-200"
                  />
                  {/* Score pill next to vertex */}
                  <text
                    y="-8"
                    fill="#ffffff"
                    fontSize="9.5"
                    fontWeight="800"
                    textAnchor="middle"
                    className="pointer-events-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
                  >
                    {dim.studentScore}%
                  </text>
                </g>
              );
            })}
          </g>

          {/* Dimension Axis Labels & Icons around the perimeter */}
          {dimensions.map((dim, i) => {
            const angle = i * angleSlice - Math.PI / 2;
            // Place labels slightly outside radius
            const labelRadius = radius + 32;
            const lx = center + labelRadius * Math.cos(angle);
            const ly = center + labelRadius * Math.sin(angle);
            const isSelected = selectedDimensionKey === dim.shortName || selectedDimensionKey === dim.key;
            const isHovered = hoveredDimension?.key === dim.key;

            // Anchor determination
            const textAnchor =
              Math.abs(Math.cos(angle)) < 0.25
                ? 'middle'
                : Math.cos(angle) > 0
                ? 'start'
                : 'end';

            return (
              <g
                key={`axis-label-${dim.key}`}
                transform={`translate(${lx}, ${ly})`}
                className="cursor-pointer transition-transform duration-200 group"
                onClick={() => onSelectDimension && onSelectDimension(dim.shortName || dim.key)}
                onMouseEnter={() => setHoveredDimension(dim)}
                onMouseLeave={() => setHoveredDimension(null)}
              >
                {/* Background pill on hover/selected */}
                {(isSelected || isHovered) && (
                  <rect
                    x={textAnchor === 'middle' ? -45 : textAnchor === 'start' ? -4 : -86}
                    y={-14}
                    width="90"
                    height="28"
                    rx="6"
                    fill="rgba(99, 102, 241, 0.25)"
                    stroke="rgba(129, 140, 248, 0.5)"
                    strokeWidth="1"
                  />
                )}

                {/* Primary Dimension Name */}
                <text
                  x={0}
                  y={-2}
                  textAnchor={textAnchor}
                  fill={isSelected || isHovered ? '#ffffff' : '#cbd5e1'}
                  fontSize="11.5"
                  fontWeight={isSelected || isHovered ? '800' : '600'}
                  className="transition-colors group-hover:fill-indigo-300"
                >
                  {dim.shortName || dim.name}
                </text>

                {/* Subtitle / delta indicator */}
                <text
                  x={0}
                  y={10}
                  textAnchor={textAnchor}
                  fill={dim.studentScore >= dim.benchmarkScore ? '#34d399' : '#fbbf24'}
                  fontSize="9.5"
                  fontWeight="700"
                >
                  {dim.studentScore >= dim.benchmarkScore
                    ? `+${dim.studentScore - dim.benchmarkScore}% Lead`
                    : `${dim.studentScore - dim.benchmarkScore}% Delta`}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Center Target Indicator */}
        <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-[#0c0c14]/85 border border-white/15 backdrop-blur-md flex flex-col items-center justify-center pointer-events-none shadow-inner">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
            SPIKE
          </span>
          <span className="text-[15px] font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent leading-tight">
            {avgStudentScore}%
          </span>
          <span className="text-[8px] text-slate-400 leading-none">
            Index
          </span>
        </div>
      </div>

      {/* Interactive Tooltip / Active Dimension Banner */}
      <div className="w-full mt-1 p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3 min-h-[58px] transition-all">
        {hoveredDimension ? (
          <div className="flex items-center gap-3 w-full">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-md"
              style={{ backgroundColor: hoveredDimension.color || '#6366f1' }}
            >
              <span className="material-symbols-outlined text-[17px]">
                {hoveredDimension.icon || 'bolt'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[12.5px] font-bold text-white truncate">
                  {hoveredDimension.name}
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {hoveredDimension.rubricRating || 'Tier 1/2'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                {hoveredDimension.description}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[14px] font-extrabold text-white">
                {hoveredDimension.studentScore}%
              </span>
              <span className="block text-[9.5px] text-purple-300">
                vs {hoveredDimension.benchmarkScore}% pool
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full text-[11.5px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400 text-[16px]">touch_app</span>
              <span>Hover or click any dimension vertex to inspect admissions tier criteria.</span>
            </div>
            <div className="flex items-center gap-3 font-semibold text-slate-300 text-[11px]">
              <span className="text-indigo-300">Your Avg: {avgStudentScore}%</span>
              <span className="text-purple-300">Pool Avg: {avgBenchmarkScore}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
