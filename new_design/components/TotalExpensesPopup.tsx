import svgPaths from "../imports/svg-ckda92rqwk";

interface TotalExpensesPopupProps {
  onClose: () => void;
}

function Frame() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">Visualiser mes dépense</p>
    </div>
  );
}

function Group() {
  return (
    <div className="h-[9.34px] relative shrink-0 w-[12.514px]">
      <div className="absolute inset-[-7.14%_-5.33%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 11">
          <g id="Group 1000003289">
            <path d={svgPaths.p5ac6080} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33429" />
            <path d={svgPaths.p6391aa0} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33429" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function ChartButton() {
  return (
    <div className="bg-[#8c2ffe] box-border content-stretch flex gap-[5.049px] h-[24.63px] items-center justify-center overflow-clip p-[6.059px] relative rounded-[93.53px] shrink-0" data-name="chart-button">
      <Group />
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0">
      <div className="flex flex-col font-['Poppins:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#8c2ffe] text-[18.177px] text-nowrap">
        <p className="leading-[normal] whitespace-pre">1880.93 €</p>
      </div>
      <ChartButton />
    </div>
  );
}

function CardHeader() {
  return (
    <div className="relative shrink-0 w-full" data-name="card-header">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center justify-between p-[12.623px] relative w-full">
          <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[11.783px] text-nowrap whitespace-pre">dépenses total</p>
          <Frame5 />
        </div>
      </div>
    </div>
  );
}

function Card() {
  return (
    <div className="bg-white relative rounded-[20px] shrink-0 w-full" data-name="card">
      <div className="content-stretch flex flex-col gap-[5.049px] items-start overflow-clip relative rounded-[inherit] w-full">
        <CardHeader />
      </div>
      <div aria-hidden="true" className="absolute border border-[#e2e2ea] border-solid inset-0 pointer-events-none rounded-[20px]" />
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex flex-col font-['Poppins:Medium',sans-serif] gap-[5px] items-start not-italic relative shrink-0 text-nowrap w-[119.691px]">
      <p className="capitalize leading-[normal] relative shrink-0 text-[#92929d] text-[11.783px] whitespace-pre">{`dépenses RH `}</p>
      <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#8c2ffe] text-[18.177px]">
        <p className="leading-[normal] text-nowrap whitespace-pre">890.93 €</p>
      </div>
    </div>
  );
}

function Frame7() {
  return (
    <div className="content-stretch flex flex-col font-['Poppins:Medium',sans-serif] gap-[5px] items-start not-italic relative shrink-0 text-nowrap w-[119.691px]">
      <p className="capitalize leading-[normal] relative shrink-0 text-[#92929d] text-[11.783px] whitespace-pre">{`dépenses HM `}</p>
      <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#26c9b6] text-[18.177px]">
        <p className="leading-[normal] text-nowrap whitespace-pre">890.93 €</p>
      </div>
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <div className="bg-[#26c9b6] rounded-[3px] shrink-0 size-[12px]" />
      <p className="capitalize font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[8px] text-nowrap whitespace-pre">dépenses RH</p>
    </div>
  );
}

function Frame12() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <div className="bg-[#8c2ffe] rounded-[3px] shrink-0 size-[12px]" />
      <p className="capitalize font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[8px] text-nowrap whitespace-pre">dépenses HM</p>
    </div>
  );
}

function Frame13() {
  return (
    <div className="content-stretch flex gap-[5px] items-center justify-end relative shrink-0">
      <Frame11 />
      <Frame12 />
    </div>
  );
}

function Frame14() {
  return (
    <div className="box-border content-stretch flex items-end justify-between pb-0 pt-[15px] px-0 relative shrink-0 w-full">
      <Frame6 />
      <Frame7 />
      <Frame13 />
    </div>
  );
}

function CardHeader1() {
  return (
    <div className="relative shrink-0 w-full" data-name="card-header">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[1.01px] items-start px-[14px] py-[12.623px] relative w-full">
          <p className="font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[11.783px] text-nowrap whitespace-pre">Resumees des dépenses</p>
          <Frame14 />
        </div>
      </div>
    </div>
  );
}

