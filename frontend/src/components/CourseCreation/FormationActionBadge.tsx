import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface FormationActionBadgeProps {
  selectedAction: string;
  onActionChange: (action: string) => void;
}

const formationActions = [
  "Actions de formation",
  "Bilan de compétences",
  "VAE (Validation des Acquis de l'Expérience)",
  "Actions de formation par apprentissage",
  "Autre..."
];

export const FormationActionBadge: React.FC<FormationActionBadgeProps> = ({
  selectedAction,
  onActionChange
}) => {
  const { isDark } = useTheme();
  const [showOptions, setShowOptions] = useState(false);
  const badgeRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        badgeRef.current &&
        !badgeRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowOptions(false);
      }
    };

    if (showOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOptions]);

  // Calculate dropdown position
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);

  const handleBadgeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left
      });
    }
    setShowOptions(!showOptions);
  };

  const handleOptionSelect = (action: string) => {
    onActionChange(action);
    setShowOptions(false);
  };

  return (
    <div className="flex items-center gap-3">
      <label className={`text-sm font-medium whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        Catégorie D'actions De Formation :
      </label>
      
      <div className="relative inline-block" ref={badgeRef}>
        <button
          type="button"
          onClick={handleBadgeClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#DBEAFE] text-[#2563EB] border border-[#93C5FD] rounded-lg text-sm font-medium hover:bg-[#BFDBFE] transition-colors"
          style={{
            display: 'inline-flex',
            padding: '8px 16px',
            background: '#DBEAFE',
            color: '#2563EB',
            border: '1px solid #93C5FD',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          <span>{selectedAction || "Actions de formation"}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showOptions ? 'rotate-180' : ''}`} />
        </button>

        {showOptions && dropdownPosition && (
          <div
            ref={dropdownRef}
            className={`fixed z-50 mt-1 min-w-[280px] rounded-lg shadow-lg border ${
              isDark 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-1">
              {formationActions.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => handleOptionSelect(action)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    action === selectedAction
                      ? 'bg-[#DBEAFE] text-[#2563EB] font-medium'
                      : isDark
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

