import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';

interface Indicator {
  id: number | string;
  number: number;
  status?: 'completed' | 'in_progress' | 'not_started';
  isApplicable?: boolean;
  hasOverlay?: boolean;
}

interface IndicateursQualiopiProps {
  indicators: Indicator[];
  onIndicatorClick?: (indicator: Indicator) => void;
  onSettingsClick?: () => void;
}

export const IndicateursQualiopi: React.FC<IndicateursQualiopiProps> = ({
  indicators,
  onIndicatorClick,
  onSettingsClick,
}) => {
  const { isDark } = useTheme();

  return (
    <Card
      className={`border-2 ${
        isDark ? 'border-gray-700 bg-gray-800' : 'border-[var(--color-border-medium)] bg-[var(--color-bg-white)]'
      } rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)]`}
    >
      <CardHeader>
        <CardTitle
          className={`font-semibold text-[var(--text-xl)] ${
            isDark ? 'text-white' : 'text-[var(--color-text-primary)]'
          }`}
          style={{ fontFamily: 'var(--font-primary)' }}
        >
          Indicateurs Qualiopi
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Indicators Grid - Responsive: 8 cols (desktop), 4 cols (tablet), 2 cols (mobile) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {indicators.map((indicator) => {
            const isApplicable = indicator.isApplicable !== false;
            const isCompleted = indicator.status === 'completed';
            const indicatorPercentage = isApplicable ? 100 : 0;

            return (
              <div
                key={indicator.id || indicator.number}
                onClick={() => onIndicatorClick?.(indicator)}
                className={`relative flex flex-col items-center justify-center w-16 h-16 rounded-full border-[3.49px] cursor-pointer transition-all ${
                  isCompleted
                    ? 'border-[var(--color-success)] bg-[var(--color-success)]/10'
                    : isDark
                    ? 'border-gray-600 hover:border-orange-500'
                    : 'border-[var(--color-bg-light)] hover:border-[var(--color-orange)]'
                }`}
                title={`Indicateur ${indicator.number} - ${indicatorPercentage}% applicable`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onIndicatorClick?.(indicator);
                  }
                }}
              >
                {/* Circular progress indicator */}
                <svg
                  className="absolute inset-0 w-full h-full transform -rotate-90"
                  viewBox="0 0 100 100"
                  aria-hidden="true"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={
                      isApplicable
                        ? 'var(--color-primary)'
                        : isDark
                        ? '#4b5563'
                        : 'var(--color-bg-light)'
                    }
                    strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - indicatorPercentage / 100)}`}
                    className="transition-all"
                  />
                </svg>

                {/* Indicator Number */}
                <span
                  className={`relative z-10 font-semibold text-[12.4px] text-center ${
                    isCompleted
                      ? 'text-[var(--color-success)]'
                      : isApplicable
                      ? isDark
                        ? 'text-blue-400'
                        : 'text-[var(--color-primary)]'
                      : isDark
                      ? 'text-gray-500'
                      : 'text-gray-400'
                  }`}
                  style={{ fontFamily: 'var(--font-primary)' }}
                >
                  {indicator.number}
                </span>

                {/* Completion Badge */}
                {indicator.hasOverlay && isCompleted && (
                  <div
                    className="absolute top-0 right-0 w-3 h-3 rounded-full border-2 z-20"
                    style={{
                      backgroundColor: 'var(--color-success)',
                      borderColor: isDark ? '#1f2937' : 'var(--color-bg-white)',
                    }}
                    aria-label="Completed"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Settings Button */}
        <Button
          variant="outline"
          onClick={onSettingsClick}
          className={`h-auto px-[14.44px] py-[7.94px] rounded-[var(--radius-sm)] border-[0.72px] border-dashed self-start ${
            isDark
              ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
              : 'bg-[var(--color-border-light)] border-[var(--color-text-secondary)]'
          }`}
        >
          <span
            className={`font-semibold text-sm ${
              isDark ? 'text-gray-300' : 'text-[var(--color-text-secondary)]'
            }`}
            style={{ fontFamily: 'var(--font-primary)' }}
          >
            Paramètres Des Indicateurs
          </span>
        </Button>
      </CardContent>
    </Card>
  );
};
