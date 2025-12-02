import { useState } from 'react';
import svgPaths from '../imports/svg-d2n9rmpxo2';

interface ArticleModalProps {
  onClose?: () => void;
  onValidate?: (data: ArticleData) => void;
}

interface ArticleData {
  designation: string;
  quantity: number;
  priceHT: number;
  discount: number;
  tva: number;
  amountHT: number;
  category: string;
}

export function ArticleModal({ onClose, onValidate }: ArticleModalProps) {
  const [formData, setFormData] = useState<ArticleData>({
    designation: "Nom de  l'article",
    quantity: 1,
    priceHT: 80,
    discount: 0,
    tva: 20,
    amountHT: 120,
    category: 'Outille De formation',
  });

  const handleValidate = () => {
    if (onValidate) {
      onValidate(formData);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const updateField = (field: keyof ArticleData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white relative rounded-[10.833px] size-full">
      <div aria-hidden="true" className="absolute border-[0.833px] border-[rgba(106,144,186,0.39)] border-solid inset-0 pointer-events-none rounded-[10.833px] shadow-[0px_57px_86px_0px_rgba(25,41,74,0.16)]" />
      <div className="flex flex-col items-end justify-end size-full">
        <div className="box-border content-stretch flex flex-col gap-[21px] items-end justify-end pb-[19px] pt-[46px] px-[40px] relative size-full">
          {/* Form Section */}
          <div className="bg-[#e8f0f7] box-border content-stretch flex flex-col gap-[14px] items-start p-[14px] relative rounded-[12px] shrink-0">
            <div className="content-stretch flex gap-[15px] items-center relative shrink-0">
              <div className="content-start flex flex-wrap gap-[15px] items-start relative shrink-0 w-[500px]">
                {/* Designation Field */}
                <div className="bg-white box-border content-stretch flex flex-col gap-[10px] items-start justify-center px-[13px] py-[6px] relative rounded-[8px] shrink-0 w-[281px]">
                  <div aria-hidden="true" className="absolute border border-[#007aff] border-solid inset-0 pointer-events-none rounded-[8px]" />
                  <div className="flex flex-col font-['Urbanist:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#6a90ba] text-[12px] text-center text-nowrap">
                    <p className="leading-[normal] whitespace-pre">Désignation</p>
                  </div>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => updateField('designation', e.target.value)}
                    className="bg-transparent flex flex-col font-['Urbanist:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#19294a] text-[15px] text-center text-nowrap border-none outline-none w-full"
                  />
                </div>

                {/* Quantity Field */}
                <div className="bg-white box-border content-stretch flex flex-col gap-[10px] items-start justify-center px-[13px] py-[6px] relative rounded-[8px] shrink-0">
                  <div aria-hidden="true" className="absolute border border-[rgba(106,144,186,0.33)] border-solid inset-0 pointer-events-none rounded-[8px]" />
                  <div className="flex flex-col font-['Urbanist:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#6a90ba] text-[12px] text-center text-nowrap">
                    <p className="leading-[normal] whitespace-pre">Quantité</p>
                  </div>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => updateField('quantity', parseInt(e.target.value) || 0)}
                    className="bg-transparent flex flex-col font-['Urbanist:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#19294a] text-[15px] text-center text-nowrap border-none outline-none w-full"
                  />
                </div>

                {/* Prix de vente HT Field */}
                <div className="bg-white box-border content-stretch flex flex-col gap-[10px] items-start justify-center px-[13px] py-[6px] relative rounded-[8px] shrink-0">
                  <div aria-hidden="true" className="absolute border border-[rgba(106,144,186,0.33)] border-solid inset-0 pointer-events-none rounded-[8px]" />
                  <div className="capitalize flex flex-col font-['Urbanist:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#6a90ba] text-[12px] text-center text-nowrap">
                    <p className="leading-[normal] whitespace-pre">prix de vente HT</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={formData.priceHT}
                      onChange={(e) => updateField('priceHT', parseFloat(e.target.value) || 0)}
                      className="bg-transparent font-['Urbanist:SemiBold',sans-serif] font-semibold leading-[0] text-[#19294a] text-[15px] text-center border-none outline-none w-16"
                    />
                    <span className="font-['Urbanist:SemiBold',sans-serif] font-semibold text-[#19294a] text-[15px]">€</span>
                  </div>
                </div>

                {/* Remise Field */}
                <div className="bg-white box-border content-stretch flex flex-col gap-[10px] items-start justify-center px-[13px] py-[6px] relative rounded-[8px] shrink-0">
                  <div aria-hidden="true" className="absolute border border-[rgba(106,144,186,0.33)] border-solid inset-0 pointer-events-none rounded-[8px]" />
                  <div className="capitalize flex flex-col font-['Urbanist:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#6a90ba] text-[12px] text-center text-nowrap">
                    <p className="leading-[normal] whitespace-pre">Remise</p>
                  </div>
                  <input
                    type="text"
                    value={`${formData.discount.toFixed(2)} %`}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value.replace('%', '').trim()) || 0;
                      updateField('discount', val);
                    }}
                    className="bg-transparent flex flex-col font-['Urbanist:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#19294a] text-[15px] text-center text-nowrap border-none outline-none w-full"
                  />
                </div>

                {/* TVA Field */}
                <div className="bg-white box-border content-stretch flex flex-col gap-[10px] items-start justify-center px-[13px] py-[6px] relative rounded-[8px] shrink-0">
                  <div aria-hidden="true" className="absolute border border-[rgba(106,144,186,0.33)] border-solid inset-0 pointer-events-none rounded-[8px]" />
                  <div className="capitalize flex flex-col font-['Urbanist:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#6a90ba] text-[12px] text-center text-nowrap">
                    <p className="leading-[normal] whitespace-pre">TVA</p>
                  </div>
                  <input
                    type="text"
                    value={`${formData.tva} %`}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value.replace('%', '').trim()) || 0;
                      updateField('tva', val);
                    }}
                    className="bg-transparent flex flex-col font-['Urbanist:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#19294a] text-[15px] text-center text-nowrap border-none outline-none w-full"
                  />
                </div>

                {/* Montant HT Field */}
                <div className="bg-white box-border content-stretch flex flex-col gap-[10px] items-start justify-center px-[13px] py-[6px] relative rounded-[8px] shrink-0 w-[165px]">
                  <div aria-hidden="true" className="absolute border border-[rgba(106,144,186,0.33)] border-solid inset-0 pointer-events-none rounded-[8px]" />
                  <div className="capitalize flex flex-col font-['Urbanist:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#6a90ba] text-[12px] text-center text-nowrap">
                    <p className="leading-[normal] whitespace-pre">montant HT</p>
                  </div>
                  <div className="flex flex-col font-['Urbanist:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#19294a] text-[15px] text-center text-nowrap">
                    <p className="leading-[normal] whitespace-pre">{`${formData.amountHT.toFixed(2)}   €`}</p>
                  </div>
                </div>

                {/* Category Field */}
                <div className="bg-white box-border content-stretch flex flex-col gap-[10px] items-start justify-center px-[13px] py-[6px] relative rounded-[8px] shrink-0">
                  <div aria-hidden="true" className="absolute border border-[rgba(106,144,186,0.33)] border-solid inset-0 pointer-events-none rounded-[8px]" />
                  <div className="capitalize flex flex-col font-['Urbanist:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#6a90ba] text-[12px] text-center text-nowrap">
                    <p className="leading-[normal] whitespace-pre">catégorie</p>
                  </div>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => updateField('category', e.target.value)}
                    className="bg-transparent flex flex-col font-['Urbanist:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#19294a] text-[15px] text-center text-nowrap border-none outline-none w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute left-[658px] size-[30.667px] top-[8px] cursor-pointer"
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

          {/* Valider Button */}
          <button
            onClick={handleValidate}
            className="bg-[#007aff] box-border content-stretch flex gap-[16px] items-center p-[12px] relative rounded-[13px] shrink-0 cursor-pointer transition-opacity hover:opacity-90"
          >
            <div aria-hidden="true" className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[13px]" />
            <p className="font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[17px] text-nowrap text-white whitespace-pre">Valider</p>
            <div className="flex h-[12.51px] items-center justify-center relative shrink-0 w-[15.49px]" style={{ "--transform-inner-width": "14.3125", "--transform-inner-height": "10.921875" } as React.CSSProperties}>
              <div className="flex-none rotate-[6.619deg]">
                <div className="h-[10.932px] relative w-[14.326px]">
                  <div className="absolute inset-[-9.15%_-6.98%]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 13">
                      <path d={svgPaths.p2273c200} id="Vector 40" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
