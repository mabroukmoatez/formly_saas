import React from 'react';

interface GaugeChartProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({ 
  value, 
  size = 200, 
  strokeWidth = 20 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Half circle
  const percentage = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (percentage / 100) * circumference;
  
  // Calculate needle angle (0-180 degrees for half circle)
  const needleAngle = (percentage / 100) * 180 - 90; // -90 to 90 degrees
  const needleLength = radius * 0.7;
  const centerX = size / 2;
  const centerY = size / 2;
  const needleX = centerX + needleLength * Math.cos((needleAngle * Math.PI) / 180);
  const needleY = centerY + needleLength * Math.sin((needleAngle * Math.PI) / 180);

  return (
    <div className="relative" style={{ width: size, height: size * 0.7 }}>
      <svg
        width={size}
        height={size * 0.7}
        viewBox={`0 0 ${size} ${size * 0.7}`}
        className="overflow-visible"
      >
        <defs>
          {/* Gradient for gauge background */}
          <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF4757" />
            <stop offset="25%" stopColor="#FF8A3D" />
            <stop offset="50%" stopColor="#FFD93D" />
            <stop offset="75%" stopColor="#26DE81" />
            <stop offset="100%" stopColor="#0085FF" />
          </linearGradient>
        </defs>

        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2} ${size * 0.7 - strokeWidth / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size * 0.7 - strokeWidth / 2}`}
          fill="none"
          stroke="url(#gauge-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Value arc */}
        <path
          d={`M ${strokeWidth / 2} ${size * 0.7 - strokeWidth / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size * 0.7 - strokeWidth / 2}`}
          fill="none"
          stroke="url(#gauge-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transform: 'scaleX(-1)',
            transformOrigin: 'center',
          }}
        />

        {/* Needle */}
        <line
          x1={centerX}
          y1={centerY}
          x2={needleX}
          y2={needleY}
          stroke="#19294a"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Center circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r="8"
          fill="#19294a"
        />
      </svg>
      
      {/* Value text */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <div className="[font-family:'Urbanist',Helvetica] font-bold text-[#19294a] text-[32px] leading-tight">
          {value}%
        </div>
      </div>
    </div>
  );
};

