import svgPaths from "./svg-cig62peixh";

function Check() {
  return (
    <div className="absolute inset-[12.5%]" data-name="check">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="check">
          <path d="M10 3L4.5 8.5L2 6" id="Icon" stroke="var(--stroke-0, #007AFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6666" />
        </g>
      </svg>
    </div>
  );
}

function CheckboxBase() {
  return (
    <div className="bg-[#e5f3ff] relative rounded-[4px] shrink-0 size-[16px]" data-name="_Checkbox base">
      <div className="overflow-clip relative rounded-[inherit] size-[16px]">
        <Check />
      </div>
      <div aria-hidden="true" className="absolute border border-[#007aff] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function Checkbox() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Checkbox">
      <CheckboxBase />
    </div>
  );
}

function Frame21() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <Checkbox />
      <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#007aff] text-[14px] text-nowrap whitespace-pre">Comptant</p>
    </div>
  );
}

function CheckboxBase1() {
  return (
    <div className="bg-white relative rounded-[4px] shrink-0 size-[16px]" data-name="_Checkbox base">
      <div aria-hidden="true" className="absolute border border-[#6a90ba] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function Checkbox1() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Checkbox">
      <CheckboxBase1 />
    </div>
  );
}

function Frame22() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <Checkbox1 />
      <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#6a90ba] text-[14px] text-nowrap whitespace-pre">À réception</p>
    </div>
  );
}

function CheckboxBase2() {
  return (
    <div className="bg-white relative rounded-[4px] shrink-0 size-[16px]" data-name="_Checkbox base">
      <div aria-hidden="true" className="absolute border border-[#6a90ba] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function Checkbox2() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Checkbox">
      <CheckboxBase2 />
    </div>
  );
}

function Frame23() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <Checkbox2 />
      <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#6a90ba] text-[14px] text-nowrap whitespace-pre">À 30 jours fin de mois</p>
    </div>
  );
}

function CheckboxBase3() {
  return (
    <div className="bg-white relative rounded-[4px] shrink-0 size-[16px]" data-name="_Checkbox base">
      <div aria-hidden="true" className="absolute border border-[#6a90ba] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function Checkbox3() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Checkbox">
      <CheckboxBase3 />
    </div>
  );
}

function Frame24() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <Checkbox3 />
      <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#6a90ba] text-[14px] text-nowrap whitespace-pre">À 45 jours fin de mois</p>
    </div>
  );
}

function Frame20() {
  return (
    <div className="bg-[rgba(235,241,255,0.45)] box-border content-stretch flex gap-[24px] items-center px-[31px] py-[12px] relative rounded-[20px] shrink-0">
      <Frame21 />
      <Frame22 />
      <Frame23 />
      <Frame24 />
    </div>
  );
}

function Frame34() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-center relative shrink-0">
      <p className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">Pré-remplissage des conditions :</p>
      <Frame20 />
    </div>
  );
}

function Frame17() {
  return (
    <div className="bg-white box-border content-stretch flex flex-col gap-[16px] items-center justify-center px-0 py-[9px] relative rounded-[5px] shrink-0 w-full">
      <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">{`Gestion des échéances & paiements`}</p>
      <Frame34 />
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap uppercase whitespace-pre">Saisie des échéances et paiements</p>
    </div>
  );
}

function Content() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[207px]" data-name="Content">
      <p className="font-['Poppins:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#6a90ba] text-[14px] w-[173.016px]">À saisir</p>
    </div>
  );
}

function Content1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Content">
      <p className="font-['Poppins:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#6a90ba] text-[14px] text-nowrap whitespace-pre">Échéances</p>
    </div>
  );
}

function Input() {
  return (
    <div className="bg-white relative rounded-tl-[8px] rounded-tr-[8px] shrink-0 w-[832px]" data-name="Input">
      <div className="box-border content-stretch flex gap-[8px] items-center overflow-clip px-[14px] py-0 relative rounded-[inherit] w-[832px]">
        <Content />
        <div className="h-[42.259px] relative shrink-0 w-0">
          <div className="absolute inset-[-1.18%_-0.5px]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 44">
              <path d="M0.5 0.5V42.7588" id="Vector 100" stroke="var(--stroke-0, #6A90BA)" strokeDasharray="2 2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <Content1 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#6a90ba] border-dashed inset-0 pointer-events-none rounded-tl-[8px] rounded-tr-[8px]" />
    </div>
  );
}

