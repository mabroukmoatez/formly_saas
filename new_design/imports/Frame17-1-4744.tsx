import svgPaths from "./svg-7tswxef2c4";

function Toggle() {
  return (
    <div className="h-[19.451px] relative shrink-0 w-[37.929px]" data-name="Toggle">
      <div className="absolute bottom-[-1.05%] left-[-0.03%] right-0 top-0" style={{ "--fill-0": "rgba(0, 122, 255, 1)" } as React.CSSProperties}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 38 20">
          <g filter="url(#filter0_i_1_4751)" id="Toggle">
            <rect fill="var(--fill-0, #007AFF)" height="19.4506" rx="9.72531" width="37.9287" x="0.0115935" />
            <g id="Dot"></g>
            <g filter="url(#filter1_d_1_4751)" id="Fill">
              <circle cx="9.72531" cy="9.44419" fill="var(--fill-0, white)" r="8.75278" />
            </g>
          </g>
          <defs>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="19.4506" id="filter0_i_1_4751" width="37.9287" x="0.0115935" y="0">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
              <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
              <feOffset />
              <feGaussianBlur stdDeviation="1.0941" />
              <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
              <feBlend in2="shape" mode="normal" result="effect1_innerShadow_1_4751" />
            </filter>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="19.4506" id="filter1_d_1_4751" width="19.4506" x="0" y="0.205141">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
              <feOffset dy="0.486266" />
              <feGaussianBlur stdDeviation="0.486266" />
              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
              <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_4751" />
              <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_4751" mode="normal" result="shape" />
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function Frame42() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
      <p className="capitalize font-['Poppins:Bold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#007aff] text-[14px] text-nowrap whitespace-pre">Client professionnel</p>
      <Toggle />
      <p className="capitalize font-['Poppins:Bold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#6a90ba] text-[14px] text-nowrap whitespace-pre">Client particulier</p>
    </div>
  );
}

function Frame31() {
  return (
    <div className="bg-white box-border content-stretch flex flex-col gap-[10px] h-[60px] items-center justify-center px-0 py-[9px] relative rounded-[5px] shrink-0 w-full">
      <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">Quelles sont les coordonnées de votre client ?</p>
      <Frame42 />
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap uppercase whitespace-pre">{`L'entreprise`}</p>
    </div>
  );
}

function Content() {
  return (
    <div className="basis-0 content-stretch flex flex-col font-['Poppins:Regular',sans-serif] gap-[14px] grow h-full items-start justify-center leading-[0px] min-h-px min-w-px not-italic relative shrink-0" data-name="Content">
      <p className="relative shrink-0 text-[#6a90ba] text-[7px] w-full">Raison Social</p>
      <p className="relative shrink-0 text-[#19294a] text-[13px] w-full">Formly</p>
    </div>
  );
}

function Input() {
  return (
    <div className="basis-0 bg-white grow h-[44px] min-h-px min-w-px relative rounded-[8px] shrink-0" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] h-[44px] items-center px-[14px] py-[10px] relative w-full">
          <Content />
          <div className="h-[5px] relative shrink-0 w-[9.999px]">
            <div className="absolute inset-[-16.4%_-8.2%]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 7">
                <path d={svgPaths.p253fee80} id="Vector 99" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.64" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ebf1ff] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}

function Content1() {
  return (
    <div className="basis-0 content-stretch flex flex-col font-['Poppins:Regular',sans-serif] gap-[14px] grow h-full items-start justify-center leading-[0px] min-h-px min-w-px not-italic relative shrink-0" data-name="Content">
      <p className="relative shrink-0 text-[#6a90ba] text-[7px] uppercase w-full">Siret</p>
      <p className="relative shrink-0 text-[#19294a] text-[13px] w-full">123456789142</p>
    </div>
  );
}

function Input1() {
  return (
    <div className="basis-0 bg-white grow h-[44px] min-h-px min-w-px relative rounded-[8px] shrink-0" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] h-[44px] items-center px-[14px] py-[10px] relative w-full">
          <Content1 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#007aff] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}

function Frame33() {
  return (
    <div className="content-start flex flex-wrap gap-[16px] items-start relative shrink-0 w-full">
      <Input />
      <Input1 />
    </div>
  );
}

function Frame21() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
      <Frame />
      <Frame33 />
    </div>
  );
}

