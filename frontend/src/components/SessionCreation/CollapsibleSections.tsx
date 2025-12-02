import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { ChevronDownIcon, InfoIcon } from 'lucide-react';
import { 
  ModulesSection, 
  ObjectivesSection, 
  TargetAudienceSection,
  PrerequisitesSection, 
  MethodsSection, 
  PricingSection, 
  SpecificsSection 
} from './SectionContent';

interface CollapsibleSection {
  id: number;
  title: string;
  icon: string;
  content?: React.ReactNode;
}

interface CollapsibleSectionsProps {
  sections: CollapsibleSection[];
  onSectionClick?: (sectionId: number) => void;
  // Data props
  modules: Array<{
    id: string;
    title: string;
    description: string;
    duration: number;
    order: number;
  }>;
  objectives: Array<{
    id: string;
    text: string;
    order: number;
  }>;
  targetAudience: string;
  prerequisites: string;
  methods: string;
  priceHT: number;
  vatPercentage: number;
  additionalFees: Array<{
    id: string;
    name: string;
    amount: number;
    vat_applied: boolean;
    unit: string;
  }>;
  specifics: string;
  // Handler props
  onAddModule: () => void;
  onUpdateModule: (id: string, field: string, value: any) => void;
  onRemoveModule: (id: string) => void;
  onReorderModules: (modules: any[]) => void;
  onAddObjective: () => void;
  onUpdateObjective: (id: string, field: string, value: any) => void;
  onRemoveObjective: (id: string) => void;
  onUpdateTargetAudience: (content: string) => void;
  onUpdatePrerequisites: (content: string) => void;
  onUpdateMethods: (content: string) => void;
  onUpdatePriceHT: (value: number) => void;
  onUpdateVATPercentage: (value: number) => void;
  onAddAdditionalFee: () => void;
  onUpdateAdditionalFee: (id: string, field: string, value: any) => void;
  onRemoveAdditionalFee: (id: string) => void;
  onUpdateSpecifics: (content: string) => void;
}