function Content2() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[92px]" data-name="Content">
      <p className="font-['Poppins:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#6a90ba] text-[14px] text-nowrap whitespace-pre">Montant</p>
    </div>
  );
}

function Content3() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[115px]" data-name="Content">
      <p className="font-['Poppins:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#6a90ba] text-[14px] w-[173.016px]">Pourcentage</p>
    </div>
  );
}

function Frame25() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[207px]">
      <Content2 />
      <div className="h-[42.259px] relative shrink-0 w-0">
        <div className="absolute inset-[-1.18%_-0.5px]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 44">
            <path d="M0.5 0.5V42.7588" id="Vector 100" stroke="var(--stroke-0, #6A90BA)" strokeDasharray="2 2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <Content3 />
    </div>
  );
}

function Content4() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Content">
      <p className="font-['Poppins:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#6a90ba] text-[14px] text-nowrap whitespace-pre">Conditions de paiement</p>
    </div>
  );
}

function Frame26() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <div className="h-[42.259px] relative shrink-0 w-0">
        <div className="absolute inset-[-1.18%_-0.5px]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 44">
            <path d="M0.5 0.5V42.7588" id="Vector 100" stroke="var(--stroke-0, #6A90BA)" strokeDasharray="2 2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <Content4 />
    </div>
  );
}

function Content5() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0 w-[69px]" data-name="Content">
      <p className="font-['Poppins:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#6a90ba] text-[14px] text-nowrap whitespace-pre">Date</p>
    </div>
  );
}

function Frame27() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[85px]">
      <div className="h-[42.259px] relative shrink-0 w-0">
        <div className="absolute inset-[-1.18%_-0.5px]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 44">
            <path d="M0.5 0.5V42.7588" id="Vector 100" stroke="var(--stroke-0, #6A90BA)" strokeDasharray="2 2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <Content5 />
    </div>
  );
}

function Content6() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Content">
      <p className="font-['Poppins:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#6a90ba] text-[14px] text-nowrap whitespace-pre">Mode de paiement</p>
    </div>
  );
}

function Frame28() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <div className="h-[42.259px] relative shrink-0 w-0">
        <div className="absolute inset-[-1.18%_-0.5px]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 44">
            <path d="M0.5 0.5V42.7588" id="Vector 100" stroke="var(--stroke-0, #6A90BA)" strokeDasharray="2 2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <Content6 />
    </div>
  );
}

function Content7() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Content">
      <p className="font-['Poppins:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#6a90ba] text-[14px] text-center w-[102.227px]">Banque</p>
    </div>
  );
}

function Frame29() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[110px]">
      <div className="h-[42.259px] relative shrink-0 w-0">
        <div className="absolute inset-[-1.18%_-0.5px]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 44">
            <path d="M0.5 0.5V42.7588" id="Vector 100" stroke="var(--stroke-0, #6A90BA)" strokeDasharray="2 2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <Content7 />
    </div>
  );
}

function Input1() {
  return (
    <div className="bg-white relative rounded-bl-[8px] rounded-br-[8px] shrink-0 w-[832px]" data-name="Input">
      <div className="box-border content-stretch flex gap-[8px] items-center overflow-clip px-[14px] py-0 relative rounded-[inherit] w-[832px]">
        <Frame25 />
        <Frame26 />
        <Frame27 />
        <Frame28 />
        <Frame29 />
      </div>
      <div aria-hidden="true" className="absolute border-[#6a90ba] border-[0px_1px_1px] border-dashed inset-0 pointer-events-none rounded-bl-[8px] rounded-br-[8px]" />
    </div>
  );
}