function Frame9() {
  return <div className="content-stretch flex gap-[16px] items-start shrink-0" />;
}

function Frame26() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[16px] items-start left-[151.5px] top-[41.72px]">
      <Frame9 />
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full">
      <Frame21 />
      <Frame26 />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap uppercase whitespace-pre">Adresse</p>
    </div>
  );
}

function Content2() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Adres</p>
    </div>
  );
}

function HelpIcon() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Help icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="help-circle"></g>
      </svg>
    </div>
  );
}

function Input2() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content2 />
          <HelpIcon />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ebf1ff] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}

function InputWithLabel() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Input with label">
      <Input2 />
    </div>
  );
}

function InputFieldBase() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[6px] grow items-start min-h-px min-w-px relative shrink-0" data-name="_Input field base">
      <InputWithLabel />
    </div>
  );
}

function Frame37() {
  return (
    <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full">
      <InputFieldBase />
    </div>
  );
}

function Content3() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">compliment d’Adresse</p>
    </div>
  );
}

function HelpIcon1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Help icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="help-circle"></g>
      </svg>
    </div>
  );
}

function Input3() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content3 />
          <HelpIcon1 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ebf1ff] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}

function InputWithLabel1() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Input with label">
      <Input3 />
    </div>
  );
}

function InputFieldBase1() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[6px] grow items-start min-h-px min-w-px relative shrink-0" data-name="_Input field base">
      <InputWithLabel1 />
    </div>
  );
}

function Frame35() {
  return (
    <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full">
      <InputFieldBase1 />
    </div>
  );
}

function FlagForFlagFranceSvgrepoCom() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="flag-for-flag-france_svgrepo.com">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g clipPath="url(#clip0_1_3141)" id="flag-for-flag-france_svgrepo.com">
          <path d={svgPaths.p240c2b00} fill="var(--fill-0, #ED2939)" id="Vector" />
          <path d={svgPaths.p1acb4700} fill="var(--fill-0, #002495)" id="Vector_2" />
          <path d={svgPaths.p3d968080} fill="var(--fill-0, #EEEEEE)" id="Vector_3" />
        </g>
        <defs>
          <clipPath id="clip0_1_3141">
            <rect fill="white" height="20" width="20" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Content4() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <FlagForFlagFranceSvgrepoCom />
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Code Postal</p>
    </div>
  );
}

function HelpIcon2() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Help icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="help-circle"></g>
      </svg>
    </div>
  );
}

function Input4() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content4 />
          <HelpIcon2 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ebf1ff] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}

function InputWithLabel2() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Input with label">
      <Input4 />
    </div>
  );
}

function InputFieldBase2() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[6px] grow items-start min-h-px min-w-px relative shrink-0" data-name="_Input field base">
      <InputWithLabel2 />
    </div>
  );
}

function Content5() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <p className="basis-0 font-['Inter:Regular',sans-serif] font-normal grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[16px]">Ville</p>
    </div>
  );
}

function HelpIcon3() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Help icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="help-circle"></g>
      </svg>
    </div>
  );
}

function Input5() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content5 />
          <HelpIcon3 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ebf1ff] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}

function InputWithLabel3() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Input with label">
      <Input5 />
    </div>
  );
}

function InputFieldBase3() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[6px] grow items-start min-h-px min-w-px relative shrink-0" data-name="_Input field base">
      <InputWithLabel3 />
    </div>
  );
}

