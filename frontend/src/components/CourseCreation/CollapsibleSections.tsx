import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { ChevronDownIcon, ChevronUpIcon, InfoIcon } from 'lucide-react';
import {
  ModulesSection,
  ObjectivesSection,
  PrerequisitesSection,
  MethodsSection,
  PricingSection,
  SpecificsSection,
  EvaluationModalitiesSection,
  AccessModalitiesSection,
  AccessibilitySection,
  ContactsSection,
  UpdateDateSection,
  DurationSection,
  PublicViseSection,
  PrerequisSection
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
  evaluationModalities: string;
  accessModalities: string;
  accessibility: string;
  contacts: string;
  updateDate: string;
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
  onAddAdditionalFee: (initialData?: { name: string; amount: number; description: string }) => void;
  onUpdateAdditionalFee: (id: string, field: string, value: any) => void;
  onRemoveAdditionalFee: (id: string) => void;
  onUpdateSpecifics: (content: string) => void;
  onUpdateEvaluationModalities: (content: string) => void;
  onUpdateAccessModalities: (content: string) => void;
  onUpdateAccessibility: (content: string) => void;
  onUpdateContacts: (content: string) => void;
  onUpdateUpdateDate: (content: string) => void;
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
  evaluationModalities,
  accessModalities,
  accessibility,
  contacts,
  updateDate,
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
  onUpdateEvaluationModalities,
  onUpdateAccessModalities,
  onUpdateAccessibility,
  onUpdateContacts,
  onUpdateUpdateDate,
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  const primaryColor = organization?.primary_color || '#007aff';
  const secondaryColor = organization?.secondary_color || '#6a90b9';

  const toggleSection = (sectionId: number) => {
    // ('toggleSection called for section:', sectionId);
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
      // ('Collapsing section:', sectionId);
    } else {
      newExpanded.add(sectionId);
      // ('Expanding section:', sectionId);
    }
    setExpandedSections(newExpanded);
    onSectionClick?.(sectionId);
  };

  const defaultSections: CollapsibleSection[] = [
    {
      id: 1,
      title: "Durée De La Formation",
      icon: '/assets/icons/expand-module.png',
    },
    {
      id: 2,
      title: "Public Visé",
      icon: '/assets/icons/expand-public.png',
    },
    {
      id: 3,
      title: "Prérequis",
      icon: '/assets/icons/expand-public.png',
    },
    {
      id: 4,
      title: "Tarification",
      icon: '/assets/icons/expand-pricing.png',
    },
    {
      id: 5,
      title: "Objectif Pédagogique",
      icon: '/assets/icons/expand-objective.png',
    },
    {
      id: 6,
      title: "Méthodes Mobilisées",
      icon: '/assets/icons/expand-method.png',
    },
    {
      id: 7,
      title: "Modalité D'évaluation",
      icon: '/assets/icons/expand-method.png',
    },
    {
      id: 8,
      title: "Modalités Et Délais D'accès",
      icon: '/assets/icons/expand-method.png',
    },
    {
      id: 9,
      title: "Accessibilité Aux Personnes Handicapées",
      icon: '/assets/icons/expand-method.png',
    },
    {
      id: 10,
      title: "Contacts",
      icon: '/assets/icons/expand-method.png',
    },
    {
      id: 11,
      title: "Date De MAJ",
      icon: '/assets/icons/expand-method.png',
    },
    {
      id: 12,
      title: "Modules",
      icon: '/assets/icons/expand-module.png',
    },
    {
      id: 13,
      title: "Spécificités De La Formation",
      icon: '/assets/icons/expand-specifics.png',
    },
  ];

  const sectionsToRender = sections.length > 0 ? sections : defaultSections;

  const getSectionContent = (sectionId: number) => {
    switch (sectionId) {
      case 1: // Duration - Custom content for duration
        return (
          <DurationSection />
        );
      case 2: // Public Visé
        return (
          <PublicViseSection
            targetAudience={targetAudience}
            onUpdateTargetAudience={onUpdateTargetAudience}
          />
        );
      case 3: // Prerequisites
        return (
          <PrerequisSection
            prerequisites={prerequisites}
            onUpdatePrerequisites={onUpdatePrerequisites}
          />
        );
      case 4: // Pricing (Tarification)
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
      case 5: // Objectif Pédagogique
        return (
          <ObjectivesSection
            objectives={objectives}
            onAddObjective={onAddObjective}
            onUpdateObjective={onUpdateObjective}
            onRemoveObjective={onRemoveObjective}
          />
        );
      case 6: // Méthodes Mobilisées
        return (
          <MethodsSection
            methods={methods}
            onUpdateMethods={onUpdateMethods}
          />
        );
      case 7: // Modalité D'évaluation
        return (
          <EvaluationModalitiesSection
            evaluationModalities={evaluationModalities}
            onUpdateEvaluationModalities={onUpdateEvaluationModalities}
          />
        );
      case 8: // Modalités Et Délais D'accès
        return (
          <AccessModalitiesSection
            accessModalities={accessModalities}
            onUpdateAccessModalities={onUpdateAccessModalities}
          />
        );
      case 9: // Accessibilité Aux Personnes Handicapées
        return (
          <AccessibilitySection
            accessibility={accessibility}
            onUpdateAccessibility={onUpdateAccessibility}
          />
        );
      case 10: // Contacts
        return (
          <ContactsSection
            contacts={contacts}
            onUpdateContacts={onUpdateContacts}
          />
        );
      case 11: // Date De MAJ
        return (
          <UpdateDateSection
            updateDate={updateDate}
            onUpdateUpdateDate={onUpdateUpdateDate}
          />
        );
      case 12: // Modules
        return (
          <ModulesSection
            modules={modules}
            onAddModule={onAddModule}
            onUpdateModule={onUpdateModule}
            onRemoveModule={onRemoveModule}
            onReorderModules={onReorderModules}
          />
        );
      case 13: // Spécificités De La Formation
        return (
          <SpecificsSection
            specifics={specifics}
            onUpdateSpecifics={onUpdateSpecifics}
          />
        );
      default:
        return (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <p>{t('courseCreation.sections.comingSoon')}</p>
            <Button
              className="mt-4"
              style={{ backgroundColor: primaryColor }}
            >
              {t('courseCreation.sections.configure')}
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
          className={`rounded-[18px] shadow-[0px_0px_75.7px_#19294a17] relative transition-all duration-200 hover:shadow-lg border ${
            isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#e2e2ea]'
          }`}
        >
          <CardContent
            className="p-5 flex items-center justify-between cursor-pointer"
            onClick={(e) => {
              const target = e.target as HTMLElement;
              const isButton = target.tagName === 'BUTTON' || target.closest('button');
              const isLink = target.tagName === 'A' || target.closest('a');
              if (isButton || isLink) {
                return;
              }
              toggleSection(section.id);
            }}
          >
            <div className="inline-flex items-center gap-3">
              <div className="inline-flex items-center gap-2">
                <div
                  className={`w-[17px] h-[17px] rounded-[8.5px] border-2 border-solid transition-colors ${
                    isDark ? 'border-gray-500' : 'border-[#e2e2ea]'
                  }`}
                  style={{
                    borderColor: expandedSections.has(section.id) ? primaryColor : (isDark ? '#6b7280' : '#e2e2ea'),
                    backgroundColor: expandedSections.has(section.id) ? primaryColor : 'transparent'
                  }}
                />
                <span
                  className={`[font-family:'Poppins',Helvetica] font-semibold text-[17px] transition-colors ${
                    isDark ? 'text-white' : 'text-[#19294a]'
                  }`}
                  style={{
                    color: expandedSections.has(section.id) ? primaryColor : (isDark ? 'white' : '#19294a')
                  }}
                >
                  {section.title}
                </span>
                <InfoIcon
                  className={`w-4 h-4 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                  style={{
                    color: expandedSections.has(section.id) ? primaryColor : (isDark ? '#9ca3af' : '#6b7280')
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {expandedSections.has(section.id) ? (
                <ChevronUpIcon
                  className={`w-6 h-6 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                  style={{ color: primaryColor }}
                />
              ) : (
                <ChevronDownIcon
                  className={`w-6 h-6 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                />
              )}
            </div>
          </CardContent>

          {expandedSections.has(section.id) && (
            <div
              className={`px-5 pb-5 border-t ${isDark ? 'border-gray-600' : 'border-[#e2e2ea]'}`}
              onClick={(e) => {
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              data-section-content="true"
            >
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
