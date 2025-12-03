import React from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';

interface MonthlyData {
  month: string;
  humains: number;
  environnement: number;
  total: number;
}

interface CategoryData {
  name: string;
  value: number;
}

interface ExpenseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'total' | 'environnement' | 'humains';
  totalAmount: number;
  monthlyData: MonthlyData[];
  categoryData?: CategoryData[];
  humainsTotal?: number;
  environnementTotal?: number;
}

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  isOpen,
  onClose,
  type,
  totalAmount,
  monthlyData,
  categoryData = [],
  humainsTotal = 0,
  environnementTotal = 0,
}) => {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getTitle = () => {
    switch (type) {
      case 'total':
        return 'Visualiser mes dépenses';
      case 'environnement':
        return 'Dépenses Environnementaux';
      case 'humains':
        return 'Dépenses Humains';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'total':
        return '#2196F3';
      case 'environnement':
        return '#8c2ffe';
      case 'humains':
        return '#26c9b6';
    }
  };

  const primaryColor = getColor();

  // Calculate max value for chart scaling
  const maxValue = Math.max(
    ...monthlyData.map(d => {
      if (type === 'total') return d.total;
      if (type === 'humains') return d.humains;
      return d.environnement;
    }),
    1
  );

  const chartHeight = 200;
  const chartWidth = 600;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const innerHeight = chartHeight - padding.top - padding.bottom;
  const innerWidth = chartWidth - padding.left - padding.right;
  const barWidth = Math.max(8, innerWidth / 12 - 4);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className={`relative max-w-[900px] w-full max-h-[90vh] overflow-auto rounded-[18px] ${
          isDark ? 'bg-gray-900' : 'bg-white'
        } shadow-[0px_0px_75px_rgba(25,41,74,0.24)]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
              {getTitle()}
            </h2>
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
              aria-label="Fermer"
            >
              <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
          </div>

          {/* Total Amount Card */}
          <div
            className={`rounded-[20px] p-4 mb-6 border ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-sm capitalize ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {type === 'total' ? 'dépenses total' : type === 'environnement' ? 'dépenses environnementaux' : 'dépenses humains'}
              </p>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-semibold" style={{ color: primaryColor }}>
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            </div>
          </div>

          {/* Summary for Total Type */}
          {type === 'total' && (
            <div
              className={`rounded-[20px] p-4 mb-6 border ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'
              }`}
            >
              <p className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                Résumé des dépenses
              </p>
              <div className="flex items-end justify-between mb-4">
                <div className="flex flex-col gap-1">
                  <p className={`text-xs capitalize ${isDark ? 'text-gray-400' : 'text-[#92929d]'}`}>
                    dépenses RH
                  </p>
                  <p className="text-lg font-medium" style={{ color: '#8c2ffe' }}>
                    {formatCurrency(humainsTotal)}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className={`text-xs capitalize ${isDark ? 'text-gray-400' : 'text-[#92929d]'}`}>
                    dépenses Environnementaux
                  </p>
                  <p className="text-lg font-medium" style={{ color: '#26c9b6' }}>
                    {formatCurrency(environnementTotal)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-sm bg-[#26c9b6]"></div>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-[#19294a]'}`}>RH</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-sm bg-[#8c2ffe]"></div>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-[#19294a]'}`}>Env</span>
                  </div>
                </div>
              </div>

              {/* Stacked Bar Chart */}
              <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                {/* Y-axis labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = padding.top + innerHeight * (1 - ratio);
                  const value = maxValue * ratio;
                  return (
                    <g key={i}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={padding.left + innerWidth}
                        y2={y}
                        stroke={isDark ? '#374151' : '#e5e7eb'}
                        strokeWidth="1"
                      />
                      <text
                        x={padding.left - 10}
                        y={y + 4}
                        textAnchor="end"
                        fill={isDark ? '#9ca3af' : '#6b7280'}
                        fontSize="10"
                      >
                        {Math.round(value)}
                      </text>
                    </g>
                  );
                })}

                {/* Bars */}
                {monthlyData.map((data, index) => {
                  const barSpacing = innerWidth / 12;
                  const x = padding.left + index * barSpacing + (barSpacing - barWidth) / 2;

                  const envHeight = (data.environnement / maxValue) * innerHeight;
                  const humainsHeight = (data.humains / maxValue) * innerHeight;
                  const envY = padding.top + innerHeight - envHeight;
                  const humainsY = envY - humainsHeight;

                  return (
                    <g key={index}>
                      {/* Environnement bar (bottom) */}
                      {data.environnement > 0 && (
                        <rect
                          x={x}
                          y={envY}
                          width={barWidth}
                          height={envHeight}
                          fill="#26c9b6"
                          rx="2"
                        />
                      )}
                      {/* Humains bar (top) */}
                      {data.humains > 0 && (
                        <rect
                          x={x}
                          y={humainsY}
                          width={barWidth}
                          height={humainsHeight}
                          fill="#8c2ffe"
                          rx="2"
                        />
                      )}
                      {/* Month label */}
                      <text
                        x={x + barWidth / 2}
                        y={chartHeight - 10}
                        textAnchor="middle"
                        fill={isDark ? '#9ca3af' : '#6a90ba'}
                        fontSize="11"
                        fontWeight="500"
                      >
                        {data.month}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* Single Category Chart for Environnement/Humains */}
          {type !== 'total' && (
            <div
              className={`rounded-[20px] p-4 mb-6 border ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'
              }`}
            >
              <p className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                Évolution mensuelle
              </p>

              <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                {/* Y-axis labels */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = padding.top + innerHeight * (1 - ratio);
                  const value = maxValue * ratio;
                  return (
                    <g key={i}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={padding.left + innerWidth}
                        y2={y}
                        stroke={isDark ? '#374151' : '#e5e7eb'}
                        strokeWidth="1"
                      />
                      <text
                        x={padding.left - 10}
                        y={y + 4}
                        textAnchor="end"
                        fill={isDark ? '#9ca3af' : '#6b7280'}
                        fontSize="10"
                      >
                        {Math.round(value)}
                      </text>
                    </g>
                  );
                })}

                {/* Bars */}
                {monthlyData.map((data, index) => {
                  const barSpacing = innerWidth / 12;
                  const x = padding.left + index * barSpacing + (barSpacing - barWidth) / 2;
                  const value = type === 'humains' ? data.humains : data.environnement;
                  const barHeight = (value / maxValue) * innerHeight;
                  const y = padding.top + innerHeight - barHeight;

                  return (
                    <g key={index}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill={primaryColor}
                        rx="2"
                      />
                      <text
                        x={x + barWidth / 2}
                        y={chartHeight - 10}
                        textAnchor="middle"
                        fill={isDark ? '#9ca3af' : '#6a90ba'}
                        fontSize="11"
                        fontWeight="500"
                      >
                        {data.month}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* Categories Detail (for total view) */}
          {type === 'total' && categoryData.length > 0 && (
            <div
              className={`rounded-[20px] p-4 border ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#e2e2ea]'
              }`}
            >
              <p className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-300' : 'text-[#19294a]'}`}>
                Détail des dépenses
              </p>
              <div className="grid grid-cols-1 gap-3">
                {categoryData.slice(0, 5).map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                      {category.name}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: primaryColor }}>
                      {formatCurrency(category.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
