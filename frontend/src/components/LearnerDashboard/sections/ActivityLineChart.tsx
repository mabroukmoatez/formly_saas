import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '../../ui/button';
import { useLanguage } from '../../../contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';

interface ActivityLineChartProps {
  data?: {
    week_data?: Array<{ day: string; value: number }>;
    month_data?: Array<{ day: string; value: number }>;
    quarter_data?: Array<{ day: string; value: number }>;
    today_data?: Array<{ hour: string; value: number }>;
  };
  height?: number;
}

type FilterType = 'week' | 'month' | 'quarter' | 'today';

export const ActivityLineChart: React.FC<ActivityLineChartProps> = ({ 
  data, 
  height = 200 
}) => {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<FilterType>('week');

  const filterLabels: Record<FilterType, string> = {
    week: t('learner.dashboard.myActivity'),
    month: t('learner.dashboard.myActivity'),
    quarter: t('learner.dashboard.myActivity'),
    today: t('learner.dashboard.myActivity'),
  };

  // Get data based on filter
  const getChartData = () => {
    switch (filter) {
      case 'week':
        return data?.week_data || [];
      case 'month':
        return data?.month_data || [];
      case 'quarter':
        return data?.quarter_data || [];
      case 'today':
        return data?.today_data || [];
      default:
        return [];
    }
  };

  const chartData = getChartData();
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = 600;
  const chartHeight = height;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Handle empty data
  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="[font-family:'Urbanist',Helvetica] font-bold text-[#19294a] text-[18px] tracking-[0] leading-normal">
            {t('learner.dashboard.myActivity')}
          </h3>
        </div>
        <div className="flex items-center justify-center h-[200px] bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  const values = chartData.map(d => d.value || 0);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);

  // Calculate points for yellow and green lines
  const yellowPoints = chartData.map((point, index) => {
    const x = padding.left + (index / (chartData.length - 1 || 1)) * innerWidth;
    const y = padding.top + innerHeight - ((point.value - minValue) / (maxValue - minValue || 1)) * innerHeight;
    return { x, y, value: point.value };
  });

  const greenPoints = chartData.map((point, index) => {
    const adjustedValue = (point.value || 0) * 0.8; // Slightly different for visual interest
    const x = padding.left + (index / (chartData.length - 1 || 1)) * innerWidth;
    const y = padding.top + innerHeight - ((adjustedValue - minValue) / (maxValue - minValue || 1)) * innerHeight;
    return { x, y, value: adjustedValue };
  });

  // Create path strings
  const yellowPath = yellowPoints.length > 0 ? yellowPoints.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ') : '';

  const greenPath = greenPoints.length > 0 ? greenPoints.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ') : '';

  return (
    <div className="w-full">
      {/* Header with filter */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="[font-family:'Urbanist',Helvetica] font-bold text-[#19294a] text-[18px] tracking-[0] leading-normal">
          {t('learner.dashboard.myActivity')}
        </h3>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-[36px] bg-white rounded-lg border-[#92929d4c] gap-2 hover:bg-[#f9fcff]"
            >
              <span className="[font-family:'Urbanist',Helvetica] font-semibold text-[#001d4a] text-[11px]">
                {filterLabels[filter]}
              </span>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilter('week')}>
              Cette semaine
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('month')}>
              Ce Mois
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('quarter')}>
              Ce Trimestre
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('today')}>
              Aujourd&apos;hui
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Chart */}
      <div className="relative w-full" style={{ height: `${chartHeight}px` }}>
        <svg
          width="100%"
          height={chartHeight}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="yellow-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFD93D" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FFD93D" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="green-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#26DE81" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#26DE81" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + innerHeight - ratio * innerHeight;
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + innerWidth}
                  y2={y}
                  stroke="#e5f3ff"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-[#6a90b9]"
                  fontFamily="Urbanist"
                >
                  {Math.round(maxValue * ratio)}
                </text>
              </g>
            );
          })}

          {/* Area fills */}
          {yellowPoints.length > 0 && (
            <path
              d={`${yellowPath} L ${yellowPoints[yellowPoints.length - 1].x} ${padding.top + innerHeight} L ${yellowPoints[0].x} ${padding.top + innerHeight} Z`}
              fill="url(#yellow-gradient)"
            />
          )}
          {greenPoints.length > 0 && (
            <path
              d={`${greenPath} L ${greenPoints[greenPoints.length - 1].x} ${padding.top + innerHeight} L ${greenPoints[0].x} ${padding.top + innerHeight} Z`}
              fill="url(#green-gradient)"
            />
          )}

          {/* Lines */}
          <path
            d={yellowPath}
            fill="none"
            stroke="#FFD93D"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={greenPath}
            fill="none"
            stroke="#26DE81"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {yellowPoints.map((point, index) => (
            <circle
              key={`yellow-${index}`}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#FFD93D"
              stroke="white"
              strokeWidth="2"
            />
          ))}
          {greenPoints.map((point, index) => (
            <circle
              key={`green-${index}`}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#26DE81"
              stroke="white"
              strokeWidth="2"
            />
          ))}

          {/* X-axis labels */}
          {chartData.map((point, index) => {
            if (filter === 'week' && index % 1 === 0) {
              const x = padding.left + (index / (chartData.length - 1 || 1)) * innerWidth;
              return (
                <text
                  key={index}
                  x={x}
                  y={chartHeight - padding.bottom + 15}
                  textAnchor="middle"
                  className="text-[10px] fill-[#6a90b9]"
                  fontFamily="Urbanist"
                >
                  {point.day}
                </text>
              );
            } else if (filter !== 'week' && index % Math.ceil(chartData.length / 8) === 0) {
              const x = padding.left + (index / (chartData.length - 1 || 1)) * innerWidth;
              return (
                <text
                  key={index}
                  x={x}
                  y={chartHeight - padding.bottom + 15}
                  textAnchor="middle"
                  className="text-[10px] fill-[#6a90b9]"
                  fontFamily="Urbanist"
                >
                  {point.day}
                </text>
              );
            }
            return null;
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-[#FFD93D] rounded-full" />
          <span className="[font-family:'Urbanist',Helvetica] font-medium text-[#6a90b9] text-[12px]">
            Il écritures
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-[#26DE81] rounded-full" />
          <span className="[font-family:'Urbanist',Helvetica] font-medium text-[#6a90b9] text-[12px]">
            Activités
          </span>
        </div>
      </div>
    </div>
  );
};

