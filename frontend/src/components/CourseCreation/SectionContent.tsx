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
      {/* Add Module Button */}
      <Button
        data-action="add-module"
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onAddModule();
        }}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border-dashed ${
          isDark
            ? 'border-gray-500 hover:bg-gray-700 text-white'
            : 'border-[#e2e2ea] hover:bg-gray-50 text-[#19294a]'
        }`}
      >
        <PlusIcon className="w-4 h-4" />
        <span className="[font-family:'Poppins',Helvetica] font-medium text-[14px]">
          Ajouter Un Module
        </span>
      </Button>

      {/* Modules List */}
      <div className="space-y-3">
        {modules.length === 0 && (
          <div className={`text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <p className="text-sm">Aucun module ajouté. Cliquez sur "Ajouter Un Module" pour commencer.</p>
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
            className={`flex items-center gap-3 px-4 py-3 rounded-[18px] border transition-all duration-200 ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-[#e2e2ea]'
            } ${
              dragOverIndex === index ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
            } ${
              draggedItem?.id === module.id ? 'opacity-50' : ''
            }`}
          >
            {/* Module Number Badge */}
            <div className={`flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${
              isDark ? 'bg-blue-600' : 'bg-[#E8F3FF]'
            }`}>
              <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[14px] ${
                isDark ? 'text-white' : 'text-[#19294a]'
              }`} style={{ color: primaryColor }}>
                {index + 1})
              </span>
            </div>

            {/* Module Title Input */}
            <Input
              type="text"
              value={module.title}
              onChange={(e) => onUpdateModule(module.id, 'title', e.target.value)}
              placeholder="Entrez le titre du module..."
              className={`flex-1 border-none shadow-none text-[15px] font-medium ${
                isDark
                  ? 'text-white placeholder:text-gray-400 bg-transparent'
                  : 'text-[#2D3748] placeholder:text-[#718096] bg-transparent'
              }`}
            />

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className={`w-8 h-8 rounded-full ${
                  isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <EditIcon className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`w-8 h-8 rounded-full ${
                  isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveModule(module.id);
                }}
              >
                <TrashIcon className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
              </Button>
            </div>
          </div>
        ))}

        {/* Drop zone at the end */}
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
      const updatedObjectives = reorderedObjectives.map((obj, index) => ({
        ...obj,
        order: index
      }));
      updatedObjectives.forEach((obj, index) => {
        onUpdateObjective(obj.id, 'order', index);
      });
    },
    itemIdField: 'id'
  });

  return (
    <div className="space-y-4">
      {/* Add Objective Button */}
      <Button
        data-action="add-objective"
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onAddObjective();
        }}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border-dashed ${
          isDark
            ? 'border-gray-500 hover:bg-gray-700 text-white'
            : 'border-[#e2e2ea] hover:bg-gray-50 text-[#19294a]'
        }`}
      >
        <PlusIcon className="w-4 h-4" />
        <span className="[font-family:'Poppins',Helvetica] font-medium text-[14px]">
          Ajouter Un Objectif
        </span>
      </Button>

      {/* Add objective placeholder input */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-[18px] border ${
        isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-[#e2e2ea]'
      }`}>
        <Input
          type="text"
          placeholder="Ajouter un objectif..."
          className={`flex-1 border-none shadow-none text-[15px] font-medium ${
            isDark
              ? 'text-white placeholder:text-gray-400 bg-transparent'
              : 'text-[#2D3748] placeholder:text-[#718096] bg-transparent'
          }`}
        />
      </div>

      {/* Objectives List */}
      <div className="space-y-3">
        {objectives.length === 0 && (
          <div className={`text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <p className="text-sm">Aucun objectif ajouté. Cliquez sur "Ajouter Un Objectif" pour commencer.</p>
          </div>
        )}
        {objectives.map((objective, index) => (
          <div
            key={objective.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            className={`flex items-center gap-3 px-4 py-3 rounded-[18px] border transition-all duration-200 ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-[#e2e2ea]'
            } ${
              dragOverIndex === index ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
            } ${
              draggedItem?.id === objective.id ? 'opacity-50' : ''
            }`}
          >
            {/* Grip Icon for Drag */}
            <GripVerticalIcon
              className={`w-5 h-5 cursor-move flex-shrink-0 ${
                isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
              }`}
            />

            {/* Objective Icon */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              isDark ? 'bg-blue-600' : 'bg-[#E8F3FF]'
            }`}>
              <span style={{ color: primaryColor }}>🎯</span>
            </div>

            {/* Objective Text Input */}
            <Input
              type="text"
              value={objective.text.replace(/<[^>]*>/g, '')} // Strip HTML tags for plain text display
              onChange={(e) => onUpdateObjective(objective.id, 'text', e.target.value)}
              placeholder="Entrez l'objectif..."
              className={`flex-1 border-none shadow-none text-[15px] font-medium ${
                isDark
                  ? 'text-white placeholder:text-gray-400 bg-transparent'
                  : 'text-[#2D3748] placeholder:text-[#718096] bg-transparent'
              }`}
            />

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className={`w-8 h-8 rounded-full ${
                  isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <EditIcon className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`w-8 h-8 rounded-full ${
                  isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveObjective(objective.id);
                }}
              >
                <TrashIcon className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
              </Button>
            </div>
          </div>
        ))}

        {/* Drop zone at the end */}
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

// Duration Section (placeholder)
export const DurationSection: React.FC = () => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#0066FF';

  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-6 ${isDark ? 'text-white' : 'text-[#19294a]'}`}>
        {/* Hours (HH) */}
        <div className="flex items-center gap-2">
          <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] ${
            isDark ? 'text-gray-400' : 'text-[#718096]'
          }`}>
            -
          </span>
          <div className={`flex items-center px-3 py-2 rounded-full border ${
            isDark ? 'bg-gray-600 border-gray-500' : 'bg-[#E8F3FF] border-[#E8F3FF]'
          }`}>
            <Input
              type="number"
              placeholder="0"
              min="0"
              className={`w-[40px] border-none shadow-none text-[17px] font-semibold text-center p-0 h-auto ${
                isDark
                  ? 'text-white placeholder:text-gray-400 bg-transparent'
                  : 'text-[#19294a] placeholder:text-[#718096] bg-transparent'
              }`}
            />
            <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[15px] ml-1 ${
              isDark ? 'text-white' : 'text-[#19294a]'
            }`}>
              H(s)
            </span>
          </div>
          <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] mx-2 ${
            isDark ? 'text-gray-400' : 'text-[#718096]'
          }`}>
            SOIT
          </span>
        </div>

        {/* Days (JJ) */}
        <div className="flex items-center gap-2">
          <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] ${
            isDark ? 'text-gray-400' : 'text-[#718096]'
          }`}>
            -
          </span>
          <div className={`flex items-center px-3 py-2 rounded-full border ${
            isDark ? 'bg-gray-600 border-gray-500' : 'bg-[#E8F3FF] border-[#E8F3FF]'
          }`}>
            <Input
              type="number"
              placeholder="0"
              min="0"
              className={`w-[40px] border-none shadow-none text-[17px] font-semibold text-center p-0 h-auto ${
                isDark
                  ? 'text-white placeholder:text-gray-400 bg-transparent'
                  : 'text-[#19294a] placeholder:text-[#718096] bg-transparent'
              }`}
            />
            <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[15px] ml-1 ${
              isDark ? 'text-white' : 'text-[#19294a]'
            }`}>
              J/J
            </span>
          </div>
        </div>

        {/* De Formation label */}
        <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] ${
          isDark ? 'text-gray-300' : 'text-[#19294a]'
        }`}>
          De Formation
        </span>
      </div>
    </div>
  );
};

