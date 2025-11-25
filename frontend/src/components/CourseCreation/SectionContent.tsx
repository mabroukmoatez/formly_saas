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
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

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
          {t('courseCreation.sections.modules')}
        </h3>
        <Button
          data-action="add-module"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // ('Add Module clicked - preventing propagation');
            onAddModule();
          }}
          className="flex items-center gap-2"
          style={{ backgroundColor: primaryColor }}
        >
          <PlusIcon className="w-4 h-4" />
          {t('courseCreation.form.addModule')}
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
                      placeholder={t('courseCreation.form.moduleTitle')}
                      className={`flex-1 ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                  
                  <RichTextEditor
                    content={module.description}
                    onChange={(content) => onUpdateModule(module.id, 'description', content)}
                    placeholder={t('courseCreation.form.moduleDescription')}
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
                      {t('courseCreation.form.hours')}
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
          {t('courseCreation.sections.objectives')}
        </h3>
        <Button
          data-action="add-objective"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // ('Add Objective clicked - preventing propagation');
            onAddObjective();
          }}
          className="flex items-center gap-2"
          style={{ backgroundColor: primaryColor }}
        >
          <PlusIcon className="w-4 h-4" />
          {t('courseCreation.form.addObjective')}
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
                    placeholder={t('courseCreation.form.objectiveText')}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateObjective(objective.id, 'text', prompt('Edit objective:', objective.text) || objective.text);
                    }}
                  >
                    <EditIcon className="w-4 h-4" />
                  </Button>
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

// Prerequisites Section
export const PrerequisitesSection: React.FC<{
  targetAudience: string;
  prerequisites: string;
  onUpdateTargetAudience: (content: string) => void;
  onUpdatePrerequisites: (content: string) => void;
}> = ({ targetAudience, prerequisites, onUpdateTargetAudience, onUpdatePrerequisites }) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('courseCreation.form.targetAudience')}
        </h3>
        <RichTextEditor
          content={targetAudience}
          onChange={onUpdateTargetAudience}
          placeholder="Aucun"
          className="min-h-[150px]"
        />
      </div>

      <div>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('courseCreation.form.prerequisites')}
        </h3>
        <RichTextEditor
          content={prerequisites}
          onChange={onUpdatePrerequisites}
          placeholder="Aucun"
          className="min-h-[150px]"
        />
      </div>
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
        {t('courseCreation.sections.methods')}
      </h3>
      
      <RichTextEditor
        content={methods}
        onChange={onUpdateMethods}
        placeholder={t('courseCreation.form.methodsPlaceholder')}
        className="min-h-[200px]"
      />
    </div>
  );
};

// Additional Fee Modal Component
interface AdditionalFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; amount: number; description: string }) => void;
  fee?: {
    id: string;
    name: string;
    amount: number;
    description?: string;
  } | null;
}

const AdditionalFeeModal: React.FC<AdditionalFeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  fee
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';

  const [name, setName] = useState(fee?.name || '');
  const [amount, setAmount] = useState(fee?.amount?.toString() || '');
  const [description, setDescription] = useState(fee?.description || '');

  React.useEffect(() => {
    if (fee) {
      setName(fee.name || '');
      setAmount(fee.amount?.toString() || '');
      setDescription(fee.description || '');
    } else {
      setName('');
      setAmount('');
      setDescription('');
    }
  }, [fee, isOpen]);

  const handleSave = () => {
    if (!name.trim()) {
      return;
    }
    onSave({
      name: name.trim(),
      amount: parseFloat(amount) || 0,
      description: description.trim()
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div 
        className={`w-full max-w-md rounded-lg shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {fee ? 'Modifier le frais annexe' : 'Ajouter un frais annexe'}
            </h2>
            <button
              onClick={onClose}
              className={`p-1 rounded-md hover:bg-gray-100 ${isDark ? 'hover:bg-gray-700' : ''}`}
            >
              <XIcon className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <Label className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Nom du frais *
            </Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Frais de certification"
              className={`mt-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            />
          </div>

          <div>
            <Label className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Montant (€ HT) *
            </Label>
            <div className="relative mt-1">
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>€</span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={`pl-8 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>
          </div>

          <div>
            <Label className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Description (optionnel)
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du frais..."
              rows={3}
              className={`mt-1 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
            />
          </div>
        </div>

        <div className={`p-6 border-t flex justify-end gap-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <Button
            variant="outline"
            onClick={onClose}
            className={isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim()}
            style={{ backgroundColor: primaryColor }}
            className="text-white"
          >
            {fee ? 'Modifier' : 'Ajouter'}
          </Button>
        </div>
      </div>
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
  onAddAdditionalFee: (initialData?: { name: string; amount: number; description: string }) => void;
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
  const [showModal, setShowModal] = useState(false);
  const [editingFee, setEditingFee] = useState<{ id: string; name: string; amount: number; description?: string } | null>(null);

  const handleOpenModal = (fee?: { id: string; name: string; amount: number; description?: string }) => {
    if (fee) {
      setEditingFee(fee);
    } else {
      setEditingFee(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingFee(null);
  };

  const handleSaveFee = (data: { name: string; amount: number; description: string }) => {
    if (editingFee) {
      // Update existing fee
      onUpdateAdditionalFee(editingFee.id, 'name', data.name);
      onUpdateAdditionalFee(editingFee.id, 'amount', data.amount);
      onUpdateAdditionalFee(editingFee.id, 'description', data.description);
    } else {
      // Create new fee with initial data
      onAddAdditionalFee(data);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('courseCreation.form.price')}
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('courseCreation.form.priceHT')}:
                </label>
                <Input
                  type="number"
                  value={priceHT || ''}
                  onChange={(e) => onUpdatePriceHT(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className={`${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('courseCreation.form.vatPercentage')}:
                </label>
                <Input
                  type="number"
                  value={vatPercentage || ''}
                  onChange={(e) => onUpdateVATPercentage(parseFloat(e.target.value) || 0)}
                  placeholder="20"
                  min="0"
                  max="100"
                  step="0.01"
                  className={`${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('courseCreation.form.additionalFees')} ({additionalFees.length})
              </h3>
              <Button
                data-action="add-additional-fee"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOpenModal();
                }}
                className="flex items-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                <PlusIcon className="w-4 h-4" />
                {t('courseCreation.form.addAdditionalFee')}
              </Button>
            </div>
            
            <div className="space-y-3">
              {additionalFees.map((fee) => (
                <Card key={fee.id} className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {fee.name}
                          {fee.vat_applied && (
                            <span className={`ml-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              (TVA À {vatPercentage}%)
                            </span>
                          )}
                        </div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {fee.amount}€ HT{fee.unit && `/${fee.unit}`}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal({
                              id: fee.id,
                              name: fee.name,
                              amount: fee.amount,
                              description: ''
                            });
                          }}
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
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AdditionalFeeModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSaveFee}
        fee={editingFee}
      />
    </>
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
        {t('courseCreation.sections.specifics')}
      </h3>
      
      <RichTextEditor
        content={specifics}
        onChange={onUpdateSpecifics}
        placeholder="Text Field"
        className="min-h-[200px]"
      />
    </div>
  );
};

// Evaluation Modalities Section
export const EvaluationModalitiesSection: React.FC<{
  evaluationModalities: string;
  onUpdateEvaluationModalities: (content: string) => void;
}> = ({ evaluationModalities, onUpdateEvaluationModalities }) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Modalités D'évaluation
      </h3>
      
      <RichTextEditor
        content={evaluationModalities}
        onChange={onUpdateEvaluationModalities}
        placeholder="Text Field"
        className="min-h-[200px]"
      />
    </div>
  );
};

// Access Modalities Section
export const AccessModalitiesSection: React.FC<{
  accessModalities: string;
  onUpdateAccessModalities: (content: string) => void;
}> = ({ accessModalities, onUpdateAccessModalities }) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Modalités Et Délais D'accès
      </h3>
      
      <RichTextEditor
        content={accessModalities}
        onChange={onUpdateAccessModalities}
        placeholder="Text Field"
        className="min-h-[200px]"
      />
    </div>
  );
};

// Accessibility Section
export const AccessibilitySection: React.FC<{
  accessibility: string;
  onUpdateAccessibility: (content: string) => void;
}> = ({ accessibility, onUpdateAccessibility }) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Accessibilité Aux Personnes Handicapées
      </h3>
      
      <RichTextEditor
        content={accessibility}
        onChange={onUpdateAccessibility}
        placeholder="Text Field"
        className="min-h-[200px]"
      />
    </div>
  );
};

// Contacts Section
export const ContactsSection: React.FC<{
  contacts: string;
  onUpdateContacts: (content: string) => void;
}> = ({ contacts, onUpdateContacts }) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Contacts
      </h3>
      
      <RichTextEditor
        content={contacts}
        onChange={onUpdateContacts}
        placeholder="Text Field"
        className="min-h-[200px]"
      />
    </div>
  );
};

// Update Date Section
export const UpdateDateSection: React.FC<{
  updateDate: string;
  onUpdateUpdateDate: (content: string) => void;
}> = ({ updateDate, onUpdateUpdateDate }) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Date De MAJ
      </h3>
      
      <RichTextEditor
        content={updateDate}
        onChange={onUpdateUpdateDate}
        placeholder="Text Field"
        className="min-h-[200px]"
      />
    </div>
  );
};
