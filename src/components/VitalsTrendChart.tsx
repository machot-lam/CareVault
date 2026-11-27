import React, { useMemo, useState } from 'react';
import { VitalReading, formatDateTime } from '../types/clinical';

interface VitalsTrendChartProps {
  vitals: VitalReading[];
}

export const VitalsTrendChart: React.FC<VitalsTrendChartProps> = ({ vitals }) => {
  const sorted = useMemo(
    () => [...vitals].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt)).slice(-10),
    [vitals]
  );
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (sorted.length < 2) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
        <div className="text-sm font-medium text-slate-900">Longitudinal Vitals Trend</div>
        <p className="text-xs text-slate-500 mt-1">
          Record at least two vital sign observations to visualize blood pressure and heart rate trajectories.
        </p>
      </div>
    );
  }

  const width = 760;
  const height = 220;
  const padL = 44;
  const padR = 20;
  const padT = 18;
  const padB = 34;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const allValues = sorted.flatMap((v) => [v.systolicBp, v.diastolicBp, v.heartRate]);
  const minY = Math.max(30, Math.floor((Math.min(...allValues) - 12) / 10) * 10);
  const maxY = Math.min(240, Math.ceil((Math.max(...allValues) + 12) / 10) * 10);

  const xPos = (i: number) =>
    sorted.length === 1 ? padL + plotW / 2 : padL + (i / (sorted.length - 1)) * plotW;
  const yPos = (val: number) =>
    padT + plotH - ((val - minY) / Math.max(1, maxY - minY)) * plotH;

  const buildPath = (getter: (v: VitalReading) => number) =>
    sorted
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)} ${yPos(getter(v)).toFixed(1)}`)
      .join(' ');

  const systolicPath = buildPath((v) => v.systolicBp);
  const diastolicPath = buildPath((v) => v.diastolicBp);
  const hrPath = buildPath((v) => v.heartRate);

  const yTicks = [minY, Math.round((minY + maxY) / 2), maxY];
  const activeIdx = hoveredIdx !== null ? hoveredIdx : sorted.length - 1;
  const activeReading = sorted[activeIdx];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Hemodynamic & Pulse Trajectory
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            Showing {sorted.length} chronological observations
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-xs text-slate-600 tabular-nums">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-teal-700 inline-block" />
            Systolic <strong className="font-mono text-slate-900">{activeReading.systolicBp}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-sky-600 inline-block" />
            Diastolic <strong className="font-mono text-slate-900">{activeReading.diastolicBp}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-600 inline-block" />
            Pulse <strong className="font-mono text-slate-900">{activeReading.heartRate} bpm</strong>
          </span>
          <span className="text-slate-400 font-mono">
            {formatDateTime(activeReading.recordedAt)}
          </span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-52 min-w-[520px] select-none"
          role="img"
          aria-label="Blood pressure and heart rate clinical trend chart"
        >
          {/* Horizontal gridlines & labels */}
          {yTicks.map((tick) => {
            const y = yPos(tick);
            return (
              <g key={tick}>
                <line
                  x1={padL}
                  y1={y}
                  x2={width - padR}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                />
                <text
                  x={padL - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] font-mono"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Hover vertical guide */}
          <line
            x1={xPos(activeIdx)}
            y1={padT}
            x2={xPos(activeIdx)}
            y2={height - padB}
            stroke="#cbd5e1"
            strokeWidth="1"
          />

          {/* Trend lines */}
          <path d={systolicPath} fill="none" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d={diastolicPath} fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d={hrPath} fill="none" stroke="#d97706" strokeWidth="1.75" strokeDasharray="4 3" strokeLinecap="round" />

          {/* Data nodes + interactive hit targets */}
          {sorted.map((v, i) => {
            const x = xPos(i);
            const isSelected = i === activeIdx;
            const label = v.recordedAt.slice(5, 10);
            return (
              <g
                key={v.id}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                <rect
                  x={x - 16}
                  y={padT}
                  width={32}
                  height={plotH}
                  fill="transparent"
                />
                <circle
                  cx={x}
                  cy={yPos(v.systolicBp)}
                  r={isSelected ? 4.5 : 3}
                  fill="#0f766e"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <circle
                  cx={x}
                  cy={yPos(v.diastolicBp)}
                  r={isSelected ? 4.5 : 3}
                  fill="#0284c7"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <circle
                  cx={x}
                  cy={yPos(v.heartRate)}
                  r={isSelected ? 4 : 2.5}
                  fill="#d97706"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <text
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  className={`text-[10px] font-mono ${isSelected ? 'fill-slate-900 font-semibold' : 'fill-slate-400'}`}
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