// Public Visé Section
export const PublicViseSection: React.FC<{
  targetAudience: string;
  onUpdateTargetAudience: (content: string) => void;
}> = ({ targetAudience, onUpdateTargetAudience }) => {
  const { isDark } = useTheme();

  return (
    <div className="space-y-4">
      <RichTextEditor
        content={targetAudience}
        onChange={onUpdateTargetAudience}
        placeholder="Aucun"
        className="min-h-[120px]"
      />
    </div>
  );
};

// Prérequis Section
export const PrerequisSection: React.FC<{
  prerequisites: string;
  onUpdatePrerequisites: (content: string) => void;
}> = ({ prerequisites, onUpdatePrerequisites }) => {
  const { isDark } = useTheme();

  return (
    <div className="space-y-4">
      <RichTextEditor
        content={prerequisites}
        onChange={onUpdatePrerequisites}
        placeholder="Aucun"
        className="min-h-[120px]"
      />
    </div>
  );
};

// Prerequisites Section (keeping for backwards compatibility)
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
        {/* Price and TVA Row */}
        <div className="flex items-start gap-8">
          {/* Prix */}
          <div className="flex items-center gap-3">
            <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] ${
              isDark ? 'text-gray-400' : 'text-[#718096]'
            }`}>
              Prix HT (En €):
            </span>
            <div className={`flex items-center px-4 py-2 rounded-[18px] border ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-[#e2e2ea]'
            }`}>
              <Input
                type="number"
                value={priceHT || ''}
                onChange={(e) => onUpdatePriceHT(parseFloat(e.target.value) || 0)}
                placeholder="0"
                min="0"
                step="0.01"
                className={`w-[80px] border-none shadow-none text-[17px] font-semibold text-center p-0 h-auto ${
                  isDark
                    ? 'text-white placeholder:text-gray-400 bg-transparent'
                    : 'text-[#19294a] placeholder:text-[#718096] bg-transparent'
                }`}
              />
            </div>
            <span className={`[font-family:'Poppins',Helvetica] font-medium text-[15px] ${
              isDark ? 'text-gray-400' : 'text-[#718096]'
            }`}>
              TVA(En %):
            </span>
            <div className={`flex items-center px-4 py-2 rounded-[18px] border ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-[#e2e2ea]'
            }`}>
              <Input
                type="number"
                value={vatPercentage || ''}
                onChange={(e) => onUpdateVATPercentage(parseFloat(e.target.value) || 0)}
                placeholder="20"
                min="0"
                max="100"
                step="0.01"
                className={`w-[60px] border-none shadow-none text-[17px] font-semibold text-center p-0 h-auto ${
                  isDark
                    ? 'text-white placeholder:text-gray-400 bg-transparent'
                    : 'text-[#19294a] placeholder:text-[#718096] bg-transparent'
                }`}
              />
            </div>
          </div>

          {/* Frais annexes section */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[15px] ${
                isDark ? 'text-white' : 'text-[#19294a]'
              }`}>
                Frais annexes ({additionalFees.length})
              </span>
              <span className={`text-[13px] ${isDark ? 'text-gray-400' : 'text-[#718096]'}`}>*</span>
            </div>

            {/* Fee Cards - Horizontal Layout */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Frais Complémentaires Card */}
              <div className={`flex items-center gap-3 px-4 py-3 rounded-[18px] border ${
                isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-[#e2e2ea]'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-blue-600' : 'bg-[#E8F3FF]'
                }`}>
                  <span style={{ color: primaryColor }}>💰</span>
                </div>
                <div>
                  <span className={`[font-family:'Poppins',Helvetica] font-medium text-[14px] block ${
                    isDark ? 'text-white' : 'text-[#19294a]'
                  }`}>
                    Frais Complémentaires
                  </span>
                  <span className={`text-[12px] ${isDark ? 'text-gray-400' : 'text-[#718096]'}`}>
                    (TVA À 20%)
                  </span>
                </div>
                <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[14px] ml-4 ${
                  isDark ? 'text-white' : 'text-[#19294a]'
                }`}>
                  150€ HT
                </span>
              </div>

              {/* Import Du Catalogue Card */}
              <div className={`flex items-center gap-3 px-4 py-3 rounded-[18px] border ${
                isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-[#e2e2ea]'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-green-600' : 'bg-[#E8FFE8]'
                }`}>
                  <span>📁</span>
                </div>
                <div>
                  <span className={`[font-family:'Poppins',Helvetica] font-medium text-[14px] block ${
                    isDark ? 'text-white' : 'text-[#19294a]'
                  }`}>
                    Import Du Catalogue De Formations
                  </span>
                  <span className={`text-[12px] ${isDark ? 'text-gray-400' : 'text-[#718096]'}`}>
                    (TVA À 20%)
                  </span>
                </div>
                <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[14px] ml-4 ${
                  isDark ? 'text-white' : 'text-[#19294a]'
                }`}>
                  150€ HT/Jour
                </span>
              </div>

              {/* Dynamic Fee Cards */}
              {additionalFees.map((fee) => (
                <div
                  key={fee.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-[18px] border ${
                    isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-[#e2e2ea]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-purple-600' : 'bg-[#F3E8FF]'
                  }`}>
                    <span>📋</span>
                  </div>
                  <div>
                    <span className={`[font-family:'Poppins',Helvetica] font-medium text-[14px] block ${
                      isDark ? 'text-white' : 'text-[#19294a]'
                    }`}>
                      {fee.name}
                    </span>
                    {fee.vat_applied && (
                      <span className={`text-[12px] ${isDark ? 'text-gray-400' : 'text-[#718096]'}`}>
                        (TVA À {vatPercentage}%)
                      </span>
                    )}
                  </div>
                  <span className={`[font-family:'Poppins',Helvetica] font-semibold text-[14px] ml-4 ${
                    isDark ? 'text-white' : 'text-[#19294a]'
                  }`}>
                    {fee.amount}€ HT{fee.unit && `/${fee.unit}`}
                  </span>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6"
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
                      <EditIcon className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 text-red-600 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveAdditionalFee(fee.id);
                      }}
                    >
                      <TrashIcon className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Add Fee Button */}
              <Button
                data-action="add-additional-fee"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleOpenModal();
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-[18px] border-dashed ${
                  isDark
                    ? 'border-gray-500 hover:bg-gray-700'
                    : 'border-[#e2e2ea] hover:bg-gray-50'
                }`}
              >
                <PlusIcon className="w-4 h-4" />
                <span className="[font-family:'Poppins',Helvetica] font-medium text-[14px]">
                  Ajouter Un Frais Annexe
                </span>
              </Button>
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