function Frame38() {
  return (
    <div className="content-start flex flex-wrap gap-[16px] items-start relative shrink-0 w-full">
      <InputFieldBase2 />
      <InputFieldBase3 />
    </div>
  );
}

function Frame22() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
      <Frame1 />
      <Frame37 />
      <Frame35 />
      <Frame38 />
    </div>
  );
}

function Frame10() {
  return <div className="content-stretch flex gap-[16px] items-start shrink-0" />;
}

function Frame27() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[16px] items-start left-[151.5px] top-[41.72px]">
      <Frame10 />
    </div>
  );
}

function Frame20() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full">
      <Frame22 />
      <Frame27 />
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">COORDONNÉES</p>
    </div>
  );
}

function Content6() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Civilité</p>
    </div>
  );
}

function HelpIcon4() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Help icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="help-circle"></g>
      </svg>
    </div>
  );
}

function VuesaxLinearArrowRight() {
  return (
    <div className="absolute contents inset-0" data-name="vuesax/linear/arrow-right">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13 13">
        <g id="arrow-right">
          <path d={svgPaths.p2523f900} id="Vector" stroke="var(--stroke-0, #19294A)" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5" />
          <g id="Vector_2" opacity="0"></g>
        </g>
      </svg>
    </div>
  );
}

function VuesaxLinearArrowRight1() {
  return (
    <div className="opacity-[0.92] relative size-[12.45px]" data-name="vuesax/linear/arrow-right">
      <VuesaxLinearArrowRight />
    </div>
  );
}

function Group() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <div className="[grid-area:1_/_1] flex items-center justify-center ml-0 mt-0 relative size-[12.45px]" style={{ "--transform-inner-width": "12.4375", "--transform-inner-height": "12.4375" } as React.CSSProperties}>
        <div className="flex-none rotate-[90deg]">
          <VuesaxLinearArrowRight1 />
        </div>
      </div>
    </div>
  );
}

function Input6() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content6 />
          <HelpIcon4 />
          <Group />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ebf1ff] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}

function InputWithLabel4() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Input with label">
      <Input6 />
    </div>
  );
}

function InputFieldBase4() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[6px] grow items-start min-h-px min-w-px relative shrink-0" data-name="_Input field base">
      <InputWithLabel4 />
    </div>
  );
}

function Content7() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Nom</p>
    </div>
  );
}

function HelpIcon5() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Help icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="help-circle"></g>
      </svg>
    </div>
  );
}

function Input7() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content7 />
          <HelpIcon5 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ebf1ff] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}

function InputWithLabel5() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Input with label">
      <Input7 />
    </div>
  );
}

function InputFieldBase5() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[6px] grow items-start min-h-px min-w-px relative shrink-0" data-name="_Input field base">
      <InputWithLabel5 />
    </div>
  );
}

function Content8() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Prenom</p>
    </div>
  );
}

function HelpIcon6() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Help icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="help-circle"></g>
      </svg>
    </div>
  );
}

function Input8() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content8 />
          <HelpIcon6 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ebf1ff] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}

function InputWithLabel6() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Input with label">
      <Input8 />
    </div>
  );
}

function InputFieldBase6() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[6px] grow items-start min-h-px min-w-px relative shrink-0" data-name="_Input field base">
      <InputWithLabel6 />
    </div>
  );
}

function Content9() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Fonction</p>
    </div>
  );
}

function Input9() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content9 />
          <div className="h-[5px] relative shrink-0 w-[9.999px]">
            <div className="absolute inset-[-16.4%_-8.2%]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 7">
                <path d={svgPaths.p253fee80} id="Vector 99" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.64" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ebf1ff] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}

function InputWithLabel7() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Input with label">
      <Input9 />
    </div>
  );
}

function InputFieldBase7() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[6px] grow items-start min-h-px min-w-px relative shrink-0" data-name="_Input field base">
      <InputWithLabel7 />
    </div>
  );
}

