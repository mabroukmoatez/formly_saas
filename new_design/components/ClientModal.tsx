import { useState } from 'react';
import ClientParticulier from '../imports/Frame17-1-3807';
import ClientProfessionnel from '../imports/Frame17-1-4744';

interface ClientModalProps {
  onClose?: () => void;
}

export function ClientModal({ onClose }: ClientModalProps) {
  const [isProfessional, setIsProfessional] = useState(false);

  return (
    <div 
      className="relative w-full h-full" 
      onClick={(e) => {
        // Check if toggle was clicked
        const target = e.target as HTMLElement;
        const toggleElement = target.closest('[data-name="Toggle"]');
        if (toggleElement) {
          setIsProfessional(!isProfessional);
          return;
        }

        // Check if close button (X icon) was clicked
        const svgElement = target.closest('svg');
        const parentDiv = svgElement?.parentElement?.parentElement;
        
        if (parentDiv && (
          parentDiv.classList.contains('absolute') && 
          parentDiv.style.getPropertyValue('left') === '893px'
        )) {
          if (onClose) {
            onClose();
          }
        }
      }}
    >
      {isProfessional ? <ClientProfessionnel /> : <ClientParticulier />}
    </div>
  );
}