import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';

interface SystemeQualiteCardProps {
  totalDocuments: number;
  procedures: number;
  models: number;
  evidences: number;
  onAddProcedure?: () => void;
  onAddModel?: () => void;
  onAddEvidence?: () => void;
}

export const SystemeQualiteCard: React.FC<SystemeQualiteCardProps> = ({
  totalDocuments,
  procedures,
  models,
  evidences,
  onAddProcedure,
  onAddModel,
  onAddEvidence,
}) => {
  const { isDark } = useTheme();

  // Calculate percentages for the donut chart
  const total = totalDocuments || 1;
  const procPercent = (procedures / total) * 100;
  const modelPercent = (models / total) * 100;
  const evidencePercent = (evidences / total) * 100;

  // SVG donut chart calculations
  const circumference = 2 * Math.PI * 40;
  const procOffset = circumference - (procPercent / 100) * circumference;
  const modelOffset = procOffset - (modelPercent / 100) * circumference;
  const evidenceOffset = modelOffset - (evidencePercent / 100) * circumference;

  return (
    <Card
      className={`border-2 ${
        isDark ? 'border-gray-700 bg-gray-800' : 'border-[var(--color-border-medium)] bg-[var(--color-bg-white)]'
      } rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)]`}
    >
      <CardHeader className="pb-[29px]">
        <CardTitle
          className={`font-semibold text-[var(--text-xl)] ${
            isDark ? 'text-white' : 'text-[var(--color-text-primary)]'
          }`}
          style={{ fontFamily: 'var(--font-primary)' }}
        >
          Système Qualité
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row gap-[29px]">
        {/* Donut Chart Section */}
        <div className="flex flex-col items-center gap-[12.51px] min-w-fit">
          <div className="relative w-[127px] h-[127px]">
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 100 100"
              aria-label="Document distribution chart"
            >
              <defs>
                <linearGradient id="procedureGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--color-orange)" />
                  <stop offset="100%" stopColor="var(--color-orange-dark)" />
                </linearGradient>
                <linearGradient id="modelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--color-success)" />
                  <stop offset="100%" stopColor="#2dd4bf" />
                </linearGradient>
                <linearGradient id="evidenceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--color-warning)" />
                  <stop offset="100%" stopColor="#e5f3a0" />
                </linearGradient>
              </defs>

              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={isDark ? '#374151' : 'var(--color-bg-light)'}
                strokeWidth="8"
              />

              {/* Procedures arc */}
              {procedures > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#procedureGradient)"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={procOffset}
                  strokeLinecap="round"
                />
              )}

              {/* Models arc */}
              {models > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#modelGradient)"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={modelOffset}
                  strokeLinecap="round"
                />
              )}

              {/* Evidences arc */}
              {evidences > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#evidenceGradient)"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={evidenceOffset}
                  strokeLinecap="round"
                />
              )}
            </svg>

            {/* Center label */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div
                className={`font-semibold text-lg ${
                  isDark ? 'text-white' : 'text-[var(--color-text-primary)]'
                }`}
                style={{ fontFamily: 'var(--font-primary)' }}
              >
                {totalDocuments}
              </div>
              <div
                className={`font-normal text-xs ${
                  isDark ? 'text-gray-300' : 'text-[var(--color-text-primary)]'
                }`}
                style={{ fontFamily: 'var(--font-primary)' }}
              >
                document{totalDocuments !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-start gap-[5.09px] justify-center">
            <div className="flex items-center gap-[6.79px]">
              <div className="bg-[var(--color-orange)] rounded-full w-2 h-2" />
              <span
                className={`font-normal text-[8.6px] ${
                  isDark ? 'text-gray-300' : 'text-[var(--color-text-primary)]'
                }`}
                style={{ fontFamily: 'var(--font-primary)' }}
              >
                {procedures} Procédure{procedures !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-[6.79px]">
              <div className="bg-[var(--color-success)] rounded-full w-2 h-2" />
              <span
                className={`font-normal text-[8.6px] ${
                  isDark ? 'text-gray-300' : 'text-[var(--color-text-primary)]'
                }`}
                style={{ fontFamily: 'var(--font-primary)' }}
              >
                {models} Modèle{models !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-[6.79px]">
              <div className="bg-[var(--color-warning)] rounded-full w-2 h-2" />
              <span
                className={`font-normal text-[8.6px] ${
                  isDark ? 'text-gray-300' : 'text-[var(--color-text-primary)]'
                }`}
                style={{ fontFamily: 'var(--font-primary)' }}
              >
                {evidences} Preuve{evidences !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Document Types Sections */}
        <div className="flex flex-col md:flex-row gap-8 flex-1">
          {/* Procedures */}
          <div className="flex flex-col gap-3.5 flex-1">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <div className="bg-[var(--color-orange)] rounded-full w-2 h-2" />
                <span
                  className={`font-semibold text-[10.4px] ${
                    isDark ? 'text-white' : 'text-[var(--color-text-primary)]'
                  }`}
                  style={{ fontFamily: 'var(--font-primary)' }}
                >
                  Procédures
                </span>
              </div>
              <p
                className={`font-normal text-xs ${
                  isDark ? 'text-gray-400' : 'text-[var(--color-text-tertiary)]'
                }`}
                style={{ fontFamily: 'var(--font-primary)' }}
              >
                Objectif Qualité : Au Moins 1 Modèle Doit Être Associé À Chaque Indicateur.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={onAddProcedure}
              className={`h-auto px-3 py-1 rounded-[var(--radius-full)] border-[0.72px] font-medium text-[9.1px] ${
                isDark
                  ? 'bg-gray-700 border-blue-500 text-blue-400 hover:bg-gray-600'
                  : 'bg-[var(--color-primary-light)] border-[var(--color-primary)] text-[var(--color-primary)]'
              }`}
              style={{ fontFamily: 'var(--font-primary)' }}
            >
              Ajouter Ma Procédure
            </Button>
          </div>

          {/* Models */}
          <div className="flex flex-col justify-between flex-1">
            <div className="flex flex-col gap-[9px]">
              <div className="flex items-center gap-2.5">
                <div className="bg-[var(--color-success)] rounded-full w-2 h-2" />
                <span
                  className={`font-semibold text-[10.4px] ${
                    isDark ? 'text-white' : 'text-[var(--color-text-primary)]'
                  }`}
                  style={{ fontFamily: 'var(--font-primary)' }}
                >
                  Modèles
                </span>
              </div>
              <p
                className={`font-normal text-xs ${
                  isDark ? 'text-gray-400' : 'text-[var(--color-text-tertiary)]'
                }`}
                style={{ fontFamily: 'var(--font-primary)' }}
              >
                Objectif Qualité : Au Moins 1 Modèle Doit Être Associé À Chaque Indicateur.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={onAddModel}
              className={`h-auto px-3 py-1 rounded-[var(--radius-full)] border-[0.72px] font-medium text-[9.1px] ${
                isDark
                  ? 'bg-gray-700 border-blue-500 text-blue-400 hover:bg-gray-600'
                  : 'bg-[var(--color-primary-light)] border-[var(--color-primary)] text-[var(--color-primary)]'
              }`}
              style={{ fontFamily: 'var(--font-primary)' }}
            >
              Ajouter Ma Première Modèles
            </Button>
          </div>

          {/* Evidence */}
          <div className="flex flex-col justify-between flex-1">
            <div className="flex flex-col gap-[9px]">
              <div className="flex items-center gap-2.5">
                <div className="bg-[var(--color-warning)] rounded-full w-2 h-2" />
                <span
                  className={`font-semibold text-[10.4px] ${
                    isDark ? 'text-white' : 'text-[var(--color-text-primary)]'
                  }`}
                  style={{ fontFamily: 'var(--font-primary)' }}
                >
                  Preuves
                </span>
              </div>
              <p
                className={`font-normal text-xs ${
                  isDark ? 'text-gray-400' : 'text-[var(--color-text-tertiary)]'
                }`}
                style={{ fontFamily: 'var(--font-primary)' }}
              >
                Objectif Qualité : Au Moins 1 Preuve Doit Être Associée À Chaque Indicateur.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={onAddEvidence}
              className={`h-auto px-3 py-1 rounded-[var(--radius-full)] border-[0.72px] font-medium text-[9.1px] ${
                isDark
                  ? 'bg-gray-700 border-blue-500 text-blue-400 hover:bg-gray-600'
                  : 'bg-[var(--color-primary-light)] border-[var(--color-primary)] text-[var(--color-primary)]'
              }`}
              style={{ fontFamily: 'var(--font-primary)' }}
            >
              Ajouter Ma Première Preuves
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
