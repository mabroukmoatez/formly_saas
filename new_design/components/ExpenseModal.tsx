import { useState, useEffect } from 'react';
import svgPaths from "../imports/svg-ai4nfp2m4r";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function Frame() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">Ajouter une Dépense</p>
    </div>
  );
}

function Frame15() {
  return (
    <div className="bg-[#e8f0f7] box-border content-stretch flex gap-[4px] items-start justify-center px-[9px] py-[4px] relative rounded-[10px] shrink-0">
      <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[11.783px] text-nowrap whitespace-pre">Moyens Humains</p>
    </div>
  );
}

function Frame21() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[24px] not-italic relative shrink-0 text-[#6a90ba] text-[16px] text-nowrap whitespace-pre">{`Catégorie: `}</p>
      <Frame15 />
    </div>
  );
}

function Content() {
  return (
    <div className="basis-0 content-stretch flex grow h-full items-center justify-between min-h-px min-w-px relative shrink-0" data-name="Content">
      <Frame21 />
      <div className="h-[5px] relative shrink-0 w-[10px]" data-name="Icon">
        <div className="absolute inset-[-16.67%_-8.33%]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 7">
            <path d={svgPaths.p1b1fa300} id="Icon" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
          </svg>
        </div>
      </div>
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
    <div className="basis-0 content-stretch flex gap-[14px] grow h-full items-center min-h-px min-w-px not-italic relative shrink-0 text-nowrap whitespace-pre" data-name="Content">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[24px] relative shrink-0 text-[#6a90ba] text-[16px]">Libellé:</p>
      <p className="font-['Poppins:Regular',sans-serif] leading-[0px] relative shrink-0 text-[#19294a] text-[13px]">Paiement Formateur</p>
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

function Frame17() {
  return (
    <div className="content-start flex flex-wrap gap-[16px] items-start relative shrink-0 w-full">
      <Input />
      <Input1 />
    </div>
  );
}

function ChevronDown() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="chevron-down">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="chevron-down">
          <path d="M5 7.5L10 12.5L15 7.5" id="Icon" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function TextInput() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Text input">
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[14px]">Poste / Rôle:</p>
      <ChevronDown />
    </div>
  );
}

function Content2() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Content">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <TextInput />
        </div>
      </div>
    </div>
  );
}

function Input2() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="content-stretch flex items-start overflow-clip relative rounded-[inherit] w-full">
        <Content2 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#ff7700] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
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

function ChevronDown1() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="chevron-down">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="chevron-down">
          <path d="M5 7.5L10 12.5L15 7.5" id="Icon" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function TextInput1() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Text input">
      <p className="basis-0 capitalize font-['Poppins:Medium',sans-serif] grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[#698eac] text-[13px]">Type de contrat:</p>
      <ChevronDown1 />
    </div>
  );
}

function Content3() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Content">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[14px] py-[10px] relative w-full">
          <TextInput1 />
        </div>
      </div>
    </div>
  );
}

function Input3() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="content-stretch flex items-start overflow-clip relative rounded-[inherit] w-full">
        <Content3 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#ff7700] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
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
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="_Input field base">
      <InputWithLabel1 />
    </div>
  );
}

function InputWithLabel2() {
  return (
    <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Input with label">
      <InputFieldBase1 />
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

function Frame19() {
  return (
    <div className="content-start flex flex-wrap gap-[16px] items-start relative shrink-0 w-full">
      <InputFieldBase />
      <InputFieldBase2 />
    </div>
  );
}

function TextInput2() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Text input">
      <p className="basis-0 font-['Inter:Regular',sans-serif] font-normal grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba] text-[16px]">Formation liée</p>
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

function Content4() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Content">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center pl-[14px] pr-0 py-[10px] relative w-full">
          <TextInput2 />
          <HelpIcon />
        </div>
      </div>
    </div>
  );
}