function Frame39() {
  return (
    <div className="content-start flex flex-wrap gap-[16px] items-start relative shrink-0 w-full">
      <InputFieldBase4 />
      <InputFieldBase5 />
      <InputFieldBase6 />
      <InputFieldBase7 />
    </div>
  );
}

function FlagForFlagFranceSvgrepoCom1() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="flag-for-flag-france_svgrepo.com">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g clipPath="url(#clip0_1_3141)" id="flag-for-flag-france_svgrepo.com">
          <path d={svgPaths.p240c2b00} fill="var(--fill-0, #ED2939)" id="Vector" />
          <path d={svgPaths.p1acb4700} fill="var(--fill-0, #002495)" id="Vector_2" />
          <path d={svgPaths.p3d968080} fill="var(--fill-0, #EEEEEE)" id="Vector_3" />
        </g>
        <defs>
          <clipPath id="clip0_1_3141">
            <rect fill="white" height="20" width="20" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Content10() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <FlagForFlagFranceSvgrepoCom1 />
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Téléphone Fix</p>
    </div>
  );
}

function HelpIcon7() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Help icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="help-circle"></g>
      </svg>
    </div>
  );
}

function Input10() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content10 />
          <HelpIcon7 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ebf1ff] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}

function InputWithLabel8() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Input with label">
      <Input10 />
    </div>
  );
}

function InputFieldBase8() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[6px] grow items-start min-h-px min-w-px relative shrink-0" data-name="_Input field base">
      <InputWithLabel8 />
    </div>
  );
}

function FlagForFlagFranceSvgrepoCom2() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="flag-for-flag-france_svgrepo.com">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g clipPath="url(#clip0_1_3141)" id="flag-for-flag-france_svgrepo.com">
          <path d={svgPaths.p240c2b00} fill="var(--fill-0, #ED2939)" id="Vector" />
          <path d={svgPaths.p1acb4700} fill="var(--fill-0, #002495)" id="Vector_2" />
          <path d={svgPaths.p3d968080} fill="var(--fill-0, #EEEEEE)" id="Vector_3" />
        </g>
        <defs>
          <clipPath id="clip0_1_3141">
            <rect fill="white" height="20" width="20" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Content11() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <FlagForFlagFranceSvgrepoCom2 />
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Téléphone Mobile</p>
    </div>
  );
}

function HelpIcon8() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Help icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="help-circle"></g>
      </svg>
    </div>
  );
}

function Input11() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content11 />
          <HelpIcon8 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ebf1ff] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}

function InputWithLabel9() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Input with label">
      <Input11 />
    </div>
  );
}

function InputFieldBase9() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[6px] grow items-start min-h-px min-w-px relative shrink-0" data-name="_Input field base">
      <InputWithLabel9 />
    </div>
  );
}

function Frame40() {
  return (
    <div className="content-start flex flex-wrap gap-[16px] items-start relative shrink-0 w-full">
      <InputFieldBase8 />
      <InputFieldBase9 />
    </div>
  );
}

function Content12() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Email</p>
    </div>
  );
}

function HelpIcon9() {
  return <div className="shrink-0 size-[16px]" data-name="Help icon" />;
}

function Input12() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content12 />
          <HelpIcon9 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ebf1ff] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}

function InputWithLabel10() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Input with label">
      <Input12 />
    </div>
  );
}

function InputFieldBase10() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[6px] grow items-start min-h-px min-w-px relative shrink-0" data-name="_Input field base">
      <InputWithLabel10 />
    </div>
  );
}

function Frame36() {
  return (
    <div className="content-start flex flex-wrap gap-[16px] items-start relative shrink-0 w-full">
      <InputFieldBase10 />
    </div>
  );
}

function Frame23() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
      <Frame2 />
      <Frame39 />
      <Frame40 />
      <Frame36 />
    </div>
  );
}

function Frame11() {
  return <div className="content-stretch flex gap-[16px] items-start shrink-0" />;
}

