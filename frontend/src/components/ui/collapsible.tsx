import React, { useState, createContext, useContext } from 'react';
import { Card, CardContent } from './card';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { ChevronDown, ChevronRight, CheckCircle } from 'lucide-react';

interface CollapsibleContextType {
  isOpen: boolean;
  toggle: () => void;
}

const CollapsibleContext = createContext<CollapsibleContextType | undefined>(undefined);

interface CollapsibleProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const Collapsible: React.FC<CollapsibleProps> = ({
  children,
  defaultOpen = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const toggle = () => setIsOpen(!isOpen);

  return (
    <CollapsibleContext.Provider value={{ isOpen, toggle }}>
      <div className={className}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
};

interface CollapsibleTriggerProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export const CollapsibleTrigger: React.FC<CollapsibleTriggerProps> = ({
  children,
  className = '',
  asChild = false,
}) => {
  const context = useContext(CollapsibleContext);
  if (!context) {
    throw new Error('CollapsibleTrigger must be used within a Collapsible');
  }

  const { toggle } = context;

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: toggle,
      className: `${children.props.className || ''} ${className}`,
    });
  }

  return (
    <button
      onClick={toggle}
      className={className}
      type="button"
    >
      {children}
    </button>
  );
};

interface CollapsibleContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CollapsibleContent: React.FC<CollapsibleContentProps> = ({
  children,
  className = '',
}) => {
  const context = useContext(CollapsibleContext);
  if (!context) {
    throw new Error('CollapsibleContent must be used within a Collapsible');
  }

  const { isOpen } = context;

  if (!isOpen) return null;

  return (
    <div className={className}>
      {children}
    </div>
  );
};

// Legacy single component for backward compatibility
interface LegacyCollapsibleProps {
  id: string;
  title: string;
  children: React.ReactNode;
  isExpanded?: boolean;
  onToggle?: (id: string, isExpanded: boolean) => void;
  hasData?: boolean;
  icon?: React.ReactNode;
  showCheckmark?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  disabled?: boolean;
}

export const LegacyCollapsible: React.FC<LegacyCollapsibleProps> = ({
  id,
  title,
  children,
  isExpanded = false,
  onToggle,
  hasData = false,
  icon,
  showCheckmark = true,
  className = '',
  headerClassName = '',
  contentClassName = '',
  disabled = false,
}) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const [internalExpanded, setInternalExpanded] = useState(isExpanded);
  
  const primaryColor = organization?.primary_color || '#007aff';
  const expanded = onToggle ? isExpanded : internalExpanded;

  const handleToggle = () => {
    if (disabled) return;
    
    const newExpanded = !expanded;
    if (onToggle) {
      onToggle(id, newExpanded);
    } else {
      setInternalExpanded(newExpanded);
    }
  };

  return (
    <Card 
      className={`rounded-[18px] shadow-[0px_0px_75.7px_#19294a17] transition-all duration-200 ${
        isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#dbd8d8]'
      } ${className}`}
    >
      <CardContent className="p-5 flex flex-col gap-4">
        {/* Header */}
        <div 
          className={`flex items-center justify-between px-[17px] py-3 rounded-[18px] border border-solid cursor-pointer transition-all ${
            isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-[#e2e2ea]'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'} ${headerClassName}`}
          onClick={handleToggle}
        >
          <div className="inline-flex items-center gap-3">
            <div className="inline-flex items-center gap-2">
              {showCheckmark && (
                <div 
                  className={`w-[17px] h-[17px] rounded-[8.5px] border-2 border-solid flex items-center justify-center transition-colors ${
                    hasData 
                      ? 'bg-green-500 border-green-500' 
                      : isDark 
                        ? 'bg-gray-600 border-gray-500' 
                        : 'bg-gray-200 border-[#e2e2ea]'
                  }`}
                >
                  {hasData && (
                    <CheckCircle className="w-3 h-3 text-white" />
                  )}
                </div>
              )}
              <span className={`[font-family:'Poppins',Helvetica] font-medium text-[17px] ${
                isDark ? 'text-white' : 'text-[#19294a]'
              }`}>
                {title}:
              </span>
              {icon && (
                <div className="flex items-center">
                  {icon}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronDown 
                className="w-5 h-5 transition-transform duration-200"
                style={{ color: primaryColor }}
              />
            ) : (
              <ChevronRight 
                className="w-5 h-5 transition-transform duration-200"
                style={{ color: primaryColor }}
              />
            )}
          </div>
        </div>

        {/* Content */}
        {expanded && (
          <div className={`transition-all duration-200 ${contentClassName}`}>
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Compound component for easier usage
export const CollapsibleSection: React.FC<{
  title: string;
  children: React.ReactNode;
  hasData?: boolean;
  icon?: React.ReactNode;
  className?: string;
}> = ({ title, children, hasData = false, icon, className = '' }) => {
  return (
    <div className={`px-[17px] py-3 rounded-[18px] border border-solid ${
      hasData ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
    } ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="font-medium text-sm text-gray-700">{title}</span>
        {icon}
      </div>
      {children}
    </div>
  );
};