function Content8() {
  return (
    <div className="bg-[#ebf1ff] box-border content-stretch flex font-['Poppins:Regular',sans-serif] gap-[8px] items-center justify-center leading-[24px] not-italic px-0 py-[8px] relative rounded-[8px] shrink-0 text-[#19294a] text-nowrap w-[103px] whitespace-pre" data-name="Content">
      <p className="relative shrink-0 text-[13px]">55.214</p>
      <p className="relative shrink-0 text-[14px]">€</p>
    </div>
  );
}

function Content9() {
  return (
    <div className="bg-[#ebf1ff] box-border content-stretch flex gap-[8px] items-center justify-center px-0 py-[8px] relative rounded-[8px] shrink-0 w-[108px]" data-name="Content">
      <p className="font-['Poppins:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#19294a] text-[13px] text-nowrap whitespace-pre">Montant</p>
    </div>
  );
}

function Frame31() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[223px]">
      <Content8 />
      <Content9 />
    </div>
  );
}

function Content10() {
  return (
    <div className="bg-[#ebf1ff] box-border content-stretch flex gap-[8px] items-center justify-center px-0 py-[8px] relative rounded-[8px] shrink-0 w-[175px]" data-name="Content">
      <p className="font-['Poppins:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#6a90ba] text-[13px] text-nowrap whitespace-pre">Paiement comptant</p>
      <div className="h-[5px] relative shrink-0 w-[9.999px]">
        <div className="absolute inset-[-16.4%_-8.2%]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 7">
            <path d={svgPaths.p253fee80} id="Vector 99" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.64" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Content11() {
  return (
    <div className="bg-[#ebf1ff] box-border content-stretch flex gap-[8px] items-center justify-center px-0 py-[8px] relative rounded-[8px] shrink-0 w-[89px]" data-name="Content">
      <p className="font-['Poppins:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#19294a] text-[13px] text-nowrap whitespace-pre">14-05-2025</p>
    </div>
  );
}

function Content12() {
  return (
    <div className="bg-[#ebf1ff] box-border content-stretch flex gap-[8px] items-center justify-center px-0 py-[8px] relative rounded-[8px] shrink-0 w-[137px]" data-name="Content">
      <p className="font-['Poppins:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#19294a] text-[13px] text-nowrap whitespace-pre">Carte bancaire</p>
      <div className="h-[5px] relative shrink-0 w-[9.999px]">
        <div className="absolute inset-[-16.4%_-8.2%]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 7">
            <path d={svgPaths.p253fee80} id="Vector 99" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.64" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Content13() {
  return (
    <div className="bg-[#ebf1ff] box-border content-stretch flex gap-[8px] items-center justify-center px-0 py-[8px] relative rounded-[8px] shrink-0 w-[111px]" data-name="Content">
      <p className="font-['Poppins:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#19294a] text-[14px] text-nowrap whitespace-pre">Nom</p>
    </div>
  );
}

function CheckboxBase4() {
  return (
    <div className="bg-white relative rounded-[4px] shrink-0 size-[16px]" data-name="_Checkbox base">
      <div aria-hidden="true" className="absolute border border-[#6a90ba] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function Content14() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center justify-center px-0 py-[8px] relative rounded-[8px] shrink-0 w-[46px]" data-name="Content">
      <CheckboxBase4 />
    </div>
  );
}

function Frame32() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-[223px]">
      <Content10 />
      <Content11 />
      <Content12 />
      <Content13 />
      <Content14 />
    </div>
  );
}

function Frame30() {
  return (
    <div className="basis-0 box-border content-stretch flex gap-[8px] grow items-center min-h-px min-w-px px-0 py-[13px] relative shrink-0">
      <Frame31 />
      <Frame32 />
    </div>
  );
}

function Input2() {
  return (
    <div className="bg-white relative rounded-bl-[8px] rounded-br-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[5px] py-0 relative w-full">
          <Frame30 />
        </div>
      </div>
    </div>
  );
}

function Frame19() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0">
      <Input />
      <Input1 />
      <Input2 />
    </div>
  );
}

function Frame14() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
      <Frame />
      <Frame19 />
    </div>
  );
}

