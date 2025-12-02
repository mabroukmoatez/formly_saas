import svgPaths from "./svg-qa1y3vi81s";

function Group() {
  return (
    <div className="[grid-area:1_/_1] h-[65.923px] ml-0 mt-0 relative w-[62.926px]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 63 66">
        <g id="Group">
          <path d={svgPaths.p1e1da800} fill="var(--fill-0, #FFCC00)" id="Vector" />
          <path d={svgPaths.p302161f0} fill="var(--fill-0, #FF9500)" id="Vector_2" />
          <path d={svgPaths.p7927e80} fill="var(--fill-0, #007AFF)" id="Vector_3" />
        </g>
      </svg>
    </div>
  );
}

function Layer() {
  return (
    <div className="[grid-area:1_/_1] grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-0 mt-0 place-items-start relative" data-name="Layer 4">
      <Group />
    </div>
  );
}

function Group3() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <Layer />
    </div>
  );
}

function Frame13() {
  return (
    <div className="bg-[#ebf1ff] content-stretch flex gap-[25px] items-center justify-center relative rounded-[10px] shrink-0 size-[100px]">
      <Group3 />
    </div>
  );
}

function Frame32() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] h-[60px] items-center justify-center px-0 py-[9px] relative rounded-[5px] shrink-0 w-full">
      <Frame13 />
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">COORDONNÉES DE LA SOCIÉTÉ</p>
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
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ebf1ff] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}

function Content1() {
  return (
    <div className="basis-0 content-stretch flex flex-col font-['Poppins:Regular',sans-serif] gap-[14px] grow h-full items-start justify-center leading-[0px] min-h-px min-w-px not-italic relative shrink-0" data-name="Content">
      <p className="relative shrink-0 text-[#6a90ba] text-[7px] w-full">Compliment Raison Social</p>
      <p className="relative shrink-0 text-[#19294a] text-[13px] w-full">Compliment Formly</p>
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

function Content2() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Adresse</p>
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

function Frame34() {
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
        <g clipPath="url(#clip0_1_3136)" id="help-circle">
          <path d={svgPaths.p255c9380} id="Icon" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
        <defs>
          <clipPath id="clip0_1_3136">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
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

function Content4() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Code Postal</p>
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

function Group4() {
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

function Input4() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content4 />
          <Group4 />
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
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Ville</p>
    </div>
  );
}

function VuesaxLinearArrowRight2() {
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

function VuesaxLinearArrowRight3() {
  return (
    <div className="opacity-[0.92] relative size-[12.45px]" data-name="vuesax/linear/arrow-right">
      <VuesaxLinearArrowRight2 />
    </div>
  );
}

function Group5() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <div className="[grid-area:1_/_1] flex items-center justify-center ml-0 mt-0 relative size-[12.45px]" style={{ "--transform-inner-width": "12.4375", "--transform-inner-height": "12.4375" } as React.CSSProperties}>
        <div className="flex-none rotate-[90deg]">
          <VuesaxLinearArrowRight3 />
        </div>
      </div>
    </div>
  );
}

function Input5() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content5 />
          <Group5 />
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

function Frame36() {
  return (
    <div className="content-start flex flex-wrap gap-[16px] items-start relative shrink-0 w-full">
      <InputFieldBase2 />
      <InputFieldBase3 />
    </div>
  );
}

function Frame23() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
      <Frame />
      <Frame33 />
      <Frame34 />
      <Frame35 />
      <Frame36 />
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full">
      <Frame23 />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">COORDONNÉES</p>
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

function Content6() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <FlagForFlagFranceSvgrepoCom />
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Téléphone Fix</p>
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

function Input6() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content6 />
          <HelpIcon2 />
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

function Content7() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <FlagForFlagFranceSvgrepoCom1 />
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Téléphone Mobile</p>
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

function Input7() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content7 />
          <HelpIcon3 />
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

function Frame43() {
  return (
    <div className="content-start flex flex-wrap gap-[16px] items-start relative shrink-0 w-full">
      <InputFieldBase4 />
      <InputFieldBase5 />
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

function Content8() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <FlagForFlagFranceSvgrepoCom2 />
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Fax</p>
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

function Input8() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content8 />
          <HelpIcon4 />
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
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Email</p>
    </div>
  );
}

function HelpIcon5() {
  return <div className="shrink-0 size-[16px]" data-name="Help icon" />;
}

function Input9() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content9 />
          <HelpIcon5 />
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

function Frame44() {
  return (
    <div className="content-start flex flex-wrap gap-[16px] items-start relative shrink-0 w-full">
      <InputFieldBase6 />
      <InputFieldBase7 />
    </div>
  );
}

function Content10() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Site Web</p>
    </div>
  );
}

function HelpIcon6() {
  return <div className="shrink-0 size-[16px]" data-name="Help icon" />;
}

function Input10() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content10 />
          <HelpIcon6 />
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

function Frame45() {
  return (
    <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full">
      <InputFieldBase8 />
    </div>
  );
}