function Months() {
  return (
    <div className="box-border content-stretch flex flex-col font-['DM_Sans:Medium',sans-serif] font-medium gap-[3px] h-full items-start justify-center leading-[10.099px] pl-0 pr-[11px] py-[3px] relative shrink-0 text-[6.059px] text-center tracking-[-0.1212px]" data-name="Months">
      <p className="h-[11.076px] relative shrink-0 text-[#6a90ba] w-[20.149px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        1100
      </p>
      <p className="h-[11.076px] relative shrink-0 text-[#6a90ba] w-[20.149px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        900
      </p>
      <p className="h-[11.076px] relative shrink-0 text-[#6a90ba] w-[20.149px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        700
      </p>
      <p className="h-[11.076px] relative shrink-0 text-[#6a90ba] w-[20.149px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        500
      </p>
      <p className="h-[11.076px] relative shrink-0 text-[#6a90ba] w-[20.149px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        300
      </p>
      <p className="h-[11.076px] relative shrink-0 text-[#6a90ba] w-[20.149px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        100
      </p>
      <p className="h-[11.076px] relative shrink-0 text-white w-[20.149px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        Jul
      </p>
      <p className="h-[11.076px] relative shrink-0 text-[#6a90ba] w-[20.149px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        100
      </p>
      <p className="h-[11.076px] relative shrink-0 text-[#6a90ba] w-[20.149px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        300
      </p>
      <p className="h-[11.076px] relative shrink-0 text-[#6a90ba] w-[20.149px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        500
      </p>
      <p className="h-[11.076px] relative shrink-0 text-[#6a90ba] w-[20.149px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        700
      </p>
      <p className="h-[11.076px] relative shrink-0 text-[#6a90ba] w-[20.149px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        900
      </p>
      <p className="h-[11.076px] relative shrink-0 text-[#6a90ba] w-[20.149px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        1100
      </p>
    </div>
  );
}

function Chart() {
  return (
    <div className="content-stretch flex h-[81.294px] items-end justify-between relative shrink-0 w-[352px]" data-name="Chart">
      <div className="bg-[#eee0ff] h-[29.286px] rounded-[4.039px] shrink-0 w-[19.728px]" />
      <div className="bg-[#eee0ff] h-[61px] rounded-[4.039px] shrink-0 w-[19px]" />
      <div className="bg-[#eee0ff] h-[49.483px] rounded-[4.039px] shrink-0 w-[19.728px]" />
      <div className="bg-[#eee0ff] h-[56.552px] rounded-[4.039px] shrink-0 w-[19.728px]" />
      <div className="bg-[#eee0ff] h-[45.444px] rounded-[4.039px] shrink-0 w-[19.728px]" />
      <div className="bg-[#8c2ffe] h-[81.294px] rounded-[4.039px] shrink-0 w-[19.728px]" />
      <div className="bg-[#f6f6f6] h-[5px] rounded-[4.039px] shrink-0 w-[20px]" />
      <div className="bg-[#f6f6f6] h-[5px] rounded-[4.039px] shrink-0 w-[20px]" />
      <div className="bg-[#f6f6f6] h-[5px] rounded-[4.039px] shrink-0 w-[20px]" />
      <div className="bg-[#f6f6f6] h-[5px] rounded-[4.039px] shrink-0 w-[20px]" />
      <div className="bg-[#f6f6f6] h-[5px] rounded-[4.039px] shrink-0 w-[20px]" />
      <div className="bg-[#f6f6f6] h-[5px] rounded-[4.039px] shrink-0 w-[20px]" />
    </div>
  );
}

function Months1() {
  return (
    <div className="box-border content-stretch flex font-['DM_Sans:Medium',sans-serif] font-medium h-[17.076px] items-end justify-between leading-[10.099px] px-0 py-[3px] relative shrink-0 text-[#6a90ba] text-[6.059px] text-center tracking-[-0.1212px] w-[352px]" data-name="Months">
      <p className="h-[11.076px] relative shrink-0 w-[20.149px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        Jan
      </p>
      <p className="h-[11.076px] relative shrink-0 w-[20.149px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        Feb
      </p>
      <p className="h-[11.076px] relative shrink-0 w-[20.149px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        Mar
      </p>
      <p className="h-[11.076px] relative shrink-0 w-[20.149px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        Apr
      </p>
      <p className="h-[11.076px] relative shrink-0 w-[20.149px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        May
      </p>
      <p className="h-[11.076px] relative shrink-0 w-[20.149px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        Jun
      </p>
      <p className="h-[11.076px] relative shrink-0 w-[20.149px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        Jul
      </p>
      <p className="h-[11.076px] relative shrink-0 w-[20.149px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        Aug
      </p>
      <p className="h-[11.076px] relative shrink-0 w-[20.149px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        Sep
      </p>
      <p className="h-[11.076px] relative shrink-0 w-[20.149px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        Oct
      </p>
      <p className="h-[11.076px] relative shrink-0 w-[20.149px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        Nov
      </p>
      <p className="h-[11.076px] relative shrink-0 w-[20.149px]" style={{ fontVariationSettings: "'opsz' 14" }}>
        Dec
      </p>
    </div>
  );
}

