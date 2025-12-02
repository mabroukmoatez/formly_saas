import svgPaths from "./svg-vzb2y8qrf4";

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
    <div className="bg-[#ff7700] h-[19.451px] relative rounded-[9.725px] shrink-0 w-[37.929px]" data-name="Toggle">
      <Dot />
      <div className="absolute inset-0 pointer-events-none shadow-[0px_0px_2.188px_0px_inset_rgba(0,0,0,0.25)]" />
    </div>
  );
}

function Frame33() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
      <p className="capitalize font-['Poppins:Bold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#6a90ba] text-[14px] text-nowrap whitespace-pre">Client professionnel</p>
      <Toggle />
      <p className="capitalize font-['Poppins:Bold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#ff7700] text-[14px] text-nowrap whitespace-pre">Client particulier</p>
    </div>
  );
}

function Frame24() {
  return (
    <div className="bg-white box-border content-stretch flex flex-col gap-[10px] h-[60px] items-center justify-center px-0 py-[9px] relative rounded-[5px] shrink-0 w-full">
      <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">Quelles sont les coordonnées de votre client ?</p>
      <Frame33 />
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">COORDONNÉES</p>
    </div>
  );
}

function Content() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Civilité</p>
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

function Input() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content />
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
      <Input />
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

function Content1() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Nom</p>
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

function Input1() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content1 />
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
      <Input1 />
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

function Content2() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Prenom</p>
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

function Input2() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content2 />
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
      <Input2 />
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

function Frame26() {
  return (
    <div className="content-start flex flex-wrap gap-[16px] items-start relative shrink-0 w-full">
      <InputFieldBase />
      <InputFieldBase1 />
      <InputFieldBase2 />
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

function Content3() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <FlagForFlagFranceSvgrepoCom />
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Téléphone Fix</p>
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

function Input3() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content3 />
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
      <Input3 />
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

function Content4() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <FlagForFlagFranceSvgrepoCom1 />
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Téléphone Mobile</p>
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

function Input4() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content4 />
          <HelpIcon4 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ebf1ff] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}

function InputWithLabel4() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Input with label">
      <Input4 />
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

function Frame30() {
  return (
    <div className="content-start flex flex-wrap gap-[16px] items-start relative shrink-0 w-full">
      <InputFieldBase3 />
      <InputFieldBase4 />
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

function Content5() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <FlagForFlagFranceSvgrepoCom2 />
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Fax</p>
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

function Input5() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content5 />
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
      <Input5 />
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

function Content6() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Email</p>
    </div>
  );
}

function Input6() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content6 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ebf1ff] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}

function InputWithLabel6() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Input with label">
      <Input6 />
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

function Frame27() {
  return (
    <div className="basis-0 content-stretch flex gap-[16px] grow items-start min-h-px min-w-px relative shrink-0">
      <InputFieldBase6 />
    </div>
  );
}

function Frame29() {
  return (
    <div className="content-start flex flex-wrap gap-[16px] items-start relative shrink-0 w-full">
      <InputFieldBase5 />
      <Frame27 />
    </div>
  );
}

function Frame16() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
      <Frame29 />
    </div>
  );
}

function Frame6() {
  return <div className="content-stretch flex gap-[16px] items-start shrink-0" />;
}

function Frame21() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[16px] items-start left-[151.5px] top-[41.72px]">
      <Frame6 />
    </div>
  );
}

function Frame17() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full">
      <Frame16 />
      <Frame21 />
    </div>
  );
}

function Frame18() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
      <Frame />
      <Frame26 />
      <Frame30 />
      <Frame17 />
    </div>
  );
}

function Frame25() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full">
      <Frame18 />
    </div>
  );
}

function Frame19() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
      <Frame25 />
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full">
      <Frame19 />
    </div>
  );
}

function Content7() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Adresse</p>
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

function Input7() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content7 />
          <HelpIcon6 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ebf1ff] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}