function ChevronDown2() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="chevron-down">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="chevron-down">
          <path d="M5 7.5L10 12.5L15 7.5" id="Icon" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function Dropdown() {
  return (
    <div className="box-border content-stretch flex items-center justify-between overflow-clip px-[14px] py-[10px] relative self-stretch shrink-0" data-name="Dropdown">
      <ChevronDown2 />
    </div>
  );
}

function Input4() {
  return (
    <div className="basis-0 bg-white grow min-h-px min-w-px relative rounded-[8px] shrink-0" data-name="Input">
      <div className="content-stretch flex items-start overflow-clip relative rounded-[inherit] w-full">
        <Content4 />
        <Dropdown />
      </div>
      <div aria-hidden="true" className="absolute border border-[#d5d7da] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}

function TextInput3() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-start leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[#6a90ba]" data-name="Text input">
      <p className="font-['Inter:Regular',sans-serif] font-normal relative shrink-0 text-[16px] text-nowrap whitespace-pre">{`€ `}</p>
      <p className="basis-0 font-['Poppins:Regular',sans-serif] grow min-h-px min-w-px relative shrink-0 text-[14px]">Montant</p>
    </div>
  );
}

function Content5() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Content">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center pl-[14px] pr-0 py-[10px] relative w-full">
          <TextInput3 />
        </div>
      </div>
    </div>
  );
}

function Input5() {
  return (
    <div className="bg-white relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="content-stretch flex items-start overflow-clip relative rounded-[inherit] w-full">
        <Content5 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#d5d7da] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
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

function Frame18() {
  return (
    <div className="content-start flex flex-wrap gap-[16px] items-start relative shrink-0 w-full">
      <Input4 />
      <InputFieldBase3 />
    </div>
  );
}

function Component2Variant() {
  return (
    <div className="relative shrink-0 size-[17.088px]" data-name="Component 2/Variant33">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Component 2/Variant33">
          <g id="Vector">
            <path clipRule="evenodd" d={svgPaths.p3d90a880} fill="var(--fill-0, #3F82EF)" fillRule="evenodd" />
            <path clipRule="evenodd" d={svgPaths.p2fbae80} fill="var(--fill-0, #3F82EF)" fillRule="evenodd" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Group() {
  return (
    <div className="relative shrink-0 size-[9.648px]">
      <div className="absolute inset-[-5%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
          <g id="Group 1000003441">
            <path d={svgPaths.p2e41ce80} id="Vector" stroke="var(--stroke-0, #19294A)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.27" strokeWidth="0.964844" />
            <path d={svgPaths.p2021c300} id="Vector_2" stroke="var(--stroke-0, #19294A)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.27" strokeWidth="0.964844" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Frame6() {
  return (
    <div className="bg-[#e5f3ff] box-border content-stretch flex gap-[3.56px] items-center justify-center px-[7.832px] py-[1.424px] relative rounded-[14.24px] shrink-0">
      <Component2Variant />
      <div className="flex flex-col font-['Urbanist:Medium',sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#6a90ba] text-[10.68px] text-center text-nowrap">
        <p className="leading-[normal] whitespace-pre">facture.pdf</p>
      </div>
      <Group />
    </div>
  );
}

function Frame23() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[24px] not-italic relative shrink-0 text-[#6a90ba] text-[16px] text-nowrap whitespace-pre">Pièce jointe:</p>
      {[...Array(3).keys()].map((_, i) => (
        <Frame6 key={i} />
      ))}
    </div>
  );
}

function Frame22() {
  return (
    <div className="relative shrink-0 size-[24px]">
      <div className="absolute inset-0" style={{ "--fill-0": "rgba(235, 241, 255, 1)" } as React.CSSProperties}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
          <g id="Frame 1000003633">
            <rect fill="var(--fill-0, #EBF1FF)" height="24" rx="12" width="24" />
            <path d={svgPaths.p2fd36f10} id="Vector" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.947368" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Content6() {
  return (
    <div className="basis-0 content-stretch flex grow h-full items-center justify-between min-h-px min-w-px relative shrink-0" data-name="Content">
      <Frame23 />
      <Frame22 />
    </div>
  );
}

function Input6() {
  return (
    <div className="bg-white h-[44px] relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[8px] h-[44px] items-center px-[14px] py-[10px] relative w-full">
          <Content6 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#ebf1ff] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}

function Frame14() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
      <Frame />
      <Frame17 />
      <Frame19 />
      <Frame18 />
      <Input6 />
    </div>
  );
}

function Frame5() {
  return <div className="content-stretch flex gap-[16px] items-start shrink-0" />;
}

function Frame16() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[16px] items-start left-[151.5px] top-[41.72px]">
      <Frame5 />
    </div>
  );
}

interface Frame12Props {
  onClick: () => void;
}

function Frame12({ onClick }: Frame12Props) {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0 cursor-pointer" onClick={onClick}>
      <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#7e8ca9] text-[13px] text-nowrap whitespace-pre">annuler</p>
    </div>
  );
}

interface Frame7Props {
  onClick: () => void;
}

function Frame7({ onClick }: Frame7Props) {
  return (
    <div className="content-stretch flex gap-[19px] items-center relative shrink-0">
      <Frame12 onClick={onClick} />
    </div>
  );
}

interface Frame10Props {
  onClick: () => void;
}

function Frame10({ onClick }: Frame10Props) {
  return (
    <div className="box-border content-stretch flex flex-col gap-[16px] h-[40px] items-start px-[16px] py-[10px] relative rounded-[10px] shrink-0 cursor-pointer hover:bg-[#f5f7fa] transition-colors" onClick={onClick}>
      <div aria-hidden="true" className="absolute border border-[#6a90ba] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <Frame7 onClick={onClick} />
    </div>
  );
}

function Frame13() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
      <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">Ajouter une Dépense</p>
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

function Frame9() {
  return (
    <div className="bg-[#007aff] box-border content-stretch flex flex-col gap-[16px] h-[40px] items-start px-[16px] py-[10px] relative rounded-[10px] shrink-0 cursor-pointer hover:bg-[#0066dd] transition-colors">
      <Frame8 />
    </div>
  );
}

interface Frame11Props {
  onCancel: () => void;
}

function Frame11({ onCancel }: Frame11Props) {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-end relative shrink-0 w-full">
      <Frame10 onClick={onCancel} />
      <Frame9 />
    </div>
  );
}

interface Frame4Props {
  onCancel: () => void;
}

function Frame4({ onCancel }: Frame4Props) {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full">
      <Frame14 />
      <Frame16 />
      <Frame11 onCancel={onCancel} />
    </div>
  );
}

interface Frame3Props {
  onCancel: () => void;
}

function Frame3({ onCancel }: Frame3Props) {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-[804px]">
      <Frame4 onCancel={onCancel} />
    </div>
  );
}

