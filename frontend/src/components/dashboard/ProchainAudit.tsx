import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';

interface Auditor {
  name: string;
  contact?: string;
  phone?: string;
}

interface Audit {
  id?: number;
  type: string;
  date: string;
  daysRemaining: number;
  status?: string;
  auditor?: Auditor;
  createdAt?: string;
}

interface ProchainAuditProps {
  audit?: Audit | null;
  onEditClick?: () => void;
  onScheduleClick?: () => void;
  primaryColor?: string;
}

export const ProchainAudit: React.FC<ProchainAuditProps> = ({
  audit,
  onEditClick,
  onScheduleClick,
  primaryColor = 'var(--color-primary)',
}) => {
  const { isDark } = useTheme();

  if (!audit) {
    return (
      <Card
        className={`border-2 ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-[var(--color-border-medium)] bg-[var(--color-bg-white)]'
        } rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)]`}
      >
        <CardHeader>
          <CardTitle
            className={`font-semibold text-[var(--text-xl)] text-center ${
              isDark ? 'text-white' : 'text-[var(--color-text-primary)]'
            }`}
            style={{ fontFamily: 'var(--font-primary)' }}
          >
            Prochain audit
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p
            className={`mb-4 ${isDark ? 'text-gray-300' : 'text-[var(--color-text-secondary)]'}`}
            style={{ fontFamily: 'var(--font-primary)' }}
          >
            Aucun audit programmé
          </p>
          <Button
            onClick={onScheduleClick}
            className="text-white hover:opacity-90"
            style={{ backgroundColor: primaryColor, fontFamily: 'var(--font-primary)' }}
          >
            Planifier un audit
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <Card
      className={`border-2 ${
        isDark
          ? 'border-gray-700 bg-gray-800'
          : 'border-[var(--color-success)] bg-[var(--color-bg-white)]'
      } rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)]`}
    >
      <CardHeader>
        <CardTitle
          className={`font-semibold text-[var(--text-xl)] text-center ${
            isDark ? 'text-white' : 'text-[var(--color-text-primary)]'
          }`}
          style={{ fontFamily: 'var(--font-primary)' }}
        >
          Prochain audit
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {/* Countdown Badge */}
        <div
          className={`flex items-center justify-center px-6 py-0.5 rounded-[var(--radius-xl)] ${
            isDark ? 'bg-orange-900/40' : 'bg-[var(--color-orange-light)]'
          }`}
        >
          <span
            className={`font-semibold text-[var(--text-xl)] ${
              isDark ? 'text-orange-400' : 'text-[var(--color-orange)]'
            }`}
            style={{ fontFamily: 'var(--font-primary)' }}
          >
            J - {audit.daysRemaining}
          </span>
        </div>

        {/* Audit Details Card */}
        <Card
          className={`border-2 ${
            isDark ? 'border-gray-700 bg-gray-700' : 'border-[var(--color-border-medium)] bg-[var(--color-bg-white)]'
          } rounded-[var(--radius-xl)]`}
        >
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span
                className={`font-semibold text-[var(--text-xl)] ${
                  isDark ? 'text-white' : 'text-[var(--color-text-primary)]'
                }`}
                style={{ fontFamily: 'var(--font-primary)' }}
              >
                {audit.type}
              </span>
              <span
                className={`font-semibold text-[var(--text-xl)] ${
                  isDark ? 'text-gray-300' : 'text-[var(--color-text-secondary)]'
                }`}
                style={{ fontFamily: 'var(--font-primary)' }}
              >
                {formatDate(audit.date)}
              </span>
              {audit.auditor && (
                <span
                  className={`font-normal text-sm mt-1 ${
                    isDark ? 'text-gray-400' : 'text-[var(--color-text-secondary)]'
                  }`}
                  style={{ fontFamily: 'var(--font-primary)' }}
                >
                  {audit.auditor.name}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={onEditClick}
                aria-label="Edit audit"
              >
                📝
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={onScheduleClick}
                aria-label="Schedule audit"
              >
                📅
              </Button>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};
