/**
 * OverrideIndicator Component
 * 
 * Visual indicator to show if a field is inherited from the course template
 * or has been overridden for this specific session.
 * 
 * Usage:
 * <OverrideIndicator
 *   isInherited={isFieldInherited('title')}
 *   originalValue={courseTemplate?.title}
 *   onReset={() => resetOverride('title')}
 * />
 */

import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { RotateCcw, Link2, Pencil } from 'lucide-react';

interface OverrideIndicatorProps {
  /** Whether the field is inherited from the course template */
  isInherited: boolean;
  /** The original value from the course template (for display in tooltip) */
  originalValue?: string | number | null;
  /** Callback to reset the field to the course template value */
  onReset?: () => void;
  /** Whether to show the reset button */
  showResetButton?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Show only when modified */
  showOnlyWhenModified?: boolean;
  /** Custom class name */
  className?: string;
}

export const OverrideIndicator: React.FC<OverrideIndicatorProps> = ({
  isInherited,
  originalValue,
  onReset,
  showResetButton = true,
  size = 'sm',
  showOnlyWhenModified = false,
  className = ''
}) => {
  // Don't render if showing only when modified and it's inherited
  if (showOnlyWhenModified && isInherited) {
    return null;
  }

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const badgePadding = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  // Build tooltip text
  const getTooltipText = () => {
    if (isInherited) {
      let text = 'Valeur héritée du cours template';
      if (originalValue) {
        const valueStr = String(originalValue);
        text += ` | Valeur: ${valueStr.substring(0, 50)}${valueStr.length > 50 ? '...' : ''}`;
      }
      return text;
    }
    let text = 'Valeur personnalisée pour cette session';
    if (originalValue) {
      const valueStr = String(originalValue);
      text += ` | Original: ${valueStr.substring(0, 50)}${valueStr.length > 50 ? '...' : ''}`;
    }
    return text;
  };

  if (isInherited) {
    return (
      <Badge 
        variant="outline" 
        className={`${badgePadding} ${textSize} bg-blue-50 text-blue-600 border-blue-200 cursor-help ${className}`}
        title={getTooltipText()}
      >
        <Link2 className={`${iconSize} mr-1`} />
        Hérité
      </Badge>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Badge 
        variant="outline" 
        className={`${badgePadding} ${textSize} bg-orange-50 text-orange-600 border-orange-200 cursor-help`}
        title={getTooltipText()}
      >
        <Pencil className={`${iconSize} mr-1`} />
        Modifié
      </Badge>
      
      {showResetButton && onReset && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600"
          onClick={onReset}
          title="Revenir à la valeur du cours"
        >
          <RotateCcw className={iconSize} />
        </Button>
      )}
    </div>
  );
};

/**
 * OverrideFieldWrapper Component
 * 
 * Wraps a form field with override indicator and optional label
 */
interface OverrideFieldWrapperProps {
  children: React.ReactNode;
  label?: string;
  isInherited: boolean;
  originalValue?: string | number | null;
  onReset?: () => void;
  showIndicator?: boolean;
  required?: boolean;
  className?: string;
}

export const OverrideFieldWrapper: React.FC<OverrideFieldWrapperProps> = ({
  children,
  label,
  isInherited,
  originalValue,
  onReset,
  showIndicator = true,
  required = false,
  className = ''
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {showIndicator && (
            <OverrideIndicator
              isInherited={isInherited}
              originalValue={originalValue}
              onReset={onReset}
              showOnlyWhenModified
            />
          )}
        </div>
      )}
      {children}
    </div>
  );
};

/**
 * SectionOverrideHeader Component
 * 
 * Header for a section with "Reset all to template" button
 */
interface SectionOverrideHeaderProps {
  title: string;
  description?: string;
  hasOverrides: boolean;
  onResetAll?: () => void;
  className?: string;
}

export const SectionOverrideHeader: React.FC<SectionOverrideHeaderProps> = ({
  title,
  description,
  hasOverrides,
  onResetAll,
  className = ''
}) => {
  return (
    <div className={`flex items-start justify-between ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      
      {hasOverrides && onResetAll && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
          onClick={onResetAll}
          title="Supprimer toutes les modifications et revenir aux valeurs du cours"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Réinitialiser depuis le template
        </Button>
      )}
    </div>
  );
};

/**
 * InheritedBanner Component
 * 
 * Banner to show at the top of a section when viewing inherited data
 */
interface InheritedBannerProps {
  courseName?: string;
  isVisible?: boolean;
  onCustomize?: () => void;
}

export const InheritedBanner: React.FC<InheritedBannerProps> = ({
  courseName,
  isVisible = true,
  onCustomize
}) => {
  if (!isVisible) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-700">
          <Link2 className="w-4 h-4" />
          <span className="text-sm">
            Ces données sont héritées du cours template
            {courseName && <strong className="ml-1">"{courseName}"</strong>}
          </span>
        </div>
        {onCustomize && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-blue-600 border-blue-300 hover:bg-blue-100"
            onClick={onCustomize}
          >
            <Pencil className="w-3 h-3 mr-1" />
            Personnaliser
          </Button>
        )}
      </div>
    </div>
  );
};

export default OverrideIndicator;
