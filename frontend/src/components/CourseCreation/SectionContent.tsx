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
      {/* Add Module Button - Left aligned, cyan color */}
      <div>
        <Button
          data-action="add-module"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddModule();
          }}
          variant="outline"
          className="flex items-center gap-2 border-cyan-400 text-cyan-500 hover:bg-cyan-50 px-4 py-2"
        >
          <PlusIcon className="w-4 h-4" />
          Ajouter Un Module
        </Button>
      </div>

      {/* Modules List */}
      <div className="space-y-3">
        {modules.length === 0 && (
          <div className={`text-center py-6 ${isDark ? 'text-gray-400' : 'text-gray-400'} text-sm`}>
            Aucun module ajouté pour le moment
          </div>
        )}
        {modules.map((module, index) => (
          <div
            key={module.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              } ${dragOverIndex === index ? 'ring-2 ring-blue-400' : ''
              } ${draggedItem?.id === module.id ? 'opacity-50' : ''
              }`}
          >
            {/* Drag Handle - More subtle */}
            <GripVerticalIcon
              className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'} cursor-move flex-shrink-0`}
            />

            {/* Module Number and Input */}
            <div className="flex items-center gap-2 flex-1">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {index + 1}.
              </span>
              <Input
                value={module.title}
                onChange={(e) => onUpdateModule(module.id, 'title', e.target.value)}
                placeholder="Titre du module"
                className={`flex-1 ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>

            {/* Delete Button - Gray rounded */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveModule(module.id);
              }}
              className={`p-2 rounded-full ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                } transition-colors flex-shrink-0`}
            >
              <TrashIcon className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>
        ))}

        {/* Drop zone at the end */}
        {draggedItem && (
          <div
            className={`h-2 rounded-lg transition-all duration-200 ${dragOverIndex === modules.length ? 'bg-blue-400 opacity-50' : 'bg-transparent'
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
  onReorderObjectives?: (objectives: any[]) => void;
}> = ({ objectives, onAddObjective, onUpdateObjective, onRemoveObjective, onReorderObjectives }) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';

  // Ref to store input references for auto-focus
  const inputRefs = React.useRef<{ [key: string]: HTMLInputElement | null }>({});
  const prevObjectivesLength = React.useRef(objectives.length);

  // Auto-focus on newly added objective
  React.useEffect(() => {
    if (objectives.length > prevObjectivesLength.current) {
      // A new objective was added, focus on the last one
      const lastObjective = objectives[objectives.length - 1];
      if (lastObjective && inputRefs.current[lastObjective.id]) {
        setTimeout(() => {
          inputRefs.current[lastObjective.id]?.focus();
        }, 100);
      }
    }
    prevObjectivesLength.current = objectives.length;
  }, [objectives.length]);

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
      // Use onReorderObjectives if provided (optimal - updates entire array)
      if (onReorderObjectives) {
        onReorderObjectives(reorderedObjectives);
      } else {
        // Fallback to individual updates
        reorderedObjectives.forEach((obj, index) => {
          onUpdateObjective(obj.id, 'order', index);
        });
      }
    },
    itemIdField: 'id'
  });

  return (
    <div className="space-y-4">
      {/* Add Objective Button - Left aligned, cyan color */}
      <div>
        <Button
          data-action="add-objective"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddObjective();
          }}
          variant="outline"
          className="flex items-center gap-2 border-cyan-400 text-cyan-500 hover:bg-cyan-50 px-4 py-2"
        >
          <PlusIcon className="w-4 h-4" />
          Ajouter Un Objectif
        </Button>
      </div>

      {/* Objectives List */}
      <div className="space-y-3">
        {objectives.length === 0 && (
          <div className={`text-center py-6 ${isDark ? 'text-gray-400' : 'text-gray-400'} text-sm`}>
            Aucun objectif ajouté pour le moment
          </div>
        )}
        {objectives.map((objective, index) => (
          <div
            key={objective.id}
            draggable
            onDragStart={(e) => {
              // Only allow drag if starting from the grip icon area
              const target = e.target as HTMLElement;
              if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('button')) {
                e.preventDefault();
                return;
              }
              handleDragStart(e, index);
            }}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-move ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              } ${dragOverIndex === index ? 'ring-2 ring-blue-400' : ''
              } ${draggedItem?.id === objective.id ? 'opacity-50' : ''
              }`}
          >
            {/* Drag Handle - More subtle */}
            <GripVerticalIcon
              className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'} flex-shrink-0`}
            />

            {/* Input Field */}
            <div
              className="flex-1"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Input
                ref={(el) => inputRefs.current[objective.id] = el}
                type="text"
                value={objective.text.replace(/<[^>]*>/g, '')}
                onChange={(e) => onUpdateObjective(objective.id, 'text', e.target.value)}
                placeholder="Saisir l'objectif pédagogique"
                className={`w-full ${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>

            {/* Delete Button - Gray rounded */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveObjective(objective.id);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className={`p-2 rounded-full ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                } transition-colors flex-shrink-0`}
            >
              <TrashIcon className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>
        ))}

        {/* Drop zone at the end */}
        {draggedItem && (
          <div
            className={`h-2 rounded-lg transition-all duration-200 ${dragOverIndex === objectives.length ? 'bg-blue-400 opacity-50' : 'bg-transparent'
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
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column - Prix */}
          <div>
            <h3 className={`text-base font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              Prix
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <label className={`text-sm font-normal whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Prix HT (En €):
                </label>
                <div className="relative flex-1">
                  <Input
                    type="number"
                    value={priceHT || ''}
                    onChange={(e) => onUpdatePriceHT(parseFloat(e.target.value) || 0)}
                    placeholder=""
                    min="0"
                    step="0.01"
                    className={`pr-10 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    €
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className={`text-sm font-normal whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  TVA (En %):
                </label>
                <div className="relative flex-1">
                  <Input
                    type="number"
                    value={vatPercentage || ''}
                    onChange={(e) => onUpdateVATPercentage(parseFloat(e.target.value) || 0)}
                    placeholder=""
                    min="0"
                    max="100"
                    step="0.01"
                    className={`pr-10 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Frais Annexes */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>
                Frais annexes ({additionalFees.length})
              </h3>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            {/* Fees List */}
            <div className="space-y-3 mb-3">
              {additionalFees.map((fee) => (
                <div
                  key={fee.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <div>
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {fee.name}
                      </span>
                      {fee.vat_applied && (
                        <span className={`ml-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          (TVA à {vatPercentage}%)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {fee.amount}€ HT{fee.unit && `/${fee.unit}`}
                    </span>
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
                      className="h-7 w-7"
                    >
                      <EditIcon className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveAdditionalFee(fee.id);
                      }}
                      className="h-7 w-7 text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
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
                handleOpenModal();
              }}
              className={`w-full flex items-center justify-center gap-2 py-2 text-sm border-dashed ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-blue-300 text-blue-600 hover:bg-blue-50'
                }`}
              style={{ color: isDark ? undefined : primaryColor }}
            >
              <PlusIcon className="w-4 h-4" />
              Ajouter Un Frais Annexe
            </Button>
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

  // Convert date string to YYYY-MM-DD format for input type="date"
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    // Convert YYYY-MM-DD to a more readable format or keep as is
    onUpdateUpdateDate(dateValue);
  };

  return (
    <div className="space-y-4">
      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Date De MAJ
      </h3>

      <Input
        type="date"
        value={formatDateForInput(updateDate)}
        onChange={handleDateChange}
        className={`${isDark ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'}`}
      />
    </div>
  );
};
