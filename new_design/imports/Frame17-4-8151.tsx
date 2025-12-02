import svgPaths from "./svg-dtdgnhs97l";

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

function Frame15() {
  return (
    <div className="bg-[#ebf1ff] content-stretch flex gap-[25px] items-center justify-center relative rounded-[10px] shrink-0 size-[100px]">
      <Group3 />
    </div>
  );
}

function Frame43() {
  return (
    <div className="bg-white box-border content-stretch flex gap-[10px] h-[60px] items-center justify-center px-0 py-[9px] relative rounded-[5px] shrink-0 w-full">
      <Frame15 />
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">Informations du client</p>
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

function Frame45() {
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

function Frame46() {
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

function Frame47() {
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

function Frame48() {
  return (
    <div className="content-start flex flex-wrap gap-[16px] items-start relative shrink-0 w-full">
      <InputFieldBase2 />
      <InputFieldBase3 />
    </div>
  );
}

function Frame31() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
      <Frame />
      <Frame45 />
      <Frame46 />
      <Frame47 />
      <Frame48 />
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full">
      <Frame31 />
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

function Frame55() {
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

function Frame56() {
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

function Frame57() {
  return (
    <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full">
      <InputFieldBase8 />
    </div>
  );
}

function Frame33() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
      <Frame1 />
      <Frame55 />
      <Frame56 />
      <Frame57 />
    </div>
  );
}

function Frame12() {
  return <div className="content-stretch flex gap-[16px] items-start shrink-0" />;
}

function Frame37() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[16px] items-start left-[151.5px] top-[41.72px]">
      <Frame12 />
    </div>
  );
}

function Frame30() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full">
      <Frame33 />
      <Frame37 />
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

function Frame58() {
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

function Frame59() {
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

function Frame60() {
  return (
    <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full">
      <InputFieldBase13 />
    </div>
  );
}

function Frame34() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
      <Frame2 />
      <Frame58 />
      <Frame59 />
      <Frame60 />
    </div>
  );
}

function Frame13() {
  return <div className="content-stretch flex gap-[16px] items-start shrink-0" />;
}

function Frame38() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[16px] items-start left-[151.5px] top-[41.72px]">
      <Frame13 />
    </div>
  );
}

function Frame35() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full">
      <Frame34 />
      <Frame38 />
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

function Frame51() {
  return (
    <div className="content-stretch flex flex-col font-['Inter:Regular',sans-serif] font-normal gap-[3px] items-start leading-[17.647px] not-italic relative shrink-0 text-[11.765px] text-nowrap whitespace-pre">
      <p className="relative shrink-0 text-[#6a90ba]">IBAN</p>
      <p className="relative shrink-0 text-[#19294a]">FR76 3000 4008 9112 3456 7890 142</p>
    </div>
  );
}

function Frame52() {
  return (
    <div className="content-stretch flex flex-col font-['Inter:Regular',sans-serif] font-normal gap-[3px] items-start leading-[17.647px] not-italic relative shrink-0 text-[11.765px] text-nowrap whitespace-pre">
      <p className="relative shrink-0 text-[#6a90ba]">BIC / SWIFT</p>
      <p className="relative shrink-0 text-[#19294a]">BNPAFRPPXXX</p>
    </div>
  );
}

function Frame53() {
  return (
    <div className="content-stretch flex flex-col gap-[3px] items-start relative shrink-0">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[17.647px] not-italic relative shrink-0 text-[#19294a] text-[11.765px] text-nowrap whitespace-pre">IBAN PAR DÉFAUT</p>
    </div>
  );
}

function Frame54() {
  return (
    <div className="content-stretch flex items-end justify-between relative shrink-0 w-[344px]">
      <Frame52 />
      <Frame53 />
    </div>
  );
}

function TermsConditions() {
  return (
    <div className="bg-white box-border content-stretch flex flex-col gap-[11.765px] h-[154px] items-start justify-center px-[23.529px] py-[17.647px] relative rounded-[5px] shrink-0 w-[391px]" data-name="Terms & Conditions">
      <div aria-hidden="true" className="absolute border border-[#007aff] border-solid inset-0 pointer-events-none rounded-[5px]" />
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[17.647px] not-italic relative shrink-0 text-[#19294a] text-[11.765px] text-nowrap whitespace-pre">Zaid b - Banque Nationale Française</p>
      <Frame51 />
      <Frame54 />
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

function Frame8() {
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

function Frame9() {
  return (
    <div className="bg-[#e8f0f7] box-border content-stretch flex gap-[12.97px] items-center justify-center p-[9.728px] relative rounded-[34.857px] shrink-0 size-[24.859px]">
      <div aria-hidden="true" className="absolute border-[#6a90ba] border-[0.811px] border-solid inset-0 pointer-events-none rounded-[34.857px]" />
      <Group2 />
    </div>
  );
}

function Frame49() {
  return (
    <div className="content-stretch flex gap-[9.25px] items-center relative shrink-0">
      <Frame8 />
      <Frame9 />
    </div>
  );
}

function Frame61() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-end justify-center relative shrink-0">
      <TermsConditions />
      <Frame49 />
    </div>
  );
}

function Frame29() {
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

function Frame62() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[8px] grow h-[154px] items-start min-h-px min-w-px relative shrink-0">
      <Frame29 />
    </div>
  );
}

function Frame50() {
  return (
    <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full">
      <Frame61 />
      <Frame62 />
    </div>
  );
}

function Frame36() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
      <Frame3 />
      <Frame50 />
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
      <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap uppercase whitespace-pre">Coordonnées Bancaires</p>
    </div>
  );
}

function TextInput1() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Text input">
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Nom du compte</p>
    </div>
  );
}

