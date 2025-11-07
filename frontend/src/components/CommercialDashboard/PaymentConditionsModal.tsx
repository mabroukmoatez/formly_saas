import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOrganization } from '../../contexts/OrganizationContext';

interface PaymentScheduleItem {
  id: string;
  amount?: number;
  percentage?: number;
  payment_condition: string;
  date: string;
  payment_method: string;
  bank_id?: number;
}

interface PaymentConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: PaymentScheduleItem[], customText: string, options: any) => void;
  totalAmount: number;
  existingPaymentTerms?: string;
}

export const PaymentConditionsModal: React.FC<PaymentConditionsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  totalAmount,
  existingPaymentTerms,
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';

  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [scheduleItems, setScheduleItems] = useState<PaymentScheduleItem[]>([
    {
      id: Date.now().toString(),
      amount: totalAmount,
      percentage: 100,
      payment_condition: 'Paiement comptant',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'bank_transfer',
    },
  ]);
  const [customText, setCustomText] = useState(existingPaymentTerms || '');
  const [showAmounts, setShowAmounts] = useState(true);
  const [showPercentages, setShowPercentages] = useState(true);
  const [showDates, setShowDates] = useState(true);
  const [showConditions, setShowConditions] = useState(true);

  const paymentTemplates = [
    { id: 'cash', name: 'Comptant', days: 0, percentage: 100 },
    { id: 'reception', name: 'À Réception', days: 0, percentage: 100 },
    { id: '30days', name: '30 Jours Fin De Mois', days: 30, percentage: 100 },
    { id: '45days', name: '45 Jours Fin De Mois', days: 45, percentage: 100 },
  ];

  const paymentMethods = [
    { value: 'bank_transfer', label: 'Virement bancaire' },
    { value: 'bank_card', label: 'Carte bancaire' },
    { value: 'check', label: 'Chèque' },
    { value: 'cash', label: 'Espèces' },
  ];

  useEffect(() => {
    if (isOpen && existingPaymentTerms) {
      setCustomText(existingPaymentTerms);
    }
  }, [isOpen, existingPaymentTerms]);

  useEffect(() => {
    if (isOpen && !existingPaymentTerms) {
      generatePaymentText();
    }
  }, [scheduleItems, showAmounts, showPercentages, showDates, showConditions]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = paymentTemplates.find((t) => t.id === templateId);
    if (template) {
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + template.days);
      
      setScheduleItems([
        {
          id: Date.now().toString(),
          amount: (totalAmount * template.percentage) / 100,
          percentage: template.percentage,
          payment_condition: template.name,
          date: newDate.toISOString().split('T')[0],
          payment_method: template.id === 'cash' ? 'cash' : 'bank_transfer',
        },
      ]);
    }
  };

  const addScheduleItem = () => {
    const remainingPercentage = 100 - scheduleItems.reduce((sum, item) => sum + (item.percentage || 0), 0);
    const remainingAmount = totalAmount - scheduleItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    
    setScheduleItems([
      ...scheduleItems,
      {
        id: Date.now().toString(),
        amount: remainingAmount > 0 ? remainingAmount : 0,
        percentage: remainingPercentage > 0 ? remainingPercentage : 0,
        payment_condition: 'Paiement partiel',
        date: new Date().toISOString().split('T')[0],
        payment_method: 'bank_transfer',
      },
    ]);
  };

  const removeScheduleItem = (id: string) => {
    if (scheduleItems.length > 1) {
      setScheduleItems(scheduleItems.filter((item) => item.id !== id));
    }
  };

  const updateScheduleItem = (id: string, field: keyof PaymentScheduleItem, value: any) => {
    setScheduleItems(
      scheduleItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          
          // Auto-calculate percentage when amount changes
          if (field === 'amount') {
            updated.percentage = totalAmount > 0 ? Number(((value / totalAmount) * 100).toFixed(2)) : 0;
          }
          
          // Auto-calculate amount when percentage changes
          if (field === 'percentage') {
            updated.amount = Number(((value / 100) * totalAmount).toFixed(2));
          }
          
          return updated;
        }
        return item;
      })
    );
  };

  const generatePaymentText = () => {
    if (scheduleItems.length === 0) {
      setCustomText('');
      return;
    }

    let text = 'condition de paiement: ';
    const parts: string[] = [];

    scheduleItems.forEach((item, index) => {
      const itemParts: string[] = [];
      
      if (showPercentages && item.percentage) {
        itemParts.push(`${item.percentage}%`);
      }
      
      if (showAmounts && item.amount) {
        itemParts.push(`soit ${item.amount.toFixed(2)} €`);
      }
      
      if (showConditions) {
        itemParts.push(`à payer ${item.payment_condition.toLowerCase()}`);
      }
      
      if (showDates && item.date) {
        const date = new Date(item.date);
        itemParts.push(`le: ${date.toLocaleDateString('fr-FR')}`);
      }

      if (itemParts.length > 0) {
        parts.push(itemParts.join(' '));
      }
    });

    text += parts.join(', ');
    setCustomText(text);
  };

  const handleSave = () => {
    onSave(scheduleItems, customText, {
      showAmounts,
      showPercentages,
      showDates,
      showConditions,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <Card className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Gestion des échéances & paiements
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Pré-remplissage des conditions:
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Template Selection */}
          <div className="flex flex-wrap gap-3 mb-6">
            {paymentTemplates.map((template) => (
              <Button
                key={template.id}
                variant={selectedTemplate === template.id ? 'default' : 'outline'}
                onClick={() => handleTemplateSelect(template.id)}
                className={`${selectedTemplate === template.id ? '' : 'bg-transparent'}`}
                style={selectedTemplate === template.id ? { backgroundColor: primaryColor } : {}}
              >
                <Check
                  className={`h-4 w-4 mr-2 ${selectedTemplate === template.id ? 'opacity-100' : 'opacity-0'}`}
                />
                {template.name}
              </Button>
            ))}
          </div>

          {/* Payment Schedule */}
          <div className="mb-6">
            <Label className="text-lg font-semibold mb-4 block">
              SAISIE DES ÉCHÉANCES ET PAIEMENTS
            </Label>
            
            <div className="space-y-4">
              {scheduleItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}
                >
                  <div className="grid grid-cols-6 gap-4 items-end">
                    <div>
                      <Label>Montant</Label>
                      <Input
                        type="number"
                        value={item.amount || ''}
                        onChange={(e) =>
                          updateScheduleItem(item.id, 'amount', parseFloat(e.target.value) || 0)
                        }
                        className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                      />
                    </div>
                    <div>
                      <Label>Pourcentage</Label>
                      <Input
                        type="number"
                        value={item.percentage || ''}
                        onChange={(e) =>
                          updateScheduleItem(item.id, 'percentage', parseFloat(e.target.value) || 0)
                        }
                        className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                      />
                    </div>
                    <div>
                      <Label>Conditions</Label>
                      <Input
                        value={item.payment_condition}
                        onChange={(e) =>
                          updateScheduleItem(item.id, 'payment_condition', e.target.value)
                        }
                        className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                      />
                    </div>
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={item.date}
                        onChange={(e) => updateScheduleItem(item.id, 'date', e.target.value)}
                        className={isDark ? 'bg-gray-700 border-gray-600' : ''}
                      />
                    </div>
                    <div>
                      <Label>Mode de paiement</Label>
                      <select
                        value={item.payment_method}
                        onChange={(e) =>
                          updateScheduleItem(item.id, 'payment_method', e.target.value)
                        }
                        className={`w-full h-10 px-3 rounded-md border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                      >
                        {paymentMethods.map((method) => (
                          <option key={method.value} value={method.value}>
                            {method.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end gap-2">
                      {scheduleItems.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeScheduleItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={addScheduleItem}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une échéance
              </Button>
            </div>
          </div>

          {/* Invoice Text Preview */}
          <div className="mb-6">
            <Label className="text-lg font-semibold mb-4 block">
              TEXTE APPARAISSANT SUR LA FACTURE
            </Label>
            <div className={`p-4 rounded-lg ${isDark ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border`}>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className={`w-full min-h-[100px] p-3 rounded resize-none ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-900'}`}
                placeholder="Texte de condition de paiement..."
              />
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Vous pouvez "écraser" le texte proposé par un texte de votre choix.
              </p>
            </div>

            {/* Options */}
            <div className="flex flex-wrap gap-4 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAmounts}
                  onChange={(e) => setShowAmounts(e.target.checked)}
                />
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Montants</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPercentages}
                  onChange={(e) => setShowPercentages(e.target.checked)}
                />
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Pourcentages</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDates}
                  onChange={(e) => setShowDates(e.target.checked)}
                />
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Dates</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showConditions}
                  onChange={(e) => setShowConditions(e.target.checked)}
                />
                <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Conditions</span>
              </label>
            </div>
          </div>
        </CardContent>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-4 p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            style={{ backgroundColor: primaryColor }}
          >
            Enregistrer
          </Button>
        </div>
      </Card>
    </div>
  );
};