export const CollapsibleSections: React.FC<CollapsibleSectionsProps> = ({
  sections,
  onSectionClick,
  modules,
  objectives,
  targetAudience,
  prerequisites,
  methods,
  priceHT,
  vatPercentage,
  additionalFees,
  specifics,
  onAddModule,
  onUpdateModule,
  onRemoveModule,
  onReorderModules,
  onAddObjective,
  onUpdateObjective,
  onRemoveObjective,
  onUpdateTargetAudience,
  onUpdatePrerequisites,
  onUpdateMethods,
  onUpdatePriceHT,
  onUpdateVATPercentage,
  onAddAdditionalFee,
  onUpdateAdditionalFee,
  onRemoveAdditionalFee,
  onUpdateSpecifics,
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';

  const toggleSection = (sectionId: number) => {
    console.log('toggleSection called for section:', sectionId);
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
      console.log('Collapsing section:', sectionId);
    } else {
      newExpanded.add(sectionId);
      console.log('Expanding section:', sectionId);
    }
    setExpandedSections(newExpanded);
    onSectionClick?.(sectionId);
  };

  const defaultSections: CollapsibleSection[] = [
    {
      id: 1,
      title: t('sessionCreation.sections.modules'),
      icon: '/assets/icons/expand-module.png',
    },
    {
      id: 2,
      title: t('sessionCreation.sections.objectives'),
      icon: '/assets/icons/expand-objective.png',
    },
    {
      id: 3,
      title: "Public Visé",
      icon: '/assets/icons/expand-public.png',
    },
    {
      id: 12, // New separate section for Prerequisites
      title: "Prérequis",
      icon: '/assets/icons/expand-public.png',
    },
    {
      id: 4,
      title: t('sessionCreation.sections.methods'),
      icon: '/assets/icons/expand-method.png',
    },
    {
      id: 5,
      title: t('sessionCreation.sections.pricing'),
      icon: '/assets/icons/expand-pricing.png',
    },
    {
      id: 6,
      title: t('sessionCreation.sections.specifics'),
      icon: '/assets/icons/expand-specifics.png',
    },
  ];

  const sectionsToRender = sections.length > 0 ? sections : defaultSections;

  const getSectionContent = (sectionId: number) => {
    switch (sectionId) {
      case 1: // Modules
        return (
          <ModulesSection
            modules={modules}
            onAddModule={onAddModule}
            onUpdateModule={onUpdateModule}
            onRemoveModule={onRemoveModule}
            onReorderModules={onReorderModules}
          />
        );
      case 2: // Objectives
        return (
          <ObjectivesSection
            objectives={objectives}
            onAddObjective={onAddObjective}
            onUpdateObjective={onUpdateObjective}
            onRemoveObjective={onRemoveObjective}
          />
        );
      case 3: // Public Visé (Target Audience)
        return (
          <TargetAudienceSection
            targetAudience={targetAudience}
            onUpdateTargetAudience={onUpdateTargetAudience}
          />
        );
      case 12: // Prérequis (Prerequisites) - Separate section
        return (
          <PrerequisitesSection
            prerequisites={prerequisites}
            onUpdatePrerequisites={onUpdatePrerequisites}
          />
        );
      case 4: // Methods
        return (
          <MethodsSection
            methods={methods}
            onUpdateMethods={onUpdateMethods}
          />
        );
      case 5: // Pricing
        return (
          <PricingSection
            priceHT={priceHT}
            vatPercentage={vatPercentage}
            additionalFees={additionalFees}
            onUpdatePriceHT={onUpdatePriceHT}
            onUpdateVATPercentage={onUpdateVATPercentage}
            onAddAdditionalFee={onAddAdditionalFee}
            onUpdateAdditionalFee={onUpdateAdditionalFee}
            onRemoveAdditionalFee={onRemoveAdditionalFee}
          />
        );
      case 6: // Specifics
        return (
          <SpecificsSection
            specifics={specifics}
            onUpdateSpecifics={onUpdateSpecifics}
          />
        );
      default:
        return (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <p>{t('sessionCreation.sections.comingSoon')}</p>
            <Button 
              className="mt-4"
              style={{ backgroundColor: primaryColor }}
            >
              {t('sessionCreation.sections.configure')}
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {sectionsToRender.map((section) => (
        <Card
          key={section.id}
          data-section-id={section.id}
          className={`rounded-[18px] shadow-[0px_0px_75.7px_#19294a17] relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
            isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#dbd8d8]'
          }`}
          onClick={(e) => {
            // Check if the click target is any interactive element
            const target = e.target as HTMLElement;
            
            // Basic interactive elements
            const isButton = target.tagName === 'BUTTON' || target.closest('button');
            const isInput = target.tagName === 'INPUT' || target.closest('input');
            const isTextarea = target.tagName === 'TEXTAREA' || target.closest('textarea');
            const isSelect = target.tagName === 'SELECT' || target.closest('select');
            const isLink = target.tagName === 'A' || target.closest('a');
            
            // Rich text editor elements
            const isProseMirror = target.closest('.ProseMirror');
            const isProseMirrorEditor = target.closest('.ProseMirror-focused');
            const isRichTextToolbar = target.closest('[data-tippy-root]') || target.closest('.tippy-box');
            const isRichTextContainer = target.closest('.rich-text-editor') || target.closest('[class*="rich-text"]');
            
            // Content editable elements
            const isEditable = target.contentEditable === 'true' || target.closest('[contenteditable="true"]');
            const isEditableDiv = target.closest('div[contenteditable]');
            
            // Form elements and interactive containers
            const isFormElement = target.closest('form') || target.closest('[role="form"]');
            const isInteractiveContainer = target.closest('[role="textbox"]') || target.closest('[role="combobox"]');
            
            // Check for data-action attributes
            const hasDataAction = target.hasAttribute('data-action') || target.closest('[data-action]');
            
            // Check for data-interactive attributes
            const hasDataInteractive = target.hasAttribute('data-interactive') || target.closest('[data-interactive]');
            
            // Check for specific classes that indicate interactive content
            const isInteractiveClass = target.closest('.interactive') || target.closest('[class*="editor"]') || target.closest('[class*="input"]');
            
            const isInteractive = isButton || isInput || isTextarea || isSelect || isLink || 
                                isEditable || isEditableDiv || isProseMirror || isProseMirrorEditor || 
                                isRichTextToolbar || isRichTextContainer || isFormElement || 
                                isInteractiveContainer || hasDataAction || hasDataInteractive || isInteractiveClass;
            
            if (isInteractive) {
              console.log('Click on interactive element - not toggling section', {
                tagName: target.tagName,
                className: target.className,
                id: target.id,
                dataAction: target.getAttribute('data-action'),
                dataInteractive: target.getAttribute('data-interactive'),
                contentEditable: target.contentEditable,
                isButton,
                isInput,
                isTextarea,
                isSelect,
                isLink,
                isEditable,
                isEditableDiv,
                isProseMirror,
                isProseMirrorEditor,
                isRichTextToolbar,
                isRichTextContainer,
                isFormElement,
                isInteractiveContainer,
                hasDataAction,
                hasDataInteractive,
                isInteractiveClass,
                closestProseMirror: target.closest('.ProseMirror')?.className,
                closestEditable: target.closest('[contenteditable]')?.className
              });
              return;
            }
            
            console.log('Click on card - toggling section');
            toggleSection(section.id);
          }}
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div className="inline-flex items-center gap-3">
              <div className="inline-flex items-center gap-2">
                <div 
                  className={`w-[17px] h-[17px] rounded-[8.5px] border-2 border-solid ${
                    isDark ? 'border-gray-500' : 'border-[#e2e2ea]'
                  }`}
                  style={{ 
                    borderColor: expandedSections.has(section.id) ? primaryColor : (isDark ? '#6b7280' : '#e2e2ea'),
                    backgroundColor: expandedSections.has(section.id) ? primaryColor : 'transparent'
                  }}
                />
                <span 
                  className={`[font-family:'Poppins',Helvetica] font-semibold text-[17px] ${
                    isDark ? 'text-white' : 'text-[#19294a]'
                  }`}
                  style={{ 
                    color: expandedSections.has(section.id) ? primaryColor : (isDark ? 'white' : '#19294a')
                  }}
                >
                  {section.title}
                </span>
                <InfoIcon 
                  className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                  style={{ 
                    color: expandedSections.has(section.id) ? primaryColor : (isDark ? '#9ca3af' : '#6b7280')
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <img
                className="w-[31px] h-[31px] transition-transform duration-200"
                alt={section.title}
                src={section.icon}
                style={{
                  transform: expandedSections.has(section.id) ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              />
            </div>
          </CardContent>
          
          {expandedSections.has(section.id) && (
            <div className={`px-5 pb-5 border-t ${isDark ? 'border-gray-600' : 'border-[#e2e2ea]'}`}>
              <div className="pt-4">
                {section.content || getSectionContent(section.id)}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