function Frame28() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[16px] items-start left-[151.5px] top-[41.72px]">
      <Frame11 />
    </div>
  );
}

function Frame32() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full">
      <Frame23 />
      <Frame28 />
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">ÉLÉMENTS JURIDIQUES</p>
    </div>
  );
}

function FlagForFlagFranceSvgrepoCom3() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="flag-for-flag-france_svgrepo.com">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g clipPath="url(#clip0_1_3141)" id="flag-for-flag-france_svgrepo.com">
          <path d={svgPaths.p240c2b00} fill="var(--fill-0, #ED2939)" id="Vector" />
          <path d={svgPaths.p1acb4700} fill="var(--fill-0, #002495)" id="Vector_2" />
          <path d={svgPaths.p3d968080} fill="var(--fill-0, #EEEEEE)" id="Vector_3" />
        </g>
        <defs>
          <clipPath id="clip0_1_3141">
            <rect fill="white" height="20" width="20" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Content13() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <FlagForFlagFranceSvgrepoCom3 />
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Fax</p>
    </div>
  );
}

function HelpIcon10() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Help icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="help-circle"></g>
      </svg>
    </div>
  );
}

function Input13() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content13 />
          <HelpIcon10 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ebf1ff] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}

function InputWithLabel11() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Input with label">
      <Input13 />
    </div>
  );
}

function InputFieldBase11() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[6px] grow items-start min-h-px min-w-px relative shrink-0" data-name="_Input field base">
      <InputWithLabel11 />
    </div>
  );
}

function Content14() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">N° TVA Intracommunautaire</p>
    </div>
  );
}

function Input14() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content14 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ebf1ff] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}

function InputWithLabel12() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Input with label">
      <Input14 />
    </div>
  );
}

function InputFieldBase12() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[6px] grow items-start min-h-px min-w-px relative shrink-0" data-name="_Input field base">
      <InputWithLabel12 />
    </div>
  );
}

function Frame34() {
  return (
    <div className="basis-0 content-stretch flex gap-[16px] grow items-start min-h-px min-w-px relative shrink-0">
      <InputFieldBase12 />
    </div>
  );
}

function Frame41() {
  return (
    <div className="content-start flex flex-wrap gap-[16px] items-start relative shrink-0 w-full">
      <InputFieldBase11 />
      <Frame34 />
    </div>
  );
}

function Frame24() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
      <Frame3 />
      <Frame41 />
    </div>
  );
}

function Frame12() {
  return <div className="content-stretch flex gap-[16px] items-start shrink-0" />;
}

function Frame29() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[16px] items-start left-[151.5px] top-[41.72px]">
      <Frame12 />
    </div>
  );
}

function Frame25() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full">
      <Frame24 />
      <Frame29 />
    </div>
  );
}

function Content15() {
  return (
    <div className="box-border content-stretch flex flex-col font-['Poppins:Regular',sans-serif] h-[40px] items-start justify-center leading-[24px] not-italic pb-[6px] pt-0 px-0 relative rounded-[8px] shrink-0 text-[13px] text-nowrap whitespace-pre" data-name="Content">
      <p className="relative shrink-0 text-[#6a90ba]">Adcertif</p>
      <p className="relative shrink-0 text-[rgba(106,144,186,0.51)]">105 Boulevard PAUL VAILLANT COUTURIER 95190 GOUSSAINVILLE</p>
    </div>
  );
}

function Frame44() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0">
      <Content15 />
    </div>
  );
}

function Content16() {
  return (
    <div className="box-border content-stretch flex flex-col font-['Poppins:Regular',sans-serif] h-[40px] items-start justify-center leading-[24px] not-italic pb-[6px] pt-0 px-0 relative rounded-[8px] shrink-0 text-[13px] text-nowrap whitespace-pre" data-name="Content">
      <p className="relative shrink-0 text-[#6a90ba]">Adtraining</p>
      <p className="relative shrink-0 text-[rgba(106,144,186,0.51)]">105 Boulevard PAUL VAILLANT COUTURIER 95190 GOUSSAINVILLE</p>
    </div>
  );
}

