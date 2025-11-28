import React, { useState, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ChartDataPoint } from '../../services/commercialDashboard.types';
import { Card, CardContent } from '../ui/card';
import { Loader2 } from 'lucide-react';

interface RevenueLineChartProps {
  data: ChartDataPoint[];
  height?: number;
  primaryColor?: string;
  selectedYear?: number;
  onYearChange?: (year: number) => void;
  showCard?: boolean;
  isLoading?: boolean;
}

export const RevenueLineChart: React.FC<RevenueLineChartProps> = ({
  data,
  height = 256,
  primaryColor = '#007aff',
  selectedYear,
  onYearChange,
  showCard = true,
  isLoading = false,
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

  // Noms des mois en français
  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const fullMonthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  // Calculer une échelle dynamique basée sur les valeurs
  const calculateScale = (values: number[]): { step: number; maxScale: number } => {
    if (values.length === 0) return { step: 2000, maxScale: 10000 };

    const maxValue = Math.max(...values);
    if (maxValue === 0) return { step: 2000, maxScale: 10000 };

    // Target roughly 5 steps
    const rawStep = maxValue / 4.5;

    // Round to a nice number (1, 2, 5, 10) * magnitude
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const residual = rawStep / magnitude;

    let niceResidual;
    if (residual <= 1) niceResidual = 1;
    else if (residual <= 2) niceResidual = 2;
    else if (residual <= 5) niceResidual = 5;
    else niceResidual = 10;

    const step = niceResidual * magnitude;
    const maxScale = Math.ceil(maxValue / step) * step;

    return { step, maxScale };
  };

  // Préparer les données pour le graphique
  const chartData = useMemo(() => {
    // Créer un tableau de 12 mois avec des valeurs par défaut à 0
    const monthsData: Array<{ value: number; month: string; fullMonth: string }> = [];

    for (let i = 0; i < 12; i++) {
      monthsData.push({
        value: 0,
        month: monthNames[i],
        fullMonth: fullMonthNames[i],
      });
    }

    // Remplir avec les données réelles si disponibles
    if (data && data.length > 0) {
      data.forEach((point) => {
        // Extraire le numéro du mois depuis point.month (format peut être "YYYY-MM" ou "MM" ou nom du mois)
        let monthIndex = -1;

        if (point.month) {
          // Si le format est "YYYY-MM" ou "MM"
          if (point.month.includes('-')) {
            const parts = point.month.split('-');
            if (parts.length >= 2) {
              monthIndex = parseInt(parts[1]) - 1; // MM est le mois (1-12), on soustrait 1 pour l'index (0-11)
            }
          } else if (/^\d+$/.test(point.month)) {
            // Si c'est juste un nombre
            monthIndex = parseInt(point.month) - 1;
          } else {
            // Si c'est un nom de mois, chercher l'index
            const monthLower = point.month.toLowerCase();
            monthIndex = fullMonthNames.findIndex(m => m.toLowerCase().includes(monthLower));
            if (monthIndex === -1) {
              monthIndex = monthNames.findIndex(m => m.toLowerCase().includes(monthLower));
            }
          }
        }

        // Si on a trouvé un mois valide (0-11), mettre à jour la valeur
        if (monthIndex >= 0 && monthIndex < 12) {
          monthsData[monthIndex].value = point.value || 0;
        }
      });
    }

    const values = monthsData.map((d) => d.value);
    const minValue = Math.min(...values, 0);

    // Calculer l'échelle dynamique
    const { step, maxScale } = calculateScale(values);
    const maxValue = maxScale;

    // Calculer les positions X et Y pour chaque point (12 mois)
    const points = monthsData.map((point, index) => {
      const x = padding.left + (index / 11) * innerWidth; // 11 car on a 12 points (0-11)
      const y =
        padding.top +
        innerHeight -
        ((point.value - minValue) / (maxValue - minValue || 1)) * innerHeight;
      return {
        x,
        y,
        value: point.value,
        month: point.month,
        fullMonth: point.fullMonth,
        originalIndex: index,
      };
    });

    // Créer le path pour la ligne
    const linePath = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

    // Créer le path pour l'area (ligne + bas)
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`;

    // Générer les labels de l'échelle pour l'axe Y
    const scaleLabels: number[] = [];
    for (let i = 0; i <= maxValue; i += step) {
      scaleLabels.push(i);
    }

    return {
      points,
      linePath,
      areaPath,
      maxValue,
      minValue,
      scaleStep: step,
      scaleLabels,
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
            {t('dashboard.commercial.chartComingSoon')}<br />
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
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
              <feOffset dx="0" dy="2" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
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

          {/* Grille horizontale sera générée avec les labels de l'échelle */}

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
                {chartData.points[hoveredIndex].fullMonth || chartData.points[hoveredIndex].month}
              </text>
            </g>
          )}

          {/* Labels des axes Y avec échelle dynamique */}
          {chartData.scaleLabels.map((scaleValue, index) => {
            const ratio = scaleValue / chartData.maxValue;
            const y = padding.top + innerHeight - ratio * innerHeight;
            return (
              <text
                key={`scale-${scaleValue}`}
                x={padding.left - 15}
                y={y + 4}
                textAnchor="end"
                fill={isDark ? '#94a3b8' : '#6a90b9'}
                fontSize="11"
                fontWeight="500"
                className="font-sans"
                style={{ fontFamily: 'Poppins, Helvetica' }}
              >
                {formatCurrency(scaleValue)}
              </text>
            );
          })}

          {/* Lignes de grille correspondant aux labels de l'échelle */}
          {chartData.scaleLabels.map((scaleValue) => {
            const ratio = scaleValue / chartData.maxValue;
            const y = padding.top + innerHeight - ratio * innerHeight;
            return (
              <line
                key={`grid-${scaleValue}`}
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

          {/* Labels des axes X (mois) - Afficher tous les 12 mois */}
          {chartData.points.map((point, index) => {
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
                {point.month}
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
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-lg">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('common.loading') || 'Chargement du graphique...'}
                </span>
              </div>
            </div>
          )}
          <ChartSVG />
        </div>
      </CardContent>
    </Card>
  );
};