function Frame25() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
      <Frame1 />
      <Frame43 />
      <Frame44 />
      <Frame45 />
    </div>
  );
}

function Frame11() {
  return <div className="content-stretch flex gap-[16px] items-start shrink-0" />;
}

function Frame29() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[16px] items-start left-[151.5px] top-[41.72px]">
      <Frame11 />
    </div>
  );
}

function Frame22() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full">
      <Frame25 />
      <Frame29 />
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">ÉLÉMENTS JURIDIQUES</p>
    </div>
  );
}

function TextInput() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-start leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba]" data-name="Text input">
      <p className="font-['Inter:Regular',sans-serif] font-normal relative shrink-0 text-[16px] text-nowrap whitespace-pre">{`€ `}</p>
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow min-h-px min-w-px relative shrink-0 text-[14px]">Capital</p>
    </div>
  );
}

function Content11() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Content">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center pl-[14px] pr-0 py-[10px] relative w-full">
          <TextInput />
        </div>
      </div>
    </div>
  );
}

function Input11() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="content-stretch flex items-start overflow-clip relative rounded-[inherit] w-full">
        <Content11 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#d5d7da] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
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

function Content12() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">RCS</p>
    </div>
  );
}

function Input12() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content12 />
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

function Frame46() {
  return (
    <div className="content-start flex flex-wrap gap-[16px] items-start relative shrink-0 w-full">
      <InputFieldBase9 />
      <InputFieldBase10 />
    </div>
  );
}

function Content13() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">SIRET</p>
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

function Input13() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content13 />
          <HelpIcon7 />
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
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">NAF</p>
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

function Frame47() {
  return (
    <div className="content-start flex flex-wrap gap-[16px] items-start relative shrink-0 w-full">
      <InputFieldBase11 />
      <InputFieldBase12 />
    </div>
  );
}

function Content15() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">N° TVA Intracommunautaire</p>
    </div>
  );
}

function Input15() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content15 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ebf1ff] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}

function InputWithLabel13() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Input with label">
      <Input15 />
    </div>
  );
}

function InputFieldBase13() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[6px] grow items-start min-h-px min-w-px relative shrink-0" data-name="_Input field base">
      <InputWithLabel13 />
    </div>
  );
}

function Frame48() {
  return (
    <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full">
      <InputFieldBase13 />
    </div>
  );
}

function Frame26() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
      <Frame2 />
      <Frame46 />
      <Frame47 />
      <Frame48 />
    </div>
  );
}

function Frame12() {
  return <div className="content-stretch flex gap-[16px] items-start shrink-0" />;
}

function Frame30() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[16px] items-start left-[151.5px] top-[41.72px]">
      <Frame12 />
    </div>
  );
}

function Frame27() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full">
      <Frame26 />
      <Frame30 />
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">COORDONNÉES BANCAIRES</p>
    </div>
  );
}

function Frame39() {
  return (
    <div className="content-stretch flex flex-col font-['Inter:Regular',sans-serif] font-normal gap-[3px] items-start leading-[17.647px] not-italic relative shrink-0 text-[11.765px] text-nowrap whitespace-pre">
      <p className="relative shrink-0 text-[#6a90ba]">IBAN</p>
      <p className="relative shrink-0 text-[#19294a]">FR76 3000 4008 9112 3456 7890 142</p>
    </div>
  );
}

function Frame40() {
  return (
    <div className="content-stretch flex flex-col font-['Inter:Regular',sans-serif] font-normal gap-[3px] items-start leading-[17.647px] not-italic relative shrink-0 text-[11.765px] text-nowrap whitespace-pre">
      <p className="relative shrink-0 text-[#6a90ba]">BIC / SWIFT</p>
      <p className="relative shrink-0 text-[#19294a]">BNPAFRPPXXX</p>
    </div>
  );
}

