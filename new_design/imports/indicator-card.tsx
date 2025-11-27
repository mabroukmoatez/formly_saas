function Frame() {
    return (
        <div className="content-stretch flex gap-[6.984px] items-center justify-center relative rounded-[55.87px] shrink-0 size-[48.188px]">
            <div aria-hidden="true" className="absolute border-[#e8f0f7] border-[3.492px] border-solid inset-0 pointer-events-none rounded-[55.87px]" />
            <p className="capitalize font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[12.391px] text-black text-center text-nowrap whitespace-pre">2</p>
        </div>
    );
}

function Frame5() {
    return (
        <div className="content-stretch flex gap-[12px] items-center relative shrink-0">
            <Frame />
            <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] w-[267px]">Diffusion d'indicateurs de résultats</p>
        </div>
    );
}

function Frame1() {
    return (
        <div className="content-stretch flex flex-col gap-[10px] items-start justify-center relative shrink-0">
            <Frame5 />
        </div>
    );
}

function Frame3() {
    return (
        <div className="basis-0 bg-white grow min-h-px min-w-px relative rounded-[7.991px] shrink-0">
            <div aria-hidden="true" className="absolute border-[#e2e2ea] border-[1.229px] border-solid inset-0 pointer-events-none rounded-[7.991px]" />
            <div className="flex flex-col items-center justify-center size-full">
                <div className="box-border content-stretch flex flex-col font-['Poppins:Regular',sans-serif] gap-[3px] items-center justify-center leading-[normal] not-italic px-[14.752px] py-[9px] relative text-[#6a90ba] text-nowrap w-full whitespace-pre">
                    <p className="relative shrink-0 text-[14.752px]">0</p>
                    <p className="relative shrink-0 text-[10.449px]">Procédures</p>
                </div>
            </div>
        </div>
    );
}

function Frame7() {
    return (
        <div className="basis-0 bg-white grow min-h-px min-w-px relative rounded-[7.991px] shrink-0">
            <div aria-hidden="true" className="absolute border-[#e2e2ea] border-[1.229px] border-solid inset-0 pointer-events-none rounded-[7.991px]" />
            <div className="flex flex-col items-center justify-center size-full">
                <div className="box-border content-stretch flex flex-col font-['Poppins:Regular',sans-serif] gap-[3px] items-center justify-center leading-[normal] not-italic px-[14.752px] py-[9px] relative text-[#6a90ba] text-nowrap w-full whitespace-pre">
                    <p className="relative shrink-0 text-[14.752px]">0</p>
                    <p className="relative shrink-0 text-[10.449px]">Modèles</p>
                </div>
            </div>
        </div>
    );
}

function Frame6() {
    return (
        <div className="basis-0 bg-white grow min-h-px min-w-px relative rounded-[7.991px] shrink-0">
            <div aria-hidden="true" className="absolute border-[#e2e2ea] border-[1.229px] border-solid inset-0 pointer-events-none rounded-[7.991px]" />
            <div className="flex flex-col items-center justify-center size-full">
                <div className="box-border content-stretch flex flex-col font-['Poppins:Regular',sans-serif] gap-[3px] items-center justify-center leading-[normal] not-italic px-[14.752px] py-[9px] relative text-[#6a90ba] text-nowrap w-full whitespace-pre">
                    <p className="relative shrink-0 text-[14.752px]">0</p>
                    <p className="relative shrink-0 text-[10.449px]">Preuves</p>
                </div>
            </div>
        </div>
    );
}

function Frame4() {
    return (
        <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
            <Frame3 />
            <Frame7 />
            <Frame6 />
        </div>
    );
}

export default function Frame2() {
    return (
        <div className="bg-white relative rounded-[18px] size-full">
            <div aria-hidden="true" className="absolute border-2 border-[#e2e2ea] border-solid inset-0 pointer-events-none rounded-[18px]" />
            <div className="size-full">
                <div className="box-border content-stretch flex flex-col gap-[14px] items-start p-[24px] relative size-full">
                    <Frame1 />
                    <Frame4 />
                </div>
            </div>
        </div>
    );
}