function Frame13() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0">
      <Frame14 />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start justify-center relative shrink-0">
      <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap uppercase whitespace-pre">{`Texte apparaissant sur la facture `}</p>
    </div>
  );
}

function CompanyTermsConditions() {
  return (
    <div className="content-stretch flex font-['Inter:Regular',sans-serif] font-normal items-start leading-[17.647px] not-italic relative shrink-0 text-[#19294a] text-[11.765px] text-nowrap w-[727.941px] whitespace-pre" data-name="Company Terms & Conditions">
      <p className="relative shrink-0">• 100.00% soit 6 300,00 € à payer paiement comptant.</p>
      <p className="relative shrink-0">le : 14/05/2025 (à réception).</p>
    </div>
  );
}

function TermsConditions() {
  return (
    <div className="bg-[#ffe6ca] h-[89px] relative rounded-[5px] shrink-0 w-full" data-name="Terms & Conditions">
      <div aria-hidden="true" className="absolute border border-[#ff7700] border-dashed inset-0 pointer-events-none rounded-[5px]" />
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[11.765px] h-[89px] items-start justify-center px-[23.529px] py-[17.647px] relative w-full">
          <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[17.647px] not-italic relative shrink-0 text-[#19294a] text-[11.765px] text-nowrap whitespace-pre">condition de paiement:</p>
          <CompanyTermsConditions />
        </div>
      </div>
    </div>
  );
}

function Frame15() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
      <Frame1 />
      <TermsConditions />
    </div>
  );
}

function Frame18() {
  return (
    <div className="content-stretch flex flex-col gap-[5px] items-center relative shrink-0 w-[832px]">
      <Frame15 />
      <ul className="[white-space-collapse:collapse] block font-['Inter:Regular',sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#ff7700] text-[11.765px] text-nowrap">
        <li className="ms-[17.6475px]">
          <span className="leading-[17.647px]">{`Vous pouvez "écraser" le texte proposé par un texte de votre choix`}</span>
        </li>
      </ul>
    </div>
  );
}

function Check1() {
  return (
    <div className="absolute inset-[12.5%]" data-name="check">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="check">
          <path d="M10 3L4.5 8.5L2 6" id="Icon" stroke="var(--stroke-0, #007AFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6666" />
        </g>
      </svg>
    </div>
  );
}

function CheckboxBase5() {
  return (
    <div className="bg-[#e5f3ff] relative rounded-[4px] shrink-0 size-[16px]" data-name="_Checkbox base">
      <div className="overflow-clip relative rounded-[inherit] size-[16px]">
        <Check1 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#007aff] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function Checkbox4() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Checkbox">
      <CheckboxBase5 />
    </div>
  );
}

function Frame35() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <Checkbox4 />
      <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#007aff] text-[13px] text-nowrap whitespace-pre">Montants</p>
    </div>
  );
}

function Check2() {
  return (
    <div className="absolute inset-[12.5%]" data-name="check">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="check">
          <path d="M10 3L4.5 8.5L2 6" id="Icon" stroke="var(--stroke-0, #007AFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6666" />
        </g>
      </svg>
    </div>
  );
}

function CheckboxBase6() {
  return (
    <div className="bg-[#e5f3ff] relative rounded-[4px] shrink-0 size-[16px]" data-name="_Checkbox base">
      <div className="overflow-clip relative rounded-[inherit] size-[16px]">
        <Check2 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#007aff] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function Checkbox5() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Checkbox">
      <CheckboxBase6 />
    </div>
  );
}

function Frame36() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <Checkbox5 />
      <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#6a90ba] text-[13px] text-nowrap whitespace-pre">Pourcentages</p>
    </div>
  );
}

function Check3() {
  return (
    <div className="absolute inset-[12.5%]" data-name="check">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="check">
          <path d="M10 3L4.5 8.5L2 6" id="Icon" stroke="var(--stroke-0, #007AFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6666" />
        </g>
      </svg>
    </div>
  );
}