function Frame41() {
  return (
    <div className="content-stretch flex flex-col gap-[3px] items-start relative shrink-0">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[17.647px] not-italic relative shrink-0 text-[#19294a] text-[11.765px] text-nowrap whitespace-pre">IBAN PAR DÉFAUT</p>
    </div>
  );
}

function Frame42() {
  return (
    <div className="content-stretch flex items-end justify-between relative shrink-0 w-[344px]">
      <Frame40 />
      <Frame41 />
    </div>
  );
}

function TermsConditions() {
  return (
    <div className="bg-white box-border content-stretch flex flex-col gap-[11.765px] h-[154px] items-start justify-center px-[23.529px] py-[17.647px] relative rounded-[5px] shrink-0 w-[391px]" data-name="Terms & Conditions">
      <div aria-hidden="true" className="absolute border border-[#007aff] border-solid inset-0 pointer-events-none rounded-[5px]" />
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[17.647px] not-italic relative shrink-0 text-[#19294a] text-[11.765px] text-nowrap whitespace-pre">Zaid b - Banque Nationale Française</p>
      <Frame39 />
      <Frame42 />
    </div>
  );
}

function Group1() {
  return (
    <div className="h-[12.159px] relative shrink-0 w-[10.808px]">
      <div className="absolute inset-[-3.33%_-3.75%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 13">
          <g id="Group 1000003250">
            <path d="M4.45848 5.80953V9.86269" id="Vector" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.810632" />
            <path d="M7.16058 5.80953V9.86269" id="Vector_2" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.810632" />
            <path d="M0.405316 3.10742H11.2137" id="Vector_3" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.810632" />
            <path d={svgPaths.p13e10900} id="Vector_4" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.810632" />
            <path d={svgPaths.p2c347900} id="Vector_5" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.810632" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Frame7() {
  return (
    <div className="bg-[#e8f0f7] box-border content-stretch flex gap-[12.97px] items-center justify-center p-[9.728px] relative rounded-[34.857px] shrink-0 size-[24.859px]">
      <div aria-hidden="true" className="absolute border-[#6a90ba] border-[0.811px] border-solid inset-0 pointer-events-none rounded-[34.857px]" />
      <Group1 />
    </div>
  );
}

function Group2() {
  return (
    <div className="h-[10.299px] relative shrink-0 w-[10.367px]">
      <div className="absolute inset-[-4.18%_-4.15%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
          <g id="Group 1000003282">
            <path d={svgPaths.p3a925f80} id="Vector" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.860176" />
            <path d="M10.797 10.7294H5.63598" id="Vector_2" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.860176" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Frame8() {
  return (
    <div className="bg-[#e8f0f7] box-border content-stretch flex gap-[12.97px] items-center justify-center p-[9.728px] relative rounded-[34.857px] shrink-0 size-[24.859px]">
      <div aria-hidden="true" className="absolute border-[#6a90ba] border-[0.811px] border-solid inset-0 pointer-events-none rounded-[34.857px]" />
      <Group2 />
    </div>
  );
}

function Frame37() {
  return (
    <div className="content-stretch flex gap-[9.25px] items-center relative shrink-0">
      <Frame7 />
      <Frame8 />
    </div>
  );
}

function Frame49() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-end justify-center relative shrink-0">
      <TermsConditions />
      <Frame37 />
    </div>
  );
}

function Frame21() {
  return (
    <div className="bg-[rgba(232,240,247,0.21)] h-[154px] relative rounded-[10px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-[#6a90ba] border-dashed inset-0 pointer-events-none rounded-[10px]" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[16px] h-[154px] items-center justify-center px-[20px] py-[12px] relative w-full">
          <div className="relative shrink-0 size-[13.292px]" data-name="Vector">
            <div className="absolute inset-[-7.52%]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                <path d={svgPaths.p14b81900} id="Vector" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeWidth="2" />
              </svg>
            </div>
          </div>
          <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#6a90ba] text-[14px] text-nowrap whitespace-pre">Ajouter un compte</p>
        </div>
      </div>
    </div>
  );
}

function Frame50() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[8px] grow h-[154px] items-start min-h-px min-w-px relative shrink-0">
      <Frame21 />
    </div>
  );
}

function Frame38() {
  return (
    <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full">
      <Frame49 />
      <Frame50 />
    </div>
  );
}

function Frame28() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
      <Frame3 />
      <Frame38 />
    </div>
  );
}

function Frame24() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full">
      <Frame28 />
    </div>
  );
}

function Frame9() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-[804px]">
      <Frame32 />
      <Frame10 />
      <Frame22 />
      <Frame27 />
      <Frame24 />
    </div>
  );
}

function Frame19() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
      <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#7e8ca9] text-[13px] text-nowrap whitespace-pre">annuler</p>
    </div>
  );
}

function Frame14() {
  return (
    <div className="content-stretch flex gap-[19px] items-center relative shrink-0">
      <Frame19 />
    </div>
  );
}

function Frame17() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[16px] h-[40px] items-start px-[16px] py-[10px] relative rounded-[10px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[#6a90ba] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <Frame14 />
    </div>
  );
}

function Frame20() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
      <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">Mettre à jour</p>
    </div>
  );
}

function Frame16() {
  return (
    <div className="content-stretch flex gap-[19px] items-center relative shrink-0">
      <Frame20 />
    </div>
  );
}

function Frame15() {
  return (
    <div className="bg-[#007aff] box-border content-stretch flex flex-col gap-[16px] h-[40px] items-start px-[16px] py-[10px] relative rounded-[10px] shrink-0">
      <Frame16 />
    </div>
  );
}

function Frame18() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
      <Frame17 />
      <Frame15 />
    </div>
  );
}

function Frame31() {
  return (
    <div className="content-stretch flex gap-[37px] h-[40px] items-start justify-end relative shrink-0 w-[904px]">
      <Frame18 />
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex flex-col gap-[37px] items-center justify-center relative shrink-0 w-full">
      <Frame9 />
      <Frame31 />
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