interface Frame1Props {
  onCancel: () => void;
}

function Frame1({ onCancel }: Frame1Props) {
  return (
    <div className="content-stretch flex flex-col gap-[37px] items-center justify-center relative shrink-0 w-full">
      <Frame3 onCancel={onCancel} />
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

interface Frame2Props {
  onClick: () => void;
}

function Frame2({ onClick }: Frame2Props) {
  return (
    <div className="absolute left-[893px] size-[30.667px] top-[12.5px] cursor-pointer hover:opacity-80 transition-opacity" onClick={onClick}>
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

export default function ExpenseModal({ isOpen, onClose }: ExpenseModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
    >
      <div 
        className={`max-w-[950px] w-full max-h-[90vh] transition-all duration-200 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="bg-white relative rounded-[18px] w-full">
          <div aria-hidden="true" className="absolute border border-[#dbd9d9] border-solid inset-0 pointer-events-none rounded-[18px] shadow-[0px_0px_75.3px_0px_rgba(25,41,74,0.24)]" />
          <div className="flex flex-col justify-end w-full">
            <div className="box-border content-stretch flex flex-col gap-[28px] items-start justify-end px-[20px] py-[59px] relative w-full">
              <Frame1 onCancel={handleClose} />
              <Frame2 onClick={handleClose} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