function Frame45() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0">
      <Content16 />
    </div>
  );
}

function Content17() {
  return (
    <div className="box-border content-stretch flex flex-col font-['Poppins:Regular',sans-serif] h-[40px] items-start justify-center leading-[24px] not-italic pb-[6px] pt-0 px-0 relative rounded-[8px] shrink-0 text-[13px] text-nowrap whitespace-pre" data-name="Content">
      <p className="relative shrink-0 text-[#6a90ba]">Elec Learning</p>
      <p className="relative shrink-0 text-[rgba(106,144,186,0.51)]">105 Boulevard PAUL VAILLANT COUTURIER 95190 GOUSSAINVILLE</p>
    </div>
  );
}

function Frame46() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0">
      <Content17 />
    </div>
  );
}

function Frame43() {
  return (
    <div className="absolute bg-white box-border content-stretch flex flex-col gap-[10px] items-start left-[-2px] px-[11px] py-[12px] rounded-[8px] top-[176px]">
      <div aria-hidden="true" className="absolute border border-[#ebf1ff] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
      <Frame44 />
      <Frame45 />
      <Frame46 />
    </div>
  );
}

function Frame7() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-[804px]">
      <Frame31 />
      <Frame8 />
      <Frame20 />
      <Frame32 />
      <Frame25 />
      <Frame43 />
    </div>
  );
}

function Frame18() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
      <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#7e8ca9] text-[13px] text-nowrap whitespace-pre">annuler</p>
    </div>
  );
}

function Frame13() {
  return (
    <div className="content-stretch flex gap-[19px] items-center relative shrink-0">
      <Frame18 />
    </div>
  );
}

function Frame16() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[16px] h-[40px] items-start px-[16px] py-[10px] relative rounded-[10px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[#6a90ba] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <Frame13 />
    </div>
  );
}

function Frame19() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
      <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">appliquer au document</p>
    </div>
  );
}

function Frame15() {
  return (
    <div className="content-stretch flex gap-[19px] items-center relative shrink-0">
      <Frame19 />
    </div>
  );
}

function Frame14() {
  return (
    <div className="bg-[#007aff] box-border content-stretch flex flex-col gap-[16px] h-[40px] items-start px-[16px] py-[10px] relative rounded-[10px] shrink-0">
      <Frame15 />
    </div>
  );
}

function Frame17() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
      <Frame16 />
      <Frame14 />
    </div>
  );
}

function Frame30() {
  return (
    <div className="content-stretch flex gap-[37px] h-[40px] items-start justify-end relative shrink-0 w-[804px]">
      <Frame17 />
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex flex-col gap-[37px] items-center justify-center relative shrink-0 w-full">
      <Frame7 />
      <Frame30 />
      <div className="absolute h-[110.5px] left-[895px] top-[150.5px] w-0">
        <div className="absolute inset-[-3.17%_-3.5px]" style={{ "--stroke-0": "rgba(232, 240, 247, 1)" } as React.CSSProperties}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 118">
            <path d="M3.5 3.5V114" id="Vector 95" stroke="var(--stroke-0, #E8F0F7)" strokeLinecap="round" strokeWidth="7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Frame6() {
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

export default function Frame5() {
  return (
    <div className="bg-white relative rounded-[18px] size-full">
      <div aria-hidden="true" className="absolute border border-[#dbd9d9] border-solid inset-0 pointer-events-none rounded-[18px] shadow-[0px_0px_75.3px_0px_rgba(25,41,74,0.24)]" />
      <div className="flex flex-col justify-end size-full">
        <div className="box-border content-stretch flex flex-col gap-[28px] items-start justify-end pb-[20px] pt-[59px] px-[20px] relative size-full">
          <Frame4 />
          <Frame6 />
        </div>
      </div>
    </div>
  );
}