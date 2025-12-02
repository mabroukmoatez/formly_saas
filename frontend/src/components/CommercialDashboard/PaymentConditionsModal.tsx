import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

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

type PreFillOption = 'comptant' | 'reception' | '30jours' | '45jours' | null;

export const PaymentConditionsModal: React.FC<PaymentConditionsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  totalAmount,
  existingPaymentTerms,
}) => {
  const [preFillOption, setPreFillOption] = useState<PreFillOption>('comptant');
  const [scheduleItems, setScheduleItems] = useState<PaymentScheduleItem[]>([
    {
      id: Date.now().toString(),
      amount: totalAmount,
      percentage: 100,
      payment_condition: 'Paiement comptant',
      date: new Date().toISOString().split('T')[0],
      payment_method: 'Virement bancaire',
    },
  ]);
  const [customText, setCustomText] = useState('');
  const [includeAmounts, setIncludeAmounts] = useState(true);
  const [includePercentages, setIncludePercentages] = useState(true);
  const [includeDates, setIncludeDates] = useState(true);
  const [includeConditions, setIncludeConditions] = useState(true);

  useEffect(() => {
    if (isOpen) {
      generatePaymentText();
    }
  }, [scheduleItems, includeAmounts, includePercentages, includeDates, includeConditions, isOpen]);

  const handlePreFillSelect = (option: PreFillOption) => {
    setPreFillOption(option);

    const baseDate = new Date();
    let paymentCondition = '';
    let days = 0;

    switch (option) {
      case 'comptant':
        paymentCondition = 'Paiement comptant';
        days = 0;
        break;
      case 'reception':
        paymentCondition = 'À réception';
        days = 0;
        break;
      case '30jours':
        paymentCondition = 'À 30 jours fin de mois';
        days = 30;
        break;
      case '45jours':
        paymentCondition = 'À 45 jours fin de mois';
        days = 45;
        break;
    }

    baseDate.setDate(baseDate.getDate() + days);

    setScheduleItems([{
      id: Date.now().toString(),
      amount: totalAmount,
      percentage: 100,
      payment_condition: paymentCondition,
      date: baseDate.toISOString().split('T')[0],
      payment_method: 'Virement bancaire',
    }]);
  };

  const updateScheduleItem = (id: string, field: keyof PaymentScheduleItem, value: any) => {
    setScheduleItems(items => {
      const updatedItems = items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };

          // Auto-calculate between amount and percentage
          if (field === 'amount') {
            updated.percentage = totalAmount > 0 ? Number(((parseFloat(value) / totalAmount) * 100).toFixed(2)) : 0;
          }
          if (field === 'percentage') {
            updated.amount = Number(((parseFloat(value) / 100) * totalAmount).toFixed(2));
          }

          return updated;
        }
        return item;
      });

      // Auto-add remaining percentage line
      if (field === 'percentage' || field === 'amount') {
        const totalPercentage = updatedItems.reduce((sum, item) => sum + (item.percentage || 0), 0);
        const remainingPercentage = 100 - totalPercentage;

        // Remove any existing "Reste" items
        const nonAutoItems = updatedItems.filter(item => !item.payment_condition.toLowerCase().includes('reste'));

        // If there's a remaining percentage and we don't have 100%, auto-add it
        if (remainingPercentage > 0 && remainingPercentage < 100 && nonAutoItems.length > 0) {
          const remainingAmount = totalAmount - nonAutoItems.reduce((sum, item) => sum + (item.amount || 0), 0);
          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + 30);

          return [
            ...nonAutoItems,
            {
              id: `auto-${Date.now()}`,
              amount: Number(remainingAmount.toFixed(2)),
              percentage: Number(remainingPercentage.toFixed(2)),
              payment_condition: 'Reste à payer',
              date: nextDate.toISOString().split('T')[0],
              payment_method: 'Virement bancaire',
            }
          ];
        }

        return nonAutoItems;
      }

      return updatedItems;
    });
  };

  const generatePaymentText = () => {
    const parts: string[] = [];

    scheduleItems.forEach((item, index) => {
      const itemParts: string[] = [];

      if (includePercentages && item.percentage) {
        itemParts.push(`${item.percentage.toFixed(2)}%`);
      }

      if (includeAmounts && item.amount) {
        itemParts.push(`soit ${item.amount.toFixed(2)} €`);
      }

      if (includeConditions && item.payment_condition) {
        itemParts.push(`à payer ${item.payment_condition.toLowerCase()}`);
      }

      if (includeDates && item.date) {
        const formattedDate = new Date(item.date).toLocaleDateString('fr-FR');
        itemParts.push(`le : ${formattedDate}`);
      }

      if (itemParts.length > 0) {
        parts.push(`• ${itemParts.join(' ')}.`);
      }
    });

    const text = parts.join('\n');
    setCustomText(text);
  };

  const handleSave = () => {
    onSave(scheduleItems, customText, {
      includeAmounts,
      includePercentages,
      includeDates,
      includeConditions,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-[18px] w-full max-w-[900px] max-h-[90vh] overflow-hidden font-['Poppins',sans-serif]">
        <div className="absolute border border-[#dbd9d9] inset-0 pointer-events-none rounded-[18px] shadow-[0px_0px_75.3px_0px_rgba(25,41,74,0.24)]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-[20px] top-[12.5px] size-[30.667px] rounded-full bg-[#e8f0f7] flex items-center justify-center hover:opacity-80 transition-opacity z-10"
        >
          <X className="w-5 h-5 text-[#6a90ba]" strokeWidth={2} />
        </button>

        <div className="flex flex-col gap-[28px] p-[20px] pt-[59px] pb-[20px] overflow-y-auto max-h-[90vh]">
          {/* Main Content */}
          <div className="flex flex-col gap-[37px] items-center">
            <div className="flex flex-col gap-[24px] w-full">
              {/* Header Section */}
              <div className="bg-white flex flex-col gap-[16px] items-center justify-center py-[9px] rounded-[5px]">
                <p className="text-[17px] font-semibold text-[#19294a]">Gestion des échéances & paiements</p>

                {/* Pre-fill Options */}
                <div className="flex flex-col gap-[10px] items-center">
                  <p className="text-[17px] text-[#19294a]">Pré-remplissage des conditions :</p>

                  <div className="bg-[rgba(235,241,255,0.45)] flex gap-[24px] items-center px-[31px] py-[12px] rounded-[20px]">
                    {/* Comptant */}
                    <button
                      onClick={() => handlePreFillSelect('comptant')}
                      className="flex gap-[8px] items-center cursor-pointer"
                    >
                      <div className={`${preFillOption === 'comptant' ? 'bg-[#e5f3ff]' : 'bg-white'} relative rounded-[4px] size-[16px] border ${preFillOption === 'comptant' ? 'border-[#007aff]' : 'border-[#6a90ba]'}`}>
                        {preFillOption === 'comptant' && (
                          <svg className="absolute inset-[12.5%]" fill="none" viewBox="0 0 12 12">
                            <path d="M10 3L4.5 8.5L2 6" stroke="#007AFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6666" />
                          </svg>
                        )}
                      </div>
                      <p className={`capitalize text-[14px] font-medium ${preFillOption === 'comptant' ? 'text-[#007aff]' : 'text-[#6a90ba]'}`}>Comptant</p>
                    </button>

                    {/* À réception */}
                    <button
                      onClick={() => handlePreFillSelect('reception')}
                      className="flex gap-[8px] items-center cursor-pointer"
                    >
                      <div className={`${preFillOption === 'reception' ? 'bg-[#e5f3ff]' : 'bg-white'} relative rounded-[4px] size-[16px] border ${preFillOption === 'reception' ? 'border-[#007aff]' : 'border-[#6a90ba]'}`}>
                        {preFillOption === 'reception' && (
                          <svg className="absolute inset-[12.5%]" fill="none" viewBox="0 0 12 12">
                            <path d="M10 3L4.5 8.5L2 6" stroke="#007AFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6666" />
                          </svg>
                        )}
                      </div>
                      <p className={`capitalize text-[14px] font-medium ${preFillOption === 'reception' ? 'text-[#007aff]' : 'text-[#6a90ba]'}`}>À réception</p>
                    </button>

                    {/* À 30 jours */}
                    <button
                      onClick={() => handlePreFillSelect('30jours')}
                      className="flex gap-[8px] items-center cursor-pointer"
                    >
                      <div className={`${preFillOption === '30jours' ? 'bg-[#e5f3ff]' : 'bg-white'} relative rounded-[4px] size-[16px] border ${preFillOption === '30jours' ? 'border-[#007aff]' : 'border-[#6a90ba]'}`}>
                        {preFillOption === '30jours' && (
                          <svg className="absolute inset-[12.5%]" fill="none" viewBox="0 0 12 12">
                            <path d="M10 3L4.5 8.5L2 6" stroke="#007AFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6666" />
                          </svg>
                        )}
                      </div>
                      <p className={`capitalize text-[14px] font-medium ${preFillOption === '30jours' ? 'text-[#007aff]' : 'text-[#6a90ba]'}`}>À 30 jours fin de mois</p>
                    </button>

                    {/* À 45 jours */}
                    <button
                      onClick={() => handlePreFillSelect('45jours')}
                      className="flex gap-[8px] items-center cursor-pointer"
                    >
                      <div className={`${preFillOption === '45jours' ? 'bg-[#e5f3ff]' : 'bg-white'} relative rounded-[4px] size-[16px] border ${preFillOption === '45jours' ? 'border-[#007aff]' : 'border-[#6a90ba]'}`}>
                        {preFillOption === '45jours' && (
                          <svg className="absolute inset-[12.5%]" fill="none" viewBox="0 0 12 12">
                            <path d="M10 3L4.5 8.5L2 6" stroke="#007AFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6666" />
                          </svg>
                        )}
                      </div>
                      <p className={`capitalize text-[14px] font-medium ${preFillOption === '45jours' ? 'text-[#007aff]' : 'text-[#6a90ba]'}`}>À 45 jours fin de mois</p>
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Section */}
              <div className="flex flex-col gap-[24px]">
                <div className="flex flex-col gap-[16px]">
                  <p className="text-[17px] font-semibold text-[#19294a] uppercase">Saisie des échéances et paiements</p>

                  {/* Table */}
                  <div className="flex flex-col">
                    {/* Header Row 1 */}
                    <div className="bg-white border border-dashed border-[#6a90ba] rounded-t-[8px] px-[14px]">
                      <div className="flex gap-[8px] items-center h-[42px]">
                        <p className="text-[14px] text-[#6a90ba] w-[207px]">À saisir</p>
                        <div className="w-px h-full border-l border-dashed border-[#6a90ba]" />
                        <p className="text-[14px] text-[#6a90ba]">Échéances</p>
                      </div>
                    </div>

                    {/* Header Row 2 */}
                    <div className="bg-white border-x border-b border-dashed border-[#6a90ba] rounded-b-[8px] px-[14px]">
                      <div className="flex gap-[8px] items-center h-[42px]">
                        <div className="flex gap-[8px] items-center w-[207px]">
                          <p className="text-[14px] text-[#6a90ba] w-[92px]">Montant</p>
                          <div className="w-px h-full border-l border-dashed border-[#6a90ba]" />
                          <p className="text-[14px] text-[#6a90ba] w-[115px]">Pourcentage</p>
                        </div>
                        <div className="w-px h-full border-l border-dashed border-[#6a90ba]" />
                        <p className="text-[14px] text-[#6a90ba] flex-1">Conditions de paiement</p>
                        <div className="w-px h-full border-l border-dashed border-[#6a90ba]" />
                        <p className="text-[14px] text-[#6a90ba] w-[85px]">Date</p>
                        <div className="w-px h-full border-l border-dashed border-[#6a90ba]" />
                        <p className="text-[14px] text-[#6a90ba]">Mode de paiement</p>
                        <div className="w-px h-full border-l border-dashed border-[#6a90ba]" />
                        <p className="text-[14px] text-[#6a90ba] w-[110px] text-center">Banque</p>
                      </div>
                    </div>

                    {/* Data Rows */}
                    {scheduleItems.map((item) => (
                      <div key={item.id} className="bg-white px-[5px] py-[13px]">
                        <div className="flex gap-[8px] items-center">
                          {/* Amount & Percentage */}
                          <div className="flex gap-[8px] w-[223px]">
                            <div className="bg-[#ebf1ff] rounded-[8px] px-2 py-[8px] w-[103px] flex items-center justify-center gap-1">
                              <input
                                type="number"
                                step="0.01"
                                value={item.amount || ''}
                                onChange={(e) => updateScheduleItem(item.id, 'amount', e.target.value)}
                                className="bg-transparent text-[13px] text-[#19294a] border-none outline-none w-14 text-center"
                              />
                              <span className="text-[14px] text-[#19294a]">€</span>
                            </div>
                            <div className="bg-[#ebf1ff] rounded-[8px] px-2 py-[8px] w-[108px] flex items-center justify-center gap-1">
                              <input
                                type="number"
                                step="0.01"
                                value={item.percentage || ''}
                                onChange={(e) => updateScheduleItem(item.id, 'percentage', e.target.value)}
                                className="bg-transparent text-[13px] text-[#19294a] border-none outline-none w-14 text-center"
                              />
                              <span className="text-[13px] text-[#19294a]">%</span>
                            </div>
                          </div>

                          {/* Conditions */}
                          <div className="bg-[#ebf1ff] rounded-[8px] px-2 py-[8px] flex-1">
                            <input
                              type="text"
                              value={item.payment_condition}
                              onChange={(e) => updateScheduleItem(item.id, 'payment_condition', e.target.value)}
                              className="bg-transparent text-[13px] text-[#6a90ba] border-none outline-none w-full text-center"
                            />
                          </div>

                          {/* Date */}
                          <div className="bg-[#ebf1ff] rounded-[8px] px-2 py-[8px] w-[89px]">
                            <input
                              type="date"
                              value={item.date}
                              onChange={(e) => updateScheduleItem(item.id, 'date', e.target.value)}
                              className="bg-transparent text-[13px] text-[#19294a] border-none outline-none w-full text-center"
                            />
                          </div>

                          {/* Payment Mode */}
                          <div className="bg-[#ebf1ff] rounded-[8px] px-2 py-[8px] w-[137px]">
                            <input
                              type="text"
                              value={item.payment_method}
                              onChange={(e) => updateScheduleItem(item.id, 'payment_method', e.target.value)}
                              className="bg-transparent text-[13px] text-[#19294a] border-none outline-none w-full text-center"
                            />
                          </div>

                          {/* Bank */}
                          <div className="bg-[#ebf1ff] rounded-[8px] px-2 py-[8px] w-[111px]">
                            <input
                              type="text"
                              placeholder="Nom"
                              className="bg-transparent text-[14px] text-[#19294a] border-none outline-none w-full text-center"
                            />
                          </div>

                          {/* Checkbox placeholder */}
                          <div className="w-[46px] flex justify-center">
                            <div className="bg-white border border-[#6a90ba] rounded-[4px] size-[16px]" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Text Display Section */}
              <div className="flex flex-col gap-[3px]">
                <div className="flex flex-col gap-[16px]">
                  <p className="text-[17px] font-semibold text-[#19294a] uppercase">Texte apparaissant sur la facture</p>

                  <div className="bg-[#ffe6ca] border border-dashed border-[#ff7700] rounded-[5px] p-[17.647px] min-h-[89px]">
                    <p className="text-[11.765px] font-semibold text-[#19294a] mb-2">condition de paiement:</p>
                    <div className="text-[11.765px] text-[#19294a] whitespace-pre-wrap">
                      {customText || '• 100.00% soit ' + totalAmount.toFixed(2) + ' € à payer paiement comptant.'}
                    </div>
                  </div>
                </div>

                <p className="text-[11.765px] text-[#ff7700] ml-[17.6475px]">• Vous pouvez "écraser" le texte proposé par un texte de votre choix</p>
              </div>

              {/* Display Options */}
              <div className="flex gap-[24px] items-center justify-center px-[31px] py-[12px]">
                <button onClick={() => setIncludeAmounts(!includeAmounts)} className="flex gap-[8px] items-center cursor-pointer">
                  <div className={`${includeAmounts ? 'bg-[#e5f3ff]' : 'bg-white'} relative rounded-[4px] size-[16px] border ${includeAmounts ? 'border-[#007aff]' : 'border-[#6a90ba]'}`}>
                    {includeAmounts && (
                      <svg className="absolute inset-[12.5%]" fill="none" viewBox="0 0 12 12">
                        <path d="M10 3L4.5 8.5L2 6" stroke="#007AFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6666" />
                      </svg>
                    )}
                  </div>
                  <p className={`capitalize text-[13px] font-medium ${includeAmounts ? 'text-[#007aff]' : 'text-[#6a90ba]'}`}>Montants</p>
                </button>

                <button onClick={() => setIncludePercentages(!includePercentages)} className="flex gap-[8px] items-center cursor-pointer">
                  <div className={`${includePercentages ? 'bg-[#e5f3ff]' : 'bg-white'} relative rounded-[4px] size-[16px] border ${includePercentages ? 'border-[#007aff]' : 'border-[#6a90ba]'}`}>
                    {includePercentages && (
                      <svg className="absolute inset-[12.5%]" fill="none" viewBox="0 0 12 12">
                        <path d="M10 3L4.5 8.5L2 6" stroke="#007AFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6666" />
                      </svg>
                    )}
                  </div>
                  <p className={`capitalize text-[13px] font-medium ${includePercentages ? 'text-[#007aff]' : 'text-[#6a90ba]'}`}>Pourcentages</p>
                </button>

                <button onClick={() => setIncludeDates(!includeDates)} className="flex gap-[8px] items-center cursor-pointer">
                  <div className={`${includeDates ? 'bg-[#e5f3ff]' : 'bg-white'} relative rounded-[4px] size-[16px] border ${includeDates ? 'border-[#007aff]' : 'border-[#6a90ba]'}`}>
                    {includeDates && (
                      <svg className="absolute inset-[12.5%]" fill="none" viewBox="0 0 12 12">
                        <path d="M10 3L4.5 8.5L2 6" stroke="#007AFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6666" />
                      </svg>
                    )}
                  </div>
                  <p className={`capitalize text-[13px] font-medium ${includeDates ? 'text-[#007aff]' : 'text-[#6a90ba]'}`}>Dates</p>
                </button>

                <button onClick={() => setIncludeConditions(!includeConditions)} className="flex gap-[8px] items-center cursor-pointer">
                  <div className={`${includeConditions ? 'bg-[#e5f3ff]' : 'bg-white'} relative rounded-[4px] size-[16px] border ${includeConditions ? 'border-[#007aff]' : 'border-[#6a90ba]'}`}>
                    {includeConditions && (
                      <svg className="absolute inset-[12.5%]" fill="none" viewBox="0 0 12 12">
                        <path d="M10 3L4.5 8.5L2 6" stroke="#007AFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6666" />
                      </svg>
                    )}
                  </div>
                  <p className={`capitalize text-[13px] font-medium ${includeConditions ? 'text-[#007aff]' : 'text-[#6a90ba]'}`}>Conditions</p>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-[10px] justify-end h-[40px]">
              <button
                onClick={onClose}
                className="border border-[#6a90ba] rounded-[10px] px-[16px] py-[10px] h-[40px] flex items-center justify-center hover:opacity-70 transition-opacity"
              >
                <p className="capitalize text-[13px] font-medium text-[#7e8ca9]">annuler</p>
              </button>

              <button
                onClick={handleSave}
                className="bg-[#007aff] rounded-[10px] px-[16px] py-[10px] h-[40px] flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <p className="capitalize text-[13px] font-medium text-white">Enregistrer</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