function Chart1() {
  return (
    <div className="content-stretch flex h-[81.294px] items-end justify-between relative w-[352px]" data-name="Chart">
      <div className="bg-[rgba(38,201,182,0.25)] h-[29.286px] rounded-[4.039px] shrink-0 w-[19.728px]" />
      <div className="bg-[rgba(38,201,182,0.25)] h-[61px] rounded-[4.039px] shrink-0 w-[19px]" />
      <div className="bg-[rgba(38,201,182,0.25)] h-[49.483px] rounded-[4.039px] shrink-0 w-[19.728px]" />
      <div className="bg-[rgba(38,201,182,0.25)] h-[56.552px] rounded-[4.039px] shrink-0 w-[19.728px]" />
      <div className="bg-[rgba(38,201,182,0.25)] h-[45.444px] rounded-[4.039px] shrink-0 w-[19.728px]" />
      <div className="bg-[#26c9b6] h-[29px] rounded-[4.039px] shrink-0 w-[20px]" />
      <div className="bg-[#f6f6f6] h-[5px] rounded-[4.039px] shrink-0 w-[20px]" />
      <div className="bg-[#f6f6f6] h-[5px] rounded-[4.039px] shrink-0 w-[20px]" />
      <div className="bg-[#f6f6f6] h-[5px] rounded-[4.039px] shrink-0 w-[20px]" />
      <div className="bg-[#f6f6f6] h-[5px] rounded-[4.039px] shrink-0 w-[20px]" />
      <div className="bg-[#f6f6f6] h-[5px] rounded-[4.039px] shrink-0 w-[20px]" />
      <div className="bg-[#f6f6f6] h-[5px] rounded-[4.039px] shrink-0 w-[20px]" />
    </div>
  );
}

function Frame15() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0">
      <Chart />
      <Months1 />
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none scale-y-[-100%]">
          <Chart1 />
        </div>
      </div>
    </div>
  );
}

function ChartGraphic() {
  return (
    <div className="box-border content-stretch flex items-center p-[12px] relative rounded-[7px] shrink-0" data-name="chart-graphic">
      <div aria-hidden="true" className="absolute border border-[#e2e2ea] border-solid inset-0 pointer-events-none rounded-[7px]" />
      <div className="flex flex-row items-center self-stretch">
        <Months />
      </div>
      <Frame15 />
    </div>
  );
}

function Card1() {
  return (
    <div className="relative rounded-[11px] shrink-0" data-name="card">
      <div className="box-border content-stretch flex flex-col gap-[5.049px] items-start overflow-clip pb-[15px] pt-0 px-[15px] relative rounded-[inherit]">
        <CardHeader1 />
        <ChartGraphic />
      </div>
      <div aria-hidden="true" className="absolute border border-[#e2e2ea] border-solid inset-0 pointer-events-none rounded-[11px]" />
    </div>
  );
}

function Frame16() {
  return (
    <div className="content-stretch flex flex-col font-['Poppins:Medium',sans-serif] gap-[5px] items-start not-italic relative shrink-0 text-nowrap w-[119.691px]">
      <p className="capitalize leading-[normal] relative shrink-0 text-[#92929d] text-[11.783px] whitespace-pre">{`dépenses RH `}</p>
      <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#8c2ffe] text-[18.177px]">
        <p className="leading-[normal] text-nowrap whitespace-pre">890.93 €</p>
      </div>
    </div>
  );
}

function Frame17() {
  return (
    <div className="content-stretch flex flex-col font-['Poppins:Medium',sans-serif] gap-[5px] items-start not-italic relative shrink-0 text-nowrap w-[119.691px]">
      <p className="capitalize leading-[normal] relative shrink-0 text-[#92929d] text-[11.783px] whitespace-pre">{`dépenses HM `}</p>
      <div className="flex flex-col justify-center leading-[0] relative shrink-0 text-[#26c9b6] text-[18.177px]">
        <p className="leading-[normal] text-nowrap whitespace-pre">890.93 €</p>
      </div>
    </div>
  );
}

function Frame18() {
  return (
    <div className="box-border content-stretch flex items-end pb-0 pt-[15px] px-0 relative shrink-0 w-full">
      <Frame16 />
      <Frame17 />
    </div>
  );
}

function CardHeader2() {
  return (
    <div className="relative shrink-0 w-full" data-name="card-header">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[1.01px] items-start px-[14px] py-[12.623px] relative w-full">
          <p className="font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[11.783px] text-nowrap whitespace-pre">{`Detailes des dépenses `}</p>
          <Frame18 />
        </div>
      </div>
    </div>
  );
}

function ChartGraphic1() {
  return (
    <div className="bg-[#26c9b6] box-border content-stretch flex h-[28px] items-center p-[12px] relative rounded-[7px] shrink-0" data-name="chart-graphic">
      <p className="font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[11.783px] text-nowrap text-white whitespace-pre">350.93 €</p>
    </div>
  );
}

