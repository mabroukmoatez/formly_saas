import React, { useState, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ChartDataPoint } from '../../services/commercialDashboard.types';
import { Card, CardContent } from '../ui/card';

interface RevenueLineChartProps {
  data: ChartDataPoint[];
  height?: number;
  primaryColor?: string;
  selectedYear?: number;
  onYearChange?: (year: number) => void;
  showCard?: boolean;
}

export const RevenueLineChart: React.FC<RevenueLineChartProps> = ({
  data,
  height = 256,
  primaryColor = '#007aff',
  selectedYear,
  onYearChange,
  showCard = true,
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Configuration du graphique
  const padding = { top: 20, right: 40, bottom: 40, left: 60 };
  const chartWidth = 1200;
  const chartHeight = height;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Préparer les données pour le graphique
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const values = data.map((d) => d.value || 0);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);

    // Calculer les positions X et Y pour chaque point
    const points = data.map((point, index) => {
      const x = padding.left + (index / (data.length - 1 || 1)) * innerWidth;
      const y =
        padding.top +
        innerHeight -
        ((point.value || 0) - minValue) / (maxValue - minValue || 1) * innerHeight;
      return {
        x,
        y,
        value: point.value || 0,
        month: point.month || '',
        originalIndex: index,
      };
    });

    // Créer le path pour la ligne
    const linePath = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

    // Créer le path pour l'area (ligne + bas)
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`;

    return {
      points,
      linePath,
      areaPath,
      maxValue,
      minValue,
    };
  }, [data, innerWidth, innerHeight, padding]);

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(value)
      .replace('€', '€')
      .replace(/ /g, ' ')
      .trim();
  };

  // Couleurs pour le gradient
  const gradientId = `revenue-gradient-${primaryColor.replace('#', '')}`;
  const lineColor = isDark ? '#60a5fa' : primaryColor;
  const gradientStartColor = isDark ? 'rgba(96, 165, 250, 0.3)' : 'rgba(0, 122, 255, 0.2)';
  const gradientEndColor = isDark ? 'rgba(96, 165, 250, 0)' : 'rgba(0, 122, 255, 0)';

  // Composant du graphique SVG
  const ChartSVG = () => {
    if (!chartData || !data || data.length === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center" style={{ height: `${chartHeight}px` }}>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-center`}>
            {t('dashboard.commercial.chartComingSoon')}<br/>
            <span className="text-sm">Aucune donnée disponible{selectedYear ? ` pour ${selectedYear}` : ''}</span>
          </p>
        </div>
      );
    }

    return (
      <div className="w-full relative" style={{ height: `${chartHeight}px` }}>
        <svg
          width="100%"
          height={chartHeight}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          {/* Définition du gradient et filtres */}
          <defs>
            {/* Gradient de fond subtil pour le graphique */}
            <linearGradient id={`bg-gradient-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isDark ? 'rgba(96, 165, 250, 0.05)' : 'rgba(138, 180, 248, 0.08)'} />
              <stop offset="100%" stopColor={isDark ? 'rgba(96, 165, 250, 0)' : 'rgba(255, 255, 255, 0)'} />
            </linearGradient>
            {/* Gradient pour l'area chart */}
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={gradientStartColor} />
              <stop offset="100%" stopColor={gradientEndColor} />
            </linearGradient>
            <filter id="tooltip-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
              <feOffset dx="0" dy="2" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Fond avec dégradé subtil */}
          <rect
            x={padding.left}
            y={padding.top}
            width={innerWidth}
            height={innerHeight}
            fill={`url(#bg-gradient-${gradientId})`}
          />

          {/* Grille horizontale (lignes de référence) */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + innerHeight - ratio * innerHeight;
            return (
              <line
                key={ratio}
                x1={padding.left}
                y1={y}
                x2={padding.left + innerWidth}
                y2={y}
                stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}
                strokeWidth="1"
                strokeDasharray="3,3"
              />
            );
          })}

          {/* Area Chart (remplissage sous la courbe) */}
          <path
            d={chartData.areaPath}
            fill={`url(#${gradientId})`}
            className="transition-opacity duration-200"
          />

          {/* Line Chart (ligne principale) */}
          <path
            d={chartData.linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-opacity duration-200"
          />

          {/* Data points (points sur chaque mois) */}
          {chartData.points.map((point, index) => {
            const isHovered = hoveredIndex === index;
            return (
              <g key={index}>
                {/* Cercle de point */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isHovered ? 6 : 4}
                  fill={lineColor}
                  stroke={isDark ? '#1e293b' : '#ffffff'}
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{ opacity: isHovered ? 1 : 0.9 }}
                />
                {/* Zone invisible pour faciliter le survol */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={12}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}

          {/* Tooltip (bulle d'information) */}
          {hoveredIndex !== null && chartData.points[hoveredIndex] && (
            <g>
              {/* Ligne verticale pointillée */}
              <line
                x1={chartData.points[hoveredIndex].x}
                y1={padding.top}
                x2={chartData.points[hoveredIndex].x}
                y2={padding.top + innerHeight}
                stroke={lineColor}
                strokeWidth="1.5"
                strokeDasharray="4,4"
                opacity="0.3"
              />
              {/* Fond du tooltip avec ombre */}
              <rect
                x={chartData.points[hoveredIndex].x - 70}
                y={chartData.points[hoveredIndex].y - 55}
                width="140"
                height="42"
                rx="8"
                fill={isDark ? '#1e293b' : '#ffffff'}
                stroke={isDark ? '#334155' : '#e2e8f0'}
                strokeWidth="1"
                filter="url(#tooltip-shadow)"
              />
              {/* Texte du tooltip - Montant */}
              <text
                x={chartData.points[hoveredIndex].x}
                y={chartData.points[hoveredIndex].y - 32}
                textAnchor="middle"
                fill={isDark ? '#f1f5f9' : '#1e293b'}
                fontSize="13"
                fontWeight="600"
                className="font-sans"
              >
                {formatCurrency(chartData.points[hoveredIndex].value)}
              </text>
              {/* Texte du tooltip - Mois */}
              <text
                x={chartData.points[hoveredIndex].x}
                y={chartData.points[hoveredIndex].y - 16}
                textAnchor="middle"
                fill={isDark ? '#94a3b8' : '#64748b'}
                fontSize="11"
                className="font-sans"
              >
                {chartData.points[hoveredIndex].month}
              </text>
            </g>
          )}

          {/* Labels des axes Y */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + innerHeight - ratio * innerHeight;
            const value = chartData.minValue + ratio * (chartData.maxValue - chartData.minValue);
            return (
              <text
                key={ratio}
                x={padding.left - 15}
                y={y + 4}
                textAnchor="end"
                fill={isDark ? '#94a3b8' : '#6a90b9'}
                fontSize="11"
                fontWeight="500"
                className="font-sans"
                style={{ fontFamily: 'Poppins, Helvetica' }}
              >
                {formatCurrency(value)}
              </text>
            );
          })}

          {/* Labels des axes X (mois) */}
          {chartData.points.map((point, index) => {
            // Afficher seulement certains mois pour éviter la surcharge
            // Si moins de 12 mois, afficher tous, sinon afficher environ 6 labels
            const maxLabels = data.length <= 12 ? data.length : 6;
            const step = Math.max(1, Math.floor(data.length / maxLabels));
            const shouldShowLabel = index % step === 0 || index === data.length - 1;
            if (!shouldShowLabel) return null;
            
            return (
              <text
                key={index}
                x={point.x}
                y={chartHeight - padding.bottom + 20}
                textAnchor="middle"
                fill={isDark ? '#94a3b8' : '#6a90b9'}
                fontSize="11"
                fontWeight="500"
                className="font-sans"
                style={{ fontFamily: 'Poppins, Helvetica' }}
              >
                {point.month?.substring(0, 3) || `${index + 1}`}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  // Si showCard est false, retourner seulement le graphique
  if (!showCard) {
    return <ChartSVG />;
  }

  // Sinon, retourner la Card complète avec titre et sélecteur
  return (
    <Card className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-[14px] shadow-[6px_6px_54px_#0000000d] border-0`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`font-bold ${isDark ? 'text-gray-100' : 'text-[#19294a]'} text-2xl`} style={{ fontFamily: 'Poppins, Helvetica' }}>
            {t('dashboard.commercial.revenueEvolution')}
          </h2>
          {selectedYear !== undefined && onYearChange && (
            <select 
              value={selectedYear}
              onChange={(e) => onYearChange(parseInt(e.target.value))}
              className={`w-[104px] h-[28px] ${isDark ? 'bg-gray-700 text-gray-100 border-gray-600' : 'bg-[#fcfcfc] text-gray-900 border-neutral-300'} rounded border-[0.6px] border-solid px-2 text-sm font-medium`}
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Revenue Chart - Line Chart with Area */}
        <div className="relative w-full" style={{ marginLeft: '-24px', marginRight: '-24px', paddingLeft: '24px', paddingRight: '24px' }}>
          <ChartSVG />
        </div>
      </CardContent>
    </Card>
  );
};

