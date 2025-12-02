import { useState } from 'react';
import svgPaths from '../imports/svg-cig62peixh';

interface PaymentConditionsModalProps {
  onClose?: () => void;
  onSave?: (data: PaymentConditionsData) => void;
}

interface PaymentConditionsData {
  preFillOption: 'comptant' | 'reception' | '30jours' | '45jours' | null;
  amount: string;
  percentage: string;
  paymentCondition: string;
  date: string;
  paymentMode: string;
  bank: string;
  includeAmounts: boolean;
  includePercentages: boolean;
  includeDates: boolean;
  includeConditions: boolean;
}

export function PaymentConditionsModal({ onClose, onSave }: PaymentConditionsModalProps) {
  const [preFillOption, setPreFillOption] = useState<'comptant' | 'reception' | '30jours' | '45jours' | null>('comptant');
  const [amount, setAmount] = useState('55.214');
  const [percentage] = useState('Montant');
  const [paymentCondition, setPaymentCondition] = useState('Paiement comptant');
  const [date, setDate] = useState('14-05-2025');
  const [paymentMode, setPaymentMode] = useState('Carte bancaire');
  const [bank, setBank] = useState('Nom');
  const [includeAmounts, setIncludeAmounts] = useState(true);
  const [includePercentages, setIncludePercentages] = useState(true);
  const [includeDates, setIncludeDates] = useState(true);
  const [includeConditions, setIncludeConditions] = useState(true);

  const handleSave = () => {
    if (onSave) {
      onSave({
        preFillOption,
        amount,
        percentage,
        paymentCondition,
        date,
        paymentMode,
        bank,
        includeAmounts,
        includePercentages,
        includeDates,
        includeConditions,
      });
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="bg-white relative rounded-[18px] size-full">
      <div aria-hidden="true" className="absolute border border-[#dbd9d9] border-solid inset-0 pointer-events-none rounded-[18px] shadow-[0px_0px_75.3px_0px_rgba(25,41,74,0.24)]" />
      <div className="flex flex-col justify-end size-full">
        <div className="box-border content-stretch flex flex-col gap-[28px] items-start justify-end pb-[20px] pt-[59px] px-[20px] relative size-full overflow-auto">
          {/* Main Content */}
          <div className="content-stretch flex flex-col gap-[37px] items-center justify-center relative shrink-0 w-full">
            <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0">
              {/* Header Section */}
              <div className="bg-white box-border content-stretch flex flex-col gap-[16px] items-center justify-center px-0 py-[9px] relative rounded-[5px] shrink-0 w-full">
                <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">{`Gestion des échéances & paiements`}</p>
                
                {/* Pre-fill Options */}
                <div className="content-stretch flex flex-col gap-[10px] items-center relative shrink-0">
                  <p className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">Pré-remplissage des conditions :</p>
                  
                  <div className="bg-[rgba(235,241,255,0.45)] box-border content-stretch flex gap-[24px] items-center px-[31px] py-[12px] relative rounded-[20px] shrink-0">
                    {/* Comptant */}
                    <button
                      onClick={() => setPreFillOption('comptant')}
                      className="content-stretch flex gap-[8px] items-center relative shrink-0 cursor-pointer"
                    >
                      <div className={`${preFillOption === 'comptant' ? 'bg-[#e5f3ff]' : 'bg-white'} relative rounded-[4px] shrink-0 size-[16px]`}>
                        {preFillOption === 'comptant' && (
                          <div className="overflow-clip relative rounded-[inherit] size-[16px]">
                            <div className="absolute inset-[12.5%]">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
                                <g id="check">
                                  <path d="M10 3L4.5 8.5L2 6" id="Icon" stroke="var(--stroke-0, #007AFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6666" />
                                </g>
                              </svg>
                            </div>
                          </div>
                        )}
                        <div aria-hidden="true" className={`absolute border ${preFillOption === 'comptant' ? 'border-[#007aff]' : 'border-[#6a90ba]'} border-solid inset-0 pointer-events-none rounded-[4px]`} />
                      </div>
                      <p className={`capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 ${preFillOption === 'comptant' ? 'text-[#007aff]' : 'text-[#6a90ba]'} text-[14px] text-nowrap whitespace-pre`}>Comptant</p>
                    </button>

                    {/* À réception */}
                    <button
                      onClick={() => setPreFillOption('reception')}
                      className="content-stretch flex gap-[8px] items-center relative shrink-0 cursor-pointer"
                    >
                      <div className={`${preFillOption === 'reception' ? 'bg-[#e5f3ff]' : 'bg-white'} relative rounded-[4px] shrink-0 size-[16px]`}>
                        {preFillOption === 'reception' && (
                          <div className="overflow-clip relative rounded-[inherit] size-[16px]">
                            <div className="absolute inset-[12.5%]">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
                                <g id="check">
                                  <path d="M10 3L4.5 8.5L2 6" id="Icon" stroke="var(--stroke-0, #007AFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6666" />
                                </g>
                              </svg>
                            </div>
                          </div>
                        )}
                        <div aria-hidden="true" className={`absolute border ${preFillOption === 'reception' ? 'border-[#007aff]' : 'border-[#6a90ba]'} border-solid inset-0 pointer-events-none rounded-[4px]`} />
                      </div>
                      <p className={`capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 ${preFillOption === 'reception' ? 'text-[#007aff]' : 'text-[#6a90ba]'} text-[14px] text-nowrap whitespace-pre`}>À réception</p>
                    </button>

                    {/* À 30 jours fin de mois */}
                    <button
                      onClick={() => setPreFillOption('30jours')}
                      className="content-stretch flex gap-[8px] items-center relative shrink-0 cursor-pointer"
                    >
                      <div className={`${preFillOption === '30jours' ? 'bg-[#e5f3ff]' : 'bg-white'} relative rounded-[4px] shrink-0 size-[16px]`}>
                        {preFillOption === '30jours' && (
                          <div className="overflow-clip relative rounded-[inherit] size-[16px]">
                            <div className="absolute inset-[12.5%]">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
                                <g id="check">
                                  <path d="M10 3L4.5 8.5L2 6" id="Icon" stroke="var(--stroke-0, #007AFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6666" />
                                </g>
                              </svg>
                            </div>
                          </div>
                        )}
                        <div aria-hidden="true" className={`absolute border ${preFillOption === '30jours' ? 'border-[#007aff]' : 'border-[#6a90ba]'} border-solid inset-0 pointer-events-none rounded-[4px]`} />
                      </div>
                      <p className={`capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 ${preFillOption === '30jours' ? 'text-[#007aff]' : 'text-[#6a90ba]'} text-[14px] text-nowrap whitespace-pre`}>À 30 jours fin de mois</p>
                    </button>

                    {/* À 45 jours fin de mois */}
                    <button
                      onClick={() => setPreFillOption('45jours')}
                      className="content-stretch flex gap-[8px] items-center relative shrink-0 cursor-pointer"
                    >
                      <div className={`${preFillOption === '45jours' ? 'bg-[#e5f3ff]' : 'bg-white'} relative rounded-[4px] shrink-0 size-[16px]`}>
                        {preFillOption === '45jours' && (
                          <div className="overflow-clip relative rounded-[inherit] size-[16px]">
                            <div className="absolute inset-[12.5%]">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
                                <g id="check">
                                  <path d="M10 3L4.5 8.5L2 6" id="Icon" stroke="var(--stroke-0, #007AFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6666" />
                                </g>
                              </svg>
                            </div>
                          </div>
                        )}
                        <div aria-hidden="true" className={`absolute border ${preFillOption === '45jours' ? 'border-[#007aff]' : 'border-[#6a90ba]'} border-solid inset-0 pointer-events-none rounded-[4px]`} />
                      </div>
                      <p className={`capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 ${preFillOption === '45jours' ? 'text-[#007aff]' : 'text-[#6a90ba]'} text-[14px] text-nowrap whitespace-pre`}>À 45 jours fin de mois</p>
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Section */}
              <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0">
                <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
                  <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                    <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap uppercase whitespace-pre">Saisie des échéances et paiements</p>
                  </div>
                  
                  {/* Table */}
                  <div className="content-stretch flex flex-col items-start relative shrink-0">
                    {/* Header Row */}
                    <div className="bg-white relative rounded-tl-[8px] rounded-tr-[8px] shrink-0 w-[832px]">
                      <div className="box-border content-stretch flex gap-[8px] items-center overflow-clip px-[14px] py-0 relative rounded-[inherit] w-[832px]">
                        <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[207px]">
                          <p className="font-['Poppins:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#6a90ba] text-[14px] w-[173.016px]">À saisir</p>
                        </div>
                        <div className="h-[42.259px] relative shrink-0 w-0">
                          <div className="absolute inset-[-1.18%_-0.5px]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 44">
                              <path d="M0.5 0.5V42.7588" id="Vector 100" stroke="var(--stroke-0, #6A90BA)" strokeDasharray="2 2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>
                        <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                          <p className="font-['Poppins:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#6a90ba] text-[14px] text-nowrap whitespace-pre">Échéances</p>
                        </div>
                      </div>
                      <div aria-hidden="true" className="absolute border border-[#6a90ba] border-dashed inset-0 pointer-events-none rounded-tl-[8px] rounded-tr-[8px]" />
                    </div>

                    {/* Second Header Row */}
                    <div className="bg-white relative rounded-bl-[8px] rounded-br-[8px] shrink-0 w-[832px]">
                      <div className="box-border content-stretch flex gap-[8px] items-center overflow-clip px-[14px] py-0 relative rounded-[inherit] w-[832px]">
                        <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[207px]">
                          <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[92px]">
                            <p className="font-['Poppins:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#6a90ba] text-[14px] text-nowrap whitespace-pre">Montant</p>
                          </div>
                          <div className="h-[42.259px] relative shrink-0 w-0">
                            <div className="absolute inset-[-1.18%_-0.5px]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 44">
                                <path d="M0.5 0.5V42.7588" id="Vector 100" stroke="var(--stroke-0, #6A90BA)" strokeDasharray="2 2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          </div>
                          <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[115px]">
                            <p className="font-['Poppins:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#6a90ba] text-[14px] w-[173.016px]">Pourcentage</p>
                          </div>
                        </div>
                        
                        <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                          <div className="h-[42.259px] relative shrink-0 w-0">
                            <div className="absolute inset-[-1.18%_-0.5px]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 44">
                                <path d="M0.5 0.5V42.7588" id="Vector 100" stroke="var(--stroke-0, #6A90BA)" strokeDasharray="2 2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          </div>
                          <p className="font-['Poppins:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#6a90ba] text-[14px] text-nowrap whitespace-pre">Conditions de paiement</p>
                        </div>

                        <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[85px]">
                          <div className="h-[42.259px] relative shrink-0 w-0">
                            <div className="absolute inset-[-1.18%_-0.5px]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 44">
                                <path d="M0.5 0.5V42.7588" id="Vector 100" stroke="var(--stroke-0, #6A90BA)" strokeDasharray="2 2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          </div>
                          <p className="font-['Poppins:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#6a90ba] text-[14px] text-nowrap whitespace-pre">Date</p>
                        </div>

                        <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                          <div className="h-[42.259px] relative shrink-0 w-0">
                            <div className="absolute inset-[-1.18%_-0.5px]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 44">
                                <path d="M0.5 0.5V42.7588" id="Vector 100" stroke="var(--stroke-0, #6A90BA)" strokeDasharray="2 2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          </div>
                          <p className="font-['Poppins:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#6a90ba] text-[14px] text-nowrap whitespace-pre">Mode de paiement</p>
                        </div>

                        <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[110px]">
                          <div className="h-[42.259px] relative shrink-0 w-0">
                            <div className="absolute inset-[-1.18%_-0.5px]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 44">
                                <path d="M0.5 0.5V42.7588" id="Vector 100" stroke="var(--stroke-0, #6A90BA)" strokeDasharray="2 2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          </div>
                          <p className="font-['Poppins:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#6a90ba] text-[14px] text-center w-[102.227px]">Banque</p>
                        </div>
                      </div>
                      <div aria-hidden="true" className="absolute border-[#6a90ba] border-[0px_1px_1px] border-dashed inset-0 pointer-events-none rounded-bl-[8px] rounded-br-[8px]" />
                    </div>

                    {/* Data Row */}
                    <div className="bg-white relative rounded-bl-[8px] rounded-br-[8px] shrink-0 w-full">
                      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
                        <div className="box-border content-stretch flex gap-[8px] items-center px-[5px] py-0 relative w-full">
                          <div className="basis-0 box-border content-stretch flex gap-[8px] grow items-center min-h-px min-w-px px-0 py-[13px] relative shrink-0">
                            {/* Amount & Percentage */}
                            <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[223px]">
                              <div className="bg-[#ebf1ff] box-border content-stretch flex font-['Poppins:Regular',sans-serif] gap-[8px] items-center justify-center leading-[24px] not-italic px-0 py-[8px] relative rounded-[8px] shrink-0 text-[#19294a] text-nowrap w-[103px] whitespace-pre">
                                <input
                                  type="text"
                                  value={amount}
                                  onChange={(e) => setAmount(e.target.value)}
                                  className="bg-transparent relative shrink-0 text-[13px] border-none outline-none w-16 text-center"
                                />
                                <p className="relative shrink-0 text-[14px]">€</p>
                              </div>
                              <div className="bg-[#ebf1ff] box-border content-stretch flex gap-[8px] items-center justify-center px-0 py-[8px] relative rounded-[8px] shrink-0 w-[108px]">
                                <p className="font-['Poppins:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#19294a] text-[13px] text-nowrap whitespace-pre">{percentage}</p>
                              </div>
                            </div>

                            {/* Conditions & Date & Payment Mode & Bank */}
                            <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[223px]">
                              <div className="bg-[#ebf1ff] box-border content-stretch flex gap-[8px] items-center justify-center px-0 py-[8px] relative rounded-[8px] shrink-0 w-[175px]">
                                <input
                                  type="text"
                                  value={paymentCondition}
                                  onChange={(e) => setPaymentCondition(e.target.value)}
                                  className="bg-transparent font-['Poppins:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#6a90ba] text-[13px] text-nowrap border-none outline-none w-full text-center"
                                />
                                <div className="h-[5px] relative shrink-0 w-[9.999px]">
                                  <div className="absolute inset-[-16.4%_-8.2%]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
                                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 7">
                                      <path d={svgPaths.p253fee80} id="Vector 99" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.64" />
                                    </svg>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-[#ebf1ff] box-border content-stretch flex gap-[8px] items-center justify-center px-0 py-[8px] relative rounded-[8px] shrink-0 w-[89px]">
                                <input
                                  type="text"
                                  value={date}
                                  onChange={(e) => setDate(e.target.value)}
                                  className="bg-transparent font-['Poppins:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#19294a] text-[13px] text-nowrap border-none outline-none w-full text-center"
                                />
                              </div>

                              <div className="bg-[#ebf1ff] box-border content-stretch flex gap-[8px] items-center justify-center px-0 py-[8px] relative rounded-[8px] shrink-0 w-[137px]">
                                <input
                                  type="text"
                                  value={paymentMode}
                                  onChange={(e) => setPaymentMode(e.target.value)}
                                  className="bg-transparent font-['Poppins:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#19294a] text-[13px] text-nowrap border-none outline-none w-full text-center"
                                />
                                <div className="h-[5px] relative shrink-0 w-[9.999px]">
                                  <div className="absolute inset-[-16.4%_-8.2%]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
                                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 7">
                                      <path d={svgPaths.p253fee80} id="Vector 99" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.64" />
                                    </svg>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-[#ebf1ff] box-border content-stretch flex gap-[8px] items-center justify-center px-0 py-[8px] relative rounded-[8px] shrink-0 w-[111px]">
                                <input
                                  type="text"
                                  value={bank}
                                  onChange={(e) => setBank(e.target.value)}
                                  className="bg-transparent font-['Poppins:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#19294a] text-[14px] text-nowrap border-none outline-none w-full text-center"
                                />
                              </div>

                              <div className="box-border content-stretch flex gap-[8px] items-center justify-center px-0 py-[8px] relative rounded-[8px] shrink-0 w-[46px]">
                                <div className="bg-white relative rounded-[4px] shrink-0 size-[16px]">
                                  <div aria-hidden="true" className="absolute border border-[#6a90ba] border-solid inset-0 pointer-events-none rounded-[4px]" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Display Section */}
              <div className="content-stretch flex flex-col gap-[3px] items-center justify-center relative shrink-0">
                <div className="content-stretch flex flex-col gap-[5px] items-center relative shrink-0 w-[832px]">
                  <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
                    <div className="content-stretch flex flex-col gap-[8px] items-start justify-center relative shrink-0">
                      <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap uppercase whitespace-pre">{`Texte apparaissant sur la facture `}</p>
                    </div>
                    
                    <div className="bg-[#ffe6ca] h-[89px] relative rounded-[5px] shrink-0 w-full">
                      <div aria-hidden="true" className="absolute border border-[#ff7700] border-dashed inset-0 pointer-events-none rounded-[5px]" />
                      <div className="flex flex-col justify-center size-full">
                        <div className="box-border content-stretch flex flex-col gap-[11.765px] h-[89px] items-start justify-center px-[23.529px] py-[17.647px] relative w-full">
                          <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[17.647px] not-italic relative shrink-0 text-[#19294a] text-[11.765px] text-nowrap whitespace-pre">condition de paiement:</p>
                          <div className="content-stretch flex font-['Inter:Regular',sans-serif] font-normal items-start leading-[17.647px] not-italic relative shrink-0 text-[#19294a] text-[11.765px] text-nowrap w-[727.941px] whitespace-pre">
                            <p className="relative shrink-0">• 100.00% soit 6 300,00 € à payer paiement comptant.</p>
                            <p className="relative shrink-0">le : 14/05/2025 (à réception).</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <ul className="[white-space-collapse:collapse] block font-['Inter:Regular',sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#ff7700] text-[11.765px] text-nowrap">
                    <li className="ms-[17.6475px]">
                      <span className="leading-[17.647px]">{`Vous pouvez "écraser" le texte proposé par un texte de votre choix`}</span>
                    </li>
                  </ul>
                </div>
                
                {/* Display Options Checkboxes */}
                <div className="box-border content-stretch flex gap-[24px] items-center px-[31px] py-[12px] relative rounded-[20px] shrink-0">
                  {/* Montants */}
                  <button
                    onClick={() => setIncludeAmounts(!includeAmounts)}
                    className="content-stretch flex gap-[8px] items-center relative shrink-0 cursor-pointer"
                  >
                    <div className={`${includeAmounts ? 'bg-[#e5f3ff]' : 'bg-white'} relative rounded-[4px] shrink-0 size-[16px]`}>
                      {includeAmounts && (
                        <div className="overflow-clip relative rounded-[inherit] size-[16px]">
                          <div className="absolute inset-[12.5%]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
                              <g id="check">
                                <path d="M10 3L4.5 8.5L2 6" id="Icon" stroke="var(--stroke-0, #007AFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6666" />
                              </g>
                            </svg>
                          </div>
                        </div>
                      )}
                      <div aria-hidden="true" className={`absolute border ${includeAmounts ? 'border-[#007aff]' : 'border-[#6a90ba]'} border-solid inset-0 pointer-events-none rounded-[4px]`} />
                    </div>
                    <p className={`capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 ${includeAmounts ? 'text-[#007aff]' : 'text-[#6a90ba]'} text-[13px] text-nowrap whitespace-pre`}>Montants</p>
                  </button>

                  {/* Pourcentages */}
                  <button
                    onClick={() => setIncludePercentages(!includePercentages)}
                    className="content-stretch flex gap-[8px] items-center relative shrink-0 cursor-pointer"
                  >
                    <div className={`${includePercentages ? 'bg-[#e5f3ff]' : 'bg-white'} relative rounded-[4px] shrink-0 size-[16px]`}>
                      {includePercentages && (
                        <div className="overflow-clip relative rounded-[inherit] size-[16px]">
                          <div className="absolute inset-[12.5%]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
                              <g id="check">
                                <path d="M10 3L4.5 8.5L2 6" id="Icon" stroke="var(--stroke-0, #007AFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6666" />
                              </g>
                            </svg>
                          </div>
                        </div>
                      )}
                      <div aria-hidden="true" className={`absolute border ${includePercentages ? 'border-[#007aff]' : 'border-[#6a90ba]'} border-solid inset-0 pointer-events-none rounded-[4px]`} />
                    </div>
                    <p className={`capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 ${includePercentages ? 'text-[#007aff]' : 'text-[#6a90ba]'} text-[13px] text-nowrap whitespace-pre`}>Pourcentages</p>
                  </button>

                  {/* Dates */}
                  <button
                    onClick={() => setIncludeDates(!includeDates)}
                    className="content-stretch flex gap-[8px] items-center relative shrink-0 cursor-pointer"
                  >
                    <div className={`${includeDates ? 'bg-[#e5f3ff]' : 'bg-white'} relative rounded-[4px] shrink-0 size-[16px]`}>
                      {includeDates && (
                        <div className="overflow-clip relative rounded-[inherit] size-[16px]">
                          <div className="absolute inset-[12.5%]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
                              <g id="check">
                                <path d="M10 3L4.5 8.5L2 6" id="Icon" stroke="var(--stroke-0, #007AFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6666" />
                              </g>
                            </svg>
                          </div>
                        </div>
                      )}
                      <div aria-hidden="true" className={`absolute border ${includeDates ? 'border-[#007aff]' : 'border-[#6a90ba]'} border-solid inset-0 pointer-events-none rounded-[4px]`} />
                    </div>
                    <p className={`capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 ${includeDates ? 'text-[#007aff]' : 'text-[#6a90ba]'} text-[13px] text-nowrap whitespace-pre`}>Dates</p>
                  </button>

                  {/* Conditions */}
                  <button
                    onClick={() => setIncludeConditions(!includeConditions)}
                    className="content-stretch flex gap-[8px] items-center relative shrink-0 cursor-pointer"
                  >
                    <div className={`${includeConditions ? 'bg-[#e5f3ff]' : 'bg-white'} relative rounded-[4px] shrink-0 size-[16px]`}>
                      {includeConditions && (
                        <div className="overflow-clip relative rounded-[inherit] size-[16px]">
                          <div className="absolute inset-[12.5%]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
                              <g id="check">
                                <path d="M10 3L4.5 8.5L2 6" id="Icon" stroke="var(--stroke-0, #007AFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6666" />
                              </g>
                            </svg>
                          </div>
                        </div>
                      )}
                      <div aria-hidden="true" className={`absolute border ${includeConditions ? 'border-[#007aff]' : 'border-[#6a90ba]'} border-solid inset-0 pointer-events-none rounded-[4px]`} />
                    </div>
                    <p className={`capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 ${includeConditions ? 'text-[#007aff]' : 'text-[#6a90ba]'} text-[13px] text-nowrap whitespace-pre`}>Conditions</p>
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="content-stretch flex gap-[37px] h-[40px] items-start justify-end relative shrink-0 w-[832px]">
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
                {/* Annuler Button */}
                <button
                  onClick={handleClose}
                  className="box-border content-stretch flex flex-col gap-[16px] h-[40px] items-start px-[16px] py-[10px] relative rounded-[10px] shrink-0 cursor-pointer transition-opacity hover:opacity-70"
                >
                  <div aria-hidden="true" className="absolute border border-[#6a90ba] border-solid inset-0 pointer-events-none rounded-[10px]" />
                  <div className="content-stretch flex gap-[19px] items-center relative shrink-0">
                    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
                      <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#7e8ca9] text-[13px] text-nowrap whitespace-pre">annuler</p>
                    </div>
                  </div>
                </button>

                {/* Enregistrer Button */}
                <button
                  onClick={handleSave}
                  className="bg-[#007aff] box-border content-stretch flex flex-col gap-[16px] h-[40px] items-start px-[16px] py-[10px] relative rounded-[10px] shrink-0 cursor-pointer transition-opacity hover:opacity-90"
                >
                  <div className="content-stretch flex gap-[19px] items-center relative shrink-0">
                    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
                      <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">Enregistrer</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute left-[893px] size-[30.667px] top-[12.5px] cursor-pointer"
          >
            <div className="absolute inset-0" style={{ "--fill-0": "rgba(232, 240, 247, 1)" } as React.CSSProperties}>
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 31 31">
                <g id="Frame 19">
                  <rect fill="var(--fill-0, #E8F0F7)" height="30.6667" rx="15.3333" width="30.6667" />
                  <path d={svgPaths.p1e50a100} id="Vector" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeWidth="2" />
                </g>
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
