import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { RichTextEditor } from '../ui/rich-text-editor';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { XIcon, PlusIcon, GripVerticalIcon, EditIcon, TrashIcon } from 'lucide-react';

// Modules Section
export const ModulesSection: React.FC<{
  modules: Array<{
    id: string;
    title: string;
    description: string;
    duration: number;
    order: number;
  }>;
  onAddModule: () => void;
  onUpdateModule: (id: string, field: string, value: any) => void;
  onRemoveModule: (id: string) => void;
  onReorderModules: (modules: any[]) => void;
}> = ({ modules, onAddModule, onUpdateModule, onRemoveModule, onReorderModules }) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';

  const {
    draggedItem,
    dragOverIndex,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } = useDragAndDrop({
    items: modules,
    onReorder: onReorderModules,
    itemIdField: 'id'
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('sessionCreation.sections.modules')}
        </h3>
        <Button
          data-action="add-module"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Add Module clicked - preventing propagation');
            onAddModule();
          }}
          className="flex items-center gap-2"
          style={{ backgroundColor: primaryColor }}
        >
          <PlusIcon className="w-4 h-4" />
          {t('sessionCreation.form.addModule')}
        </Button>
      </div>

      <div className="space-y-3">
        {modules.length === 0 && (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <p>No modules added yet. Click "Add Module" to get started.</p>
          </div>
        )}
        {modules.map((module, index) => (
          <Card 
            key={module.id} 
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            className={`transition-all duration-200 ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
            } ${
              dragOverIndex === index ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
            } ${
              draggedItem?.id === module.id ? 'opacity-50' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <GripVerticalIcon 
                  className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'} cursor-move hover:text-blue-500 transition-colors`} 
                />
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {index + 1}.
                    </span>
                    <Input
                      value={module.title}
                      onChange={(e) => onUpdateModule(module.id, 'title', e.target.value)}
                      placeholder={t('sessionCreation.form.moduleTitle')}
                      className={`flex-1 ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                  
                  <RichTextEditor
                    content={module.description}
                    onChange={(content) => onUpdateModule(module.id, 'description', content)}
                    placeholder={t('sessionCreation.form.moduleDescription')}
                    className="min-h-[100px]"
                  />
                  
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={module.duration || ''}
                      onChange={(e) => onUpdateModule(module.id, 'duration', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                      className={`w-24 ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                    />
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {t('sessionCreation.form.hours')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateModule(module.id, 'title', prompt('Edit module title:', module.title) || module.title);
                    }}
                  >
                    <EditIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveModule(module.id);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Drop zone at the end for modules */}
        {draggedItem && (
          <div 
            className={`h-2 rounded-lg transition-all duration-200 ${
              dragOverIndex === modules.length ? 'bg-blue-500 opacity-50' : 'bg-transparent'
            }`}
            onDragOver={(e) => handleDragOver(e, modules.length)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, modules.length)}
          />
        )}
      </div>
    </div>
  );
};

// Objectives Section
export const ObjectivesSection: React.FC<{
  objectives: Array<{
    id: string;
    text: string;
    order: number;
  }>;
  onAddObjective: () => void;
  onUpdateObjective: (id: string, field: string, value: any) => void;
  onRemoveObjective: (id: string) => void;
}> = ({ objectives, onAddObjective, onUpdateObjective, onRemoveObjective }) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';

  const {
    draggedItem,
    dragOverIndex,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } = useDragAndDrop({
    items: objectives,
    onReorder: (reorderedObjectives) => {
      // Update the order property for each objective
      const updatedObjectives = reorderedObjectives.map((obj, index) => ({
        ...obj,
        order: index
      }));
      // Call a reorder function if it exists, or update each objective individually
      updatedObjectives.forEach((obj, index) => {
        onUpdateObjective(obj.id, 'order', index);
      });
    },
    itemIdField: 'id'
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('sessionCreation.sections.objectives')}
        </h3>
        <Button
          data-action="add-objective"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Add Objective clicked - preventing propagation');
            onAddObjective();
          }}
          className="flex items-center gap-2"
          style={{ backgroundColor: primaryColor }}
        >
          <PlusIcon className="w-4 h-4" />
          {t('sessionCreation.form.addObjective')}
        </Button>
      </div>

      <div className="space-y-3">
        {objectives.length === 0 && (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <p>No objectives added yet. Click "Add Objective" to get started.</p>
          </div>
        )}
        {objectives.map((objective, index) => (
          <Card 
            key={objective.id} 
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            className={`transition-all duration-200 ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
            } ${
              dragOverIndex === index ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
            } ${
              draggedItem?.id === objective.id ? 'opacity-50' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <GripVerticalIcon 
                  className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'} cursor-move hover:text-blue-500 transition-colors`} 
                />
                
                <div className="flex-1">
                  <RichTextEditor
                    content={objective.text}
                    onChange={(content) => onUpdateObjective(objective.id, 'text', content)}
                    placeholder={t('sessionCreation.form.objectiveText')}
                    className="min-h-[80px]"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveObjective(objective.id);
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Drop zone at the end for objectives */}
        {draggedItem && (
          <div 
            className={`h-2 rounded-lg transition-all duration-200 ${
              dragOverIndex === objectives.length ? 'bg-blue-500 opacity-50' : 'bg-transparent'
            }`}
            onDragOver={(e) => handleDragOver(e, objectives.length)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, objectives.length)}
          />
        )}
      </div>
    </div>
  );
};