function Content16() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Content">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center pl-[14px] pr-0 py-[10px] relative w-full">
          <TextInput1 />
        </div>
      </div>
    </div>
  );
}

function Input16() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="content-stretch flex items-start overflow-clip relative rounded-[inherit] w-full">
        <Content16 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#d5d7da] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}

function InputWithLabel14() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Input with label">
      <Input16 />
    </div>
  );
}

function InputFieldBase14() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[6px] grow items-start min-h-px min-w-px relative shrink-0" data-name="_Input field base">
      <InputWithLabel14 />
    </div>
  );
}

function Content17() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Nom de la banque</p>
    </div>
  );
}

function Input17() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content17 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ebf1ff] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}

function InputWithLabel15() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Input with label">
      <Input17 />
    </div>
  );
}

function InputFieldBase15() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[6px] grow items-start min-h-px min-w-px relative shrink-0" data-name="_Input field base">
      <InputWithLabel15 />
    </div>
  );
}

function Frame63() {
  return (
    <div className="content-start flex flex-wrap gap-[16px] items-start relative shrink-0 w-full">
      <InputFieldBase14 />
      <InputFieldBase15 />
    </div>
  );
}

function Content18() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">IBAN</p>
    </div>
  );
}

function Input18() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content18 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ebf1ff] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}

function InputWithLabel16() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Input with label">
      <Input18 />
    </div>
  );
}

function InputFieldBase16() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[6px] grow items-start min-h-px min-w-px relative shrink-0" data-name="_Input field base">
      <InputWithLabel16 />
    </div>
  );
}

function Frame64() {
  return (
    <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full">
      <InputFieldBase16 />
    </div>
  );
}

function Content19() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">BIC / SWIFT</p>
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

function Input19() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content19 />
          <HelpIcon8 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ebf1ff] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}

function InputWithLabel17() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Input with label">
      <Input19 />
    </div>
  );
}

function InputFieldBase17() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[6px] grow items-start min-h-px min-w-px relative shrink-0" data-name="_Input field base">
      <InputWithLabel17 />
    </div>
  );
}

function Content20() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Adress</p>
    </div>
  );
}

function Input20() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content20 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ebf1ff] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}

function InputWithLabel18() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Input with label">
      <Input20 />
    </div>
  );
}

function InputFieldBase18() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[6px] grow items-start min-h-px min-w-px relative shrink-0" data-name="_Input field base">
      <InputWithLabel18 />
    </div>
  );
}

function Frame65() {
  return (
    <div className="content-start flex flex-wrap gap-[16px] items-start relative shrink-0 w-full">
      <InputFieldBase17 />
      <InputFieldBase18 />
    </div>
  );
}

function Dot() {
  return (
    <div className="absolute left-[18.95px] size-[17.506px] top-[0.69px]" data-name="Dot">
      <div className="absolute inset-[-2.78%_-5.56%_-8.33%_-5.56%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
          <g id="Dot">
            <g filter="url(#filter0_d_1_3067)" id="Fill">
              <circle cx="9.72531" cy="9.23904" fill="var(--fill-0, white)" r="8.75278" />
            </g>
          </g>
          <defs>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="19.4506" id="filter0_d_1_3067" width="19.4506" x="0" y="0">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
              <feOffset dy="0.486266" />
              <feGaussianBlur stdDeviation="0.486266" />
              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
              <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_3067" />
              <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_3067" mode="normal" result="shape" />
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function Toggle() {
  return (
    <div className="bg-[#007aff] h-[19.451px] relative rounded-[9.725px] shrink-0 w-[37.929px]" data-name="Toggle">
      <Dot />
      <div className="absolute inset-0 pointer-events-none shadow-[0px_0px_2.188px_0px_inset_rgba(0,0,0,0.25)]" />
    </div>
  );
}

function Frame41() {
  return (
    <div className="content-stretch flex gap-[16px] items-center justify-end relative shrink-0 w-full">
      <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#5c677e] text-[14px] text-nowrap whitespace-pre">choisir comme iban par défaut</p>
      <Toggle />
    </div>
  );
}

function Frame25() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
      <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#7e8ca9] text-[13px] text-nowrap whitespace-pre">annuler</p>
    </div>
  );
}