function CheckboxBase7() {
  return (
    <div className="bg-[#e5f3ff] relative rounded-[4px] shrink-0 size-[16px]" data-name="_Checkbox base">
      <div className="overflow-clip relative rounded-[inherit] size-[16px]">
        <Check3 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#007aff] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function Checkbox6() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Checkbox">
      <CheckboxBase7 />
    </div>
  );
}

function Frame37() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <Checkbox6 />
      <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#6a90ba] text-[13px] text-nowrap whitespace-pre">Dates</p>
    </div>
  );
}

function Check4() {
  return (
    <div className="absolute inset-[12.5%]" data-name="check">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="check">
          <path d="M10 3L4.5 8.5L2 6" id="Icon" stroke="var(--stroke-0, #007AFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6666" />
        </g>
      </svg>
    </div>
  );
}

function CheckboxBase8() {
  return (
    <div className="bg-[#e5f3ff] relative rounded-[4px] shrink-0 size-[16px]" data-name="_Checkbox base">
      <div className="overflow-clip relative rounded-[inherit] size-[16px]">
        <Check4 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#007aff] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function Checkbox7() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Checkbox">
      <CheckboxBase8 />
    </div>
  );
}

function Frame38() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <Checkbox7 />
      <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#6a90ba] text-[13px] text-nowrap whitespace-pre">Conditions</p>
    </div>
  );
}

function Frame39() {
  return (
    <div className="box-border content-stretch flex gap-[24px] items-center px-[31px] py-[12px] relative rounded-[20px] shrink-0">
      <Frame35 />
      <Frame36 />
      <Frame37 />
      <Frame38 />
    </div>
  );
}

function Frame33() {
  return (
    <div className="content-stretch flex flex-col gap-[3px] items-center justify-center relative shrink-0">
      <Frame18 />
      <Frame39 />
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0">
      <Frame17 />
      <Frame13 />
      <Frame33 />
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
      <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#7e8ca9] text-[13px] text-nowrap whitespace-pre">annuler</p>
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex gap-[19px] items-center relative shrink-0">
      <Frame11 />
    </div>
  );
}

function Frame9() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[16px] h-[40px] items-start px-[16px] py-[10px] relative rounded-[10px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[#6a90ba] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <Frame6 />
    </div>
  );
}

function Frame12() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
      <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">Enregistrer</p>
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex gap-[19px] items-center relative shrink-0">
      <Frame12 />
    </div>
  );
}

function Frame7() {
  return (
    <div className="bg-[#007aff] box-border content-stretch flex flex-col gap-[16px] h-[40px] items-start px-[16px] py-[10px] relative rounded-[10px] shrink-0">
      <Frame8 />
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
      <Frame9 />
      <Frame7 />
    </div>
  );
}

function Frame16() {
  return (
    <div className="content-stretch flex gap-[37px] h-[40px] items-start justify-end relative shrink-0 w-[832px]">
      <Frame10 />
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex flex-col gap-[37px] items-center justify-center relative shrink-0 w-full">
      <Frame5 />
      <Frame16 />
    </div>
  );
}

function Frame4() {
  return (
    <div className="absolute left-[893px] size-[30.667px] top-[12.5px]">
      <div className="absolute inset-0" style={{ "--fill-0": "rgba(232, 240, 247, 1)" } as React.CSSProperties}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 31 31">
          <g id="Frame 19">
            <rect fill="var(--fill-0, #E8F0F7)" height="30.6667" rx="15.3333" width="30.6667" />
            <path d={svgPaths.p1e50a100} id="Vector" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeWidth="2" />
          </g>
        </svg>
      </div>
    </div>
  );
}

export default function Frame3() {
  return (
    <div className="bg-white relative rounded-[18px] size-full">
      <div aria-hidden="true" className="absolute border border-[#dbd9d9] border-solid inset-0 pointer-events-none rounded-[18px] shadow-[0px_0px_75.3px_0px_rgba(25,41,74,0.24)]" />
      <div className="flex flex-col justify-end size-full">
        <div className="box-border content-stretch flex flex-col gap-[28px] items-start justify-end pb-[20px] pt-[59px] px-[20px] relative size-full">
          <Frame2 />
          <Frame4 />
        </div>
      </div>
    </div>
  );
}