function InputWithLabel7() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Input with label">
      <Input7 />
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

function Frame32() {
  return (
    <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full">
      <InputFieldBase7 />
    </div>
  );
}

function Content8() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">compliment d’Adresse</p>
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

function Input8() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content8 />
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
      <Input8 />
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

function Frame28() {
  return (
    <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full">
      <InputFieldBase8 />
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

function Content9() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <FlagForFlagFranceSvgrepoCom3 />
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Code Postal</p>
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

function Input9() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <Content9 />
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
      <Input9 />
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

function Content10() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Content">
      <p className="basis-0 font-['Inter:Regular',sans-serif] font-normal grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[16px]">Ville</p>
    </div>
  );
}

function HelpIcon9() {
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
      <Input10 />
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

function Frame31() {
  return (
    <div className="content-start flex flex-wrap gap-[16px] items-start relative shrink-0 w-full">
      <InputFieldBase9 />
      <InputFieldBase10 />
    </div>
  );
}

function Frame20() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
      <Frame32 />
      <Frame28 />
      <Frame31 />
    </div>
  );
}

function Frame7() {
  return <div className="content-stretch flex gap-[16px] items-start shrink-0" />;
}

function Frame22() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[16px] items-start left-[151.5px] top-[41.72px]">
      <Frame7 />
    </div>
  );
}

function Frame15() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full">
      <Frame20 />
      <Frame22 />
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-[804px]">
      <Frame24 />
      <Frame5 />
      <div className="h-0 relative shrink-0 w-[801.5px]">
        <div className="absolute bottom-[-0.5px] left-0 right-0 top-[-0.5px]" style={{ "--stroke-0": "rgba(226, 226, 234, 1)" } as React.CSSProperties}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 802 1">
            <path d="M0 0.5H801.5" id="Vector 102" stroke="var(--stroke-0, #E2E2EA)" />
          </svg>
        </div>
      </div>
      <Frame15 />
    </div>
  );
}

function Frame13() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
      <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#7e8ca9] text-[13px] text-nowrap whitespace-pre">annuler</p>
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex gap-[19px] items-center relative shrink-0">
      <Frame13 />
    </div>
  );
}

function Frame11() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[16px] h-[40px] items-start px-[16px] py-[10px] relative rounded-[10px] shrink-0">
      <div aria-hidden="true" className="absolute border border-[#6a90ba] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <Frame8 />
    </div>
  );
}

function Frame14() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
      <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">appliquer au document</p>
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex gap-[19px] items-center relative shrink-0">
      <Frame14 />
    </div>
  );
}

function Frame9() {
  return (
    <div className="bg-[#007aff] box-border content-stretch flex flex-col gap-[16px] h-[40px] items-start px-[16px] py-[10px] relative rounded-[10px] shrink-0">
      <Frame10 />
    </div>
  );
}

function Frame12() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
      <Frame11 />
      <Frame9 />
    </div>
  );
}

function Frame23() {
  return (
    <div className="content-stretch flex gap-[37px] h-[40px] items-start justify-end relative shrink-0 w-[804px]">
      <Frame12 />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-col gap-[37px] items-center justify-center relative shrink-0 w-full">
      <Frame4 />
      <Frame23 />
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

function Frame3() {
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

export default function Frame2() {
  return (
    <div className="bg-white relative rounded-[18px] size-full">
      <div aria-hidden="true" className="absolute border border-[#dbd9d9] border-solid inset-0 pointer-events-none rounded-[18px] shadow-[0px_0px_75.3px_0px_rgba(25,41,74,0.24)]" />
      <div className="flex flex-col justify-end size-full">
        <div className="box-border content-stretch flex flex-col gap-[28px] items-start justify-end pb-[20px] pt-[59px] px-[20px] relative size-full">
          <Frame1 />
          <Frame3 />
        </div>
      </div>
    </div>
  );
}