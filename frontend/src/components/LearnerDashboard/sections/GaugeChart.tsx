import React from 'react';

interface GaugeChartProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  color?: string;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({ 
  value, 
  size = 160, 
  strokeWidth = 16,
  showValue = true,
  color
}) => {
  const percentage = Math.min(Math.max(value || 0, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  
  // Calculate arc offset for value
  const offset = circumference - (percentage / 100) * circumference;
  
  // Calculate needle angle (-90° to 90° for half circle)
  const needleAngle = -90 + (percentage / 100) * 180;
  const needleLength = radius * 0.65;
  const centerX = size / 2;
  const centerY = size / 2 + strokeWidth / 2;
  
  // Needle end point
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleX = centerX + needleLength * Math.cos(needleRad);
  const needleY = centerY + needleLength * Math.sin(needleRad);

  // Determine color based on value if not provided
  const getValueColor = () => {
    if (color) return color;
    if (percentage >= 80) return '#22c55e'; // Green
    if (percentage >= 60) return '#0066FF'; // Blue
    if (percentage >= 40) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };
  
  const valueColor = getValueColor();
  const uniqueId = `gauge-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size * 0.6 + 30 }}>
      <svg
        width={size}
        height={size * 0.6}
        viewBox={`0 0 ${size} ${size * 0.6}`}
        className="overflow-visible"
      >
        <defs>
          {/* Background gradient (grey) */}
          <linearGradient id={`${uniqueId}-bg`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e5e7eb" />
            <stop offset="100%" stopColor="#e5e7eb" />
          </linearGradient>
          
          {/* Value gradient */}
          <linearGradient id={`${uniqueId}-value`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={valueColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor={valueColor} />
          </linearGradient>
        </defs>

        {/* Background arc (grey) */}
        <path
          d={`M ${strokeWidth / 2} ${size * 0.6 - strokeWidth / 2} 
              A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size * 0.6 - strokeWidth / 2}`}
          fill="none"
          stroke={`url(#${uniqueId}-bg)`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Value arc */}
        <path
          d={`M ${strokeWidth / 2} ${size * 0.6 - strokeWidth / 2} 
              A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size * 0.6 - strokeWidth / 2}`}
          fill="none"
          stroke={`url(#${uniqueId}-value)`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />

        {/* Needle */}
        <g className="transition-transform duration-500 ease-out" style={{ transformOrigin: `${centerX}px ${centerY}px` }}>
          <line
            x1={centerX}
            y1={centerY}
            x2={needleX}
            y2={needleY}
            stroke="#1f2937"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Needle center dot */}
          <circle
            cx={centerX}
            cy={centerY}
            r="5"
            fill="#1f2937"
          />
        </g>

        {/* Min/Max labels */}
        <text x={strokeWidth / 2} y={size * 0.6 + 12} className="text-[10px] fill-gray-400" textAnchor="start">0</text>
        <text x={size - strokeWidth / 2} y={size * 0.6 + 12} className="text-[10px] fill-gray-400" textAnchor="end">100</text>
      </svg>
      
      {/* Value text */}
      {showValue && (
        <div className="text-center mt-1">
          <span 
            className="font-bold text-2xl transition-colors duration-300"
            style={{ color: valueColor }}
          >
            {percentage}%
          </span>
        </div>
      )}
    </div>
  );
};