// Target Audience Section (Public Visé) - Separate block
export const TargetAudienceSection: React.FC<{
  targetAudience: string;
  onUpdateTargetAudience: (content: string) => void;
}> = ({ targetAudience, onUpdateTargetAudience }) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  return (
    <div className="space-y-4">
      <RichTextEditor
        content={targetAudience}
        onChange={onUpdateTargetAudience}
        placeholder="Décrivez le public visé par cette formation..."
        className="min-h-[150px]"
      />
    </div>
  );
};

// Prerequisites Section (Prérequis) - Separate block
export const PrerequisitesSection: React.FC<{
  targetAudience?: string;
  prerequisites: string;
  onUpdateTargetAudience?: (content: string) => void;
  onUpdatePrerequisites: (content: string) => void;
}> = ({ prerequisites, onUpdatePrerequisites }) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  return (
    <div className="space-y-4">
      <RichTextEditor
        content={prerequisites}
        onChange={onUpdatePrerequisites}
        placeholder="Décrivez les prérequis nécessaires..."
        className="min-h-[150px]"
      />
    </div>
  );
};

// Methods Section
export const MethodsSection: React.FC<{
  methods: string;
  onUpdateMethods: (content: string) => void;
}> = ({ methods, onUpdateMethods }) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {t('sessionCreation.sections.methods')}
      </h3>
      
      <RichTextEditor
        content={methods}
        onChange={onUpdateMethods}
        placeholder={t('sessionCreation.form.methodsPlaceholder')}
        className="min-h-[200px]"
      />
    </div>
  );
};

// Pricing Section
export const PricingSection: React.FC<{
  priceHT: number;
  vatPercentage: number;
  additionalFees: Array<{
    id: string;
    name: string;
    amount: number;
    vat_applied: boolean;
    unit: string;
  }>;
  onUpdatePriceHT: (value: number) => void;
  onUpdateVATPercentage: (value: number) => void;
  onAddAdditionalFee: () => void;
  onUpdateAdditionalFee: (id: string, field: string, value: any) => void;
  onRemoveAdditionalFee: (id: string) => void;
}> = ({ 
  priceHT, 
  vatPercentage, 
  additionalFees, 
  onUpdatePriceHT, 
  onUpdateVATPercentage, 
  onAddAdditionalFee, 
  onUpdateAdditionalFee, 
  onRemoveAdditionalFee 
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';

  return (
    <div className="space-y-6">
      {/* Prix Section - Inline layout */}
      <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('sessionCreation.form.price')}
        </h3>
        
        <div className="flex items-end gap-6">
          <div className="flex-1">
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('sessionCreation.form.priceHT')}:
            </label>
            <div className="relative">
              <Input
                type="number"
                value={priceHT || ''}
                onChange={(e) => onUpdatePriceHT(parseFloat(e.target.value) || 0)}
                placeholder="0,00"
                min="0"
                step="0.01"
                className={`pr-12 ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
              />
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                €
              </span>
            </div>
          </div>
          
          <div className="flex-1">
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('sessionCreation.form.vatPercentage')}:
            </label>
            <div className="relative">
              <Input
                type="number"
                value={vatPercentage || ''}
                onChange={(e) => onUpdateVATPercentage(parseFloat(e.target.value) || 0)}
                placeholder="20"
                min="0"
                max="100"
                step="0.01"
                className={`pr-10 ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
              />
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                %
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Frais Annexes Section - Simple list format */}
      <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('sessionCreation.form.additionalFees')} ({additionalFees.length})
          </h3>
        </div>
        
        {/* Fees List */}
        <div className="space-y-2 mb-4">
          {additionalFees.map((fee) => (
            <div 
              key={fee.id} 
              className={`flex items-center justify-between p-3 rounded-lg border ${
                isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex-1">
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {fee.name}
                  {fee.vat_applied && (
                    <span className={`ml-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      (TVA À {vatPercentage}%)
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {fee.amount}€ HT{fee.unit && `/${fee.unit}`}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateAdditionalFee(fee.id, 'name', prompt('Nom du frais:', fee.name) || fee.name);
                  }}
                  className="h-8 w-8"
                >
                  <EditIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveAdditionalFee(fee.id);
                  }}
                  className="h-8 w-8 text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Fee Button */}
        <Button
          data-action="add-additional-fee"
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddAdditionalFee();
          }}
          className={`w-full flex items-center justify-center gap-2 border-dashed ${
            isDark ? 'border-gray-500 hover:bg-gray-600' : 'border-gray-300 hover:bg-gray-100'
          }`}
        >
          <PlusIcon className="w-4 h-4" />
          {t('sessionCreation.form.addAdditionalFee')}
        </Button>
      </div>
    </div>
  );
};

// Specifics Section
export const SpecificsSection: React.FC<{
  specifics: string;
  onUpdateSpecifics: (content: string) => void;
}> = ({ specifics, onUpdateSpecifics }) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {t('sessionCreation.sections.specifics')}
      </h3>
      
      <RichTextEditor
        content={specifics}
        onChange={onUpdateSpecifics}
        placeholder={t('sessionCreation.form.specificsPlaceholder')}
        className="min-h-[200px]"
      />
    </div>
  );
};
