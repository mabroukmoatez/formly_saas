import CompanyForm from '../imports/Frame17-4-8151';

interface CompanyModalProps {
  onClose?: () => void;
}

export function CompanyModal({ onClose }: CompanyModalProps) {
  return (
    <div 
      className="relative w-full h-full" 
      onClick={(e) => {
        // Check if close button (X icon) was clicked
        const target = e.target as HTMLElement;
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
      <CompanyForm />
    </div>
  );
}
