import React from 'react';
import { AlertCircle, Lock } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';

interface UnauthorizedMessageProps {
  /**
   * Message personnalisé à afficher
   */
  message?: string;
  
  /**
   * Taille du message (sm, md, lg)
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Style inline ou block
   */
  variant?: 'inline' | 'block';
  
  /**
   * Classes CSS supplémentaires
   */
  className?: string;
}

/**
 * Composant pour afficher un message de non-autorisation
 */
export const UnauthorizedMessage: React.FC<UnauthorizedMessageProps> = ({
  message,
  size = 'md',
  variant = 'inline',
  className,
}) => {
  const { t } = useLanguage();

  const defaultMessage = t('permissions.unauthorized') || 'Vous n\'avez pas la permission d\'effectuer cette action.';

  const sizeClasses = {
    sm: 'text-xs p-2',
    md: 'text-sm p-3',
    lg: 'text-base p-4',
  };

  const variantClasses = {
    inline: 'inline-flex',
    block: 'flex w-full',
  };

  return (
    <div
      className={cn(
        'items-center gap-2 rounded-md border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      role="alert"
    >
      <Lock className="h-4 w-4 flex-shrink-0" />
      <span>{message || defaultMessage}</span>
    </div>
  );
};

