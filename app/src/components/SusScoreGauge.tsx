'use client';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { getScoreColor, getScoreLabel } from '@/lib/utils';

interface SusScoreGaugeProps {
  score: number;
  size?: number;
}

export function SusScoreGauge({ score, size = 200 }: SusScoreGaugeProps) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  // SVG arc gauge
  const radius = 80;
  const circumference = Math.PI * radius; // half circle
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3" role="img" aria-label={`Evil score: ${score} out of 100 — ${label}`}>
      <div className="relative" style={{ width: size, height: size / 2 + 40 }}>
        <svg
          width={size}
          height={size / 2 + 20}
          viewBox={`0 0 ${size} ${size / 2 + 20}`}
          className="overflow-visible"
        >
          {/* Background track */}
          <path
            d={`M ${size * 0.1} ${size / 2} A ${radius} ${radius} 0 0 1 ${size * 0.9} ${size / 2}`}
            fill="none"
            stroke="#1e1e2e"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Animated score arc */}
          <motion.path
            d={`M ${size * 0.1} ${size / 2} A ${radius} ${radius} 0 0 1 ${size * 0.9} ${size / 2}`}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            initial={{ strokeDashoffset: strokeDasharray }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
          />

          {/* Score number */}
          <text
            x={size / 2}
            y={size / 2 - 5}
            textAnchor="middle"
            className="font-bold"
            style={{ fontSize: size * 0.22, fill: color, fontFamily: 'Inter, sans-serif' }}
          >
            {score}
          </text>

          {/* /100 label */}
          <text
            x={size / 2}
            y={size / 2 + 18}
            textAnchor="middle"
            style={{ fontSize: size * 0.09, fill: '#6b7280', fontFamily: 'Inter, sans-serif' }}
          >
            / 100
          </text>
        </svg>

        {/* Tick marks */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-muted">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col items-center gap-1"
      >
        <span
          className="text-sm font-semibold px-3 py-1 rounded-full"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {label}
        </span>
        <p className="text-xs text-muted text-center max-w-[160px]">
          {score >= 70 ? 'Highly manipulative UX detected' :
           score >= 40 ? 'Several dark patterns found' :
           score >= 20 ? 'Minor deceptive elements present' :
           'Mostly ethical design'}
        </p>
      </motion.div>
    </div>
  );
}