function Frame16() {
  return (
    <div className="content-stretch flex gap-[19px] items-center relative shrink-0">
      <Frame25 />
    </div>
  );
}

function Frame19() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[16px] h-[40px] items-start px-[16px] py-[10px] relative rounded-[10px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[#6a90ba] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <Frame16 />
    </div>
  );
}

function Frame26() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
      <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">{`enregistrer `}</p>
    </div>
  );
}

function Frame17() {
  return (
    <div className="content-stretch flex gap-[19px] items-center relative shrink-0">
      <Frame26 />
    </div>
  );
}

function Frame18() {
  return (
    <div className="bg-[#ff7700] box-border content-stretch flex flex-col gap-[16px] h-[40px] items-start px-[16px] py-[10px] relative rounded-[10px] shrink-0">
      <Frame17 />
    </div>
  );
}

function Frame66() {
  return (
    <div className="content-stretch flex gap-[16px] items-start justify-end relative shrink-0">
      <Frame19 />
      <Frame18 />
    </div>
  );
}

function Frame39() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-end relative shrink-0 w-full">
      <Frame4 />
      <Frame63 />
      <Frame64 />
      <Frame65 />
      <Frame41 />
      <Frame66 />
    </div>
  );
}

function Frame14() {
  return <div className="content-stretch flex gap-[16px] items-start shrink-0" />;
}

function Frame40() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[16px] items-start left-[151.5px] top-[41.72px]">
      <Frame14 />
    </div>
  );
}

function Frame44() {
  return (
    <div className="relative rounded-[6px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-[#6a90ba] border-solid inset-0 pointer-events-none rounded-[6px]" />
      <div className="flex flex-col items-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[24px] items-center px-[19px] py-[11px] relative w-full">
          <Frame39 />
          <Frame40 />
        </div>
      </div>
    </div>
  );
}

function Frame32() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full">
      <Frame36 />
      <Frame44 />
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-[804px]">
      <Frame43 />
      <Frame11 />
      <Frame30 />
      <Frame35 />
      <Frame32 />
    </div>
  );
}

function Frame27() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
      <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#7e8ca9] text-[13px] text-nowrap whitespace-pre">annuler</p>
    </div>
  );
}

function Frame20() {
  return (
    <div className="content-stretch flex gap-[19px] items-center relative shrink-0">
      <Frame27 />
    </div>
  );
}

function Frame21() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[16px] h-[40px] items-start px-[16px] py-[10px] relative rounded-[10px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[#6a90ba] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <Frame20 />
    </div>
  );
}

function Frame28() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
      <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">Mettre à jour</p>
    </div>
  );
}

function Frame22() {
  return (
    <div className="content-stretch flex gap-[19px] items-center relative shrink-0">
      <Frame28 />
    </div>
  );
}

function Frame23() {
  return (
    <div className="bg-[#007aff] box-border content-stretch flex flex-col gap-[16px] h-[40px] items-start px-[16px] py-[10px] relative rounded-[10px] shrink-0">
      <Frame22 />
    </div>
  );
}

function Frame24() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
      <Frame21 />
      <Frame23 />
    </div>
  );
}

function Frame42() {
  return (
    <div className="content-stretch flex gap-[37px] h-[40px] items-start justify-end relative shrink-0 w-[904px]">
      <Frame24 />
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex flex-col gap-[37px] items-center justify-center relative shrink-0 w-full">
      <Frame10 />
      <Frame42 />
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

function Frame7() {
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

export default function Frame6() {
  return (
    <div className="bg-white relative rounded-[18px] size-full">
      <div aria-hidden="true" className="absolute border border-[#dbd9d9] border-solid inset-0 pointer-events-none rounded-[18px] shadow-[0px_0px_75.3px_0px_rgba(25,41,74,0.24)]" />
      <div className="flex flex-col justify-end size-full">
        <div className="box-border content-stretch flex flex-col gap-[28px] items-start justify-end pb-[20px] pt-[59px] px-[20px] relative size-full">
          <Frame5 />
          <Frame7 />
        </div>
      </div>
    </div>
  );
}