function Frame9() {
  return (
    <div className="bg-white content-stretch flex gap-[10px] h-[28px] items-center relative shrink-0 w-full">
      <ChartGraphic1 />
      <p className="font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[11.783px] text-nowrap whitespace-pre">Software</p>
    </div>
  );
}

function Frame19() {
  return (
    <div className="relative rounded-[7px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-[#e2e2ea] border-solid inset-0 pointer-events-none rounded-[7px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[7px] items-start p-[8px] relative w-full">
          <Frame9 />
        </div>
      </div>
    </div>
  );
}

function ChartGraphic2() {
  return (
    <div className="bg-[#26c9b6] box-border content-stretch flex h-[28px] items-center p-[12px] relative rounded-[7px] shrink-0" data-name="chart-graphic">
      <p className="font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[11.783px] text-nowrap text-white whitespace-pre">350.93 €</p>
    </div>
  );
}

function Frame20() {
  return (
    <div className="bg-white content-stretch flex gap-[10px] h-[28px] items-center relative shrink-0 w-full">
      <ChartGraphic2 />
      <p className="font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[11.783px] text-nowrap whitespace-pre">Hardware</p>
    </div>
  );
}

function Frame8() {
  return (
    <div className="relative rounded-[7px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-[#e2e2ea] border-solid inset-0 pointer-events-none rounded-[7px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[7px] items-start p-[8px] relative w-full">
          <Frame20 />
        </div>
      </div>
    </div>
  );
}

function ChartGraphic3() {
  return (
    <div className="bg-[#8c2ffe] box-border content-stretch flex h-[28px] items-center p-[12px] relative rounded-[7px] shrink-0" data-name="chart-graphic">
      <p className="font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[11.783px] text-nowrap text-white whitespace-pre">320.93 €</p>
    </div>
  );
}

function Frame21() {
  return (
    <div className="bg-white content-stretch flex gap-[10px] h-[28px] items-center relative shrink-0 w-full">
      <ChartGraphic3 />
      <p className="font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[11.783px] text-nowrap whitespace-pre">Prestations</p>
    </div>
  );
}

function Frame10() {
  return (
    <div className="relative rounded-[7px] shrink-0 w-full">
      <div aria-hidden="true" className="absolute border border-[#e2e2ea] border-solid inset-0 pointer-events-none rounded-[7px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[7px] items-start p-[8px] relative w-full">
          <Frame21 />
        </div>
      </div>
    </div>
  );
}

function Card2() {
  return (
    <div className="relative rounded-[11px] self-stretch shrink-0 w-[368.691px]" data-name="card">
      <div className="box-border content-stretch flex flex-col gap-[5.049px] h-full items-start overflow-clip pb-[15px] pt-0 px-[15px] relative rounded-[inherit] w-[368.691px]">
        <CardHeader2 />
        <Frame19 />
        <Frame8 />
        <Frame10 />
      </div>
      <div aria-hidden="true" className="absolute border border-[#e2e2ea] border-solid inset-0 pointer-events-none rounded-[11px]" />
    </div>
  );
}

function Frame22() {
  return (
    <div className="content-stretch flex gap-[24px] items-start relative shrink-0">
      <Card1 />
      <Card2 />
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start justify-center relative shrink-0 w-full">
      <Frame />
      <Card />
      <Frame22 />
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0">
      <Frame4 />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-col gap-[37px] items-center justify-center relative shrink-0 w-full">
      <Frame3 />
    </div>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute right-[34px] size-[30.667px] top-[33px] hover:bg-[#dce7f0] transition-colors rounded-full flex items-center justify-center"
      aria-label="Close popup"
    >
      <div className="size-full" style={{ "--fill-0": "rgba(232, 240, 247, 1)" } as React.CSSProperties}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 31 31">
          <g id="Frame 19">
            <rect fill="var(--fill-0, #E8F0F7)" height="30.6667" rx="15.3333" width="30.6667" />
            <path d={svgPaths.p1e50a100} id="Vector" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeWidth="2" />
          </g>
        </svg>
      </div>
    </button>
  );
}

export default function TotalExpensesPopup({ onClose }: TotalExpensesPopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white relative rounded-[18px] max-w-[900px] w-full max-h-[90vh] overflow-auto">
        <div aria-hidden="true" className="absolute border border-[#dbd9d9] border-solid inset-0 pointer-events-none rounded-[18px] shadow-[0px_0px_75.3px_0px_rgba(25,41,74,0.24)]" />
        <div className="flex flex-col justify-end size-full">
          <div className="box-border content-stretch flex flex-col gap-[28px] items-start justify-end px-[34px] py-[59px] relative size-full">
            <Frame1 />
            <CloseButton onClick={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
}
