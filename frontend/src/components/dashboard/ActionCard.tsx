import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { useTheme } from '../../contexts/ThemeContext';

interface Category {
  name?: string;
  color?: string;
}

interface Task {
  id: number | string;
  title: string;
  description?: string;
  category?: Category | string;
  subcategory?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'todo' | 'in_progress' | 'done';
  dueDate?: string;
}

interface ActionCardProps {
  task: Task;
  onClick?: (task: Task) => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({ task, onClick }) => {
  const { isDark } = useTheme();

  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case 'low':
        return 'Faible';
      case 'medium':
        return 'Moyenne';
      case 'high':
        return 'Élevée';
      case 'urgent':
        return 'Urgente';
      default:
        return priority;
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'done':
        return '✓ Terminée';
      case 'in_progress':
        return 'En cours';
      case 'todo':
        return 'À faire';
      default:
        return status;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const category = task.category as Category | undefined;
  const categoryName = typeof task.category === 'string' ? task.category : category?.name;
  const categoryColor = typeof task.category === 'object' ? category?.color || '#306bff' : '#306bff';

  return (
    <Card
      className={`border ${
        isDark ? 'border-gray-600 bg-gray-700' : 'border-[var(--color-border-dark)] bg-[var(--color-bg-white)]'
      } rounded-[var(--radius-lg)] cursor-pointer hover:border-[var(--color-primary)] transition-colors`}
      onClick={() => onClick?.(task)}
    >
      <CardContent className="p-[18px] flex flex-col gap-1">
        {/* Badges Row */}
        <div className="flex items-center flex-wrap gap-3.5">
          {/* Category Badge */}
          {categoryName && (
            <Badge
              className={`h-auto px-1 py-[3px] rounded-[3.59px] font-medium text-[13px] tracking-[0.20px] ${
                isDark ? 'bg-gray-600 text-white' : 'bg-[var(--color-bg-light)] text-slate-800'
              }`}
              style={{ fontFamily: 'var(--font-primary)' }}
            >
              <div
                className="w-2 h-2 mr-2 rounded-full"
                style={{ backgroundColor: categoryColor }}
              />
              {categoryName}
            </Badge>
          )}

          {/* Subcategory Badge */}
          {task.subcategory && (
            <Badge
              className={`h-auto px-1 py-[3px] rounded-[3.59px] font-medium text-[10.8px] ${
                isDark
                  ? 'bg-blue-900/40 text-blue-300'
                  : 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
              }`}
              style={{ fontFamily: 'var(--font-secondary)' }}
            >
              {task.subcategory}
            </Badge>
          )}

          {/* Priority Badge */}
          {task.priority && (
            <Badge
              className={`h-auto px-[5px] py-1 rounded-[3.59px] font-medium text-[10.8px] ${
                isDark
                  ? 'bg-orange-900/40 text-orange-300'
                  : 'bg-[var(--color-orange-light)] text-[var(--color-orange)]'
              }`}
              style={{ fontFamily: 'var(--font-secondary)' }}
            >
              {getPriorityLabel(task.priority)}
            </Badge>
          )}

          {/* Status Badge (only if not 'todo') */}
          {task.status && task.status !== 'todo' && (
            <Badge
              className={`h-auto px-[5px] py-1 rounded-[3.59px] font-medium text-[10.8px] ${
                isDark ? 'bg-gray-600 text-gray-200' : getStatusColor(task.status)
              }`}
              style={{ fontFamily: 'var(--font-secondary)' }}
            >
              {getStatusLabel(task.status)}
            </Badge>
          )}
        </div>

        {/* Task Details */}
        <div className="flex flex-col gap-[5px]">
          <h3
            className={`font-semibold text-[16.1px] ${
              isDark ? 'text-white' : 'text-[var(--color-text-black)]'
            }`}
            style={{ fontFamily: 'var(--font-secondary)' }}
          >
            {task.title}
          </h3>
          <p
            className={`font-normal text-[10.8px] ${
              isDark ? 'text-gray-400' : 'text-[var(--color-text-muted)]'
            }`}
            style={{ fontFamily: 'var(--font-secondary)' }}
          >
            {task.description || 'Aucune description'}
          </p>
        </div>

        {/* Due Date (if provided) */}
        {task.dueDate && (
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`text-xs ${isDark ? 'text-gray-400' : 'text-[var(--color-text-muted)]'}`}
              style={{ fontFamily: 'var(--font-secondary)' }}
            >
              Échéance: {new Date(task.dueDate).toLocaleDateString('fr-FR')}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
