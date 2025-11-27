import svgPaths from "./svg-5b8lpbneml";

function Frame44({ className }: { className?: string }) {
    return (
        <div className={className}>
            <p className="capitalize font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[10.643px] text-center text-nowrap text-white whitespace-pre">1</p>
        </div>
    );
}

function Frame1() {
    return (
        <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
            <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">Définir les indicateurs qui vous concernent</p>
        </div>
    );
}

function Frame2() {
    return (
        <div className="content-stretch flex flex-col gap-[8px] items-start justify-center leading-[normal] not-italic relative shrink-0 w-full">
            <p className="font-['Poppins:Medium',sans-serif] relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">Categorie d’action de formation</p>
            <p className="font-['Poppins:Regular',sans-serif] min-w-full relative shrink-0 text-[#6a90ba] text-[11px] w-[min-content] whitespace-pre-wrap">{`Choisissez la catégorie d’actions de formation qui vous concerne (Une ou plusieurs)  : `}</p>
        </div>
    );
}

function Check() {
    return (
        <div className="absolute inset-[12.5%]" data-name="check">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
                <g id="check">
                    <path d={svgPaths.p10e39300} id="Icon" stroke="var(--stroke-0, #007AFF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.56244" />
                </g>
            </svg>
        </div>
    );
}

function CheckboxBase() {
    return (
        <div className="bg-[#e5f3ff] relative rounded-[3.75px] shrink-0 size-[15px]" data-name="_Checkbox base">
            <div className="overflow-clip relative rounded-[inherit] size-[15px]">
                <Check />
            </div>
            <div aria-hidden="true" className="absolute border-[#007aff] border-[0.938px] border-solid inset-0 pointer-events-none rounded-[3.75px]" />
        </div>
    );
}

function Checkbox() {
    return (
        <div className="absolute content-stretch flex items-center justify-center left-[326px] top-[-8px]" data-name="Checkbox">
            <CheckboxBase />
        </div>
    );
}

function Frame4() {
    return (
        <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
            <p className="font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">Actions de formation</p>
            <Checkbox />
        </div>
    );
}

function Frame() {
    return (
        <div className="content-stretch flex gap-[7px] items-center relative shrink-0">
            <p className="font-['Poppins:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#5c677e] text-[11px] w-[317.704px]">Le système sélectionne aléatoirement un nombre défini de questions à partir de votre banque de questions.</p>
        </div>
    );
}

function Frame3() {
    return (
        <div className="content-stretch flex flex-col items-start justify-center relative shrink-0">
            <Frame4 />
            <Frame />
        </div>
    );
}

function Frame6() {
    return (
        <div className="bg-[#ebf1ff] relative rounded-[18px] shrink-0 w-full">
            <div aria-hidden="true" className="absolute border border-[#007aff] border-solid inset-0 pointer-events-none rounded-[18px]" />
            <div className="flex flex-row items-center size-full">
                <div className="box-border content-stretch flex gap-[16px] items-center pl-[7px] pr-[26px] py-[16px] relative w-full">
                    <Frame3 />
                </div>
            </div>
        </div>
    );
}

function Frame5() {
    return (
        <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
            <p className="basis-0 font-['Poppins:Medium',sans-serif] grow leading-[normal] min-h-px min-w-px not-italic relative shrink-0 text-[#19294a] text-[17px]">{`Validation des acquis de l'expérience - VAE`}</p>
        </div>
    );
}

function Frame7() {
    return (
        <div className="content-stretch flex gap-[7px] items-center relative shrink-0">
            <p className="font-['Poppins:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#5c677e] text-[11px] w-[317.704px]">Le système sélectionne aléatoirement un nombre défini de questions à partir de votre banque de questions.</p>
        </div>
    );
}

function Frame10() {
    return (
        <div className="basis-0 content-stretch flex flex-col grow items-start justify-center min-h-px min-w-px relative shrink-0">
            <Frame5 />
            <Frame7 />
        </div>
    );
}

function CheckboxBase1() {
    return (
        <div className="bg-white relative rounded-[3.75px] shrink-0 size-[15px]" data-name="_Checkbox base">
            <div aria-hidden="true" className="absolute border-[#6a90ba] border-[0.938px] border-solid inset-0 pointer-events-none rounded-[3.75px]" />
        </div>
    );
}

function Checkbox1() {
    return (
        <div className="absolute content-stretch flex items-center justify-center left-[333px] top-[8px]" data-name="Checkbox">
            <CheckboxBase1 />
        </div>
    );
}

function Frame23() {
    return (
        <div className="bg-neutral-50 relative rounded-[18px] shrink-0 w-full">
            <div aria-hidden="true" className="absolute border border-[#d3d3e8] border-solid inset-0 pointer-events-none rounded-[18px]" />
            <div className="flex flex-row items-center size-full">
                <div className="box-border content-stretch flex gap-[16px] items-center pl-[7px] pr-[26px] py-[16px] relative w-full">
                    <Frame10 />
                    <Checkbox1 />
                </div>
            </div>
        </div>
    );
}

function Frame8() {
    return (
        <div className="basis-0 content-stretch flex flex-col gap-[10px] grow items-start min-h-px min-w-px relative shrink-0">
            <Frame6 />
            <Frame23 />
        </div>
    );
}

function Frame11() {
    return (
        <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
            <p className="font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">Bilan de compétences</p>
        </div>
    );
}

function Frame14() {
    return (
        <div className="content-stretch flex gap-[7px] items-center relative shrink-0">
            <p className="font-['Poppins:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#5c677e] text-[11px] w-[317.704px]">Le système sélectionne aléatoirement un nombre défini de questions à partir de votre banque de questions.</p>
        </div>
    );
}

function Frame15() {
    return (
        <div className="content-stretch flex flex-col items-start justify-center relative shrink-0">
            <Frame11 />
            <Frame14 />
        </div>
    );
}

function CheckboxBase2() {
    return (
        <div className="bg-white relative rounded-[3.75px] shrink-0 size-[15px]" data-name="_Checkbox base">
            <div aria-hidden="true" className="absolute border-[#6a90ba] border-[0.938px] border-solid inset-0 pointer-events-none rounded-[3.75px]" />
        </div>
    );
}

function Checkbox2() {
    return (
        <div className="absolute content-stretch flex items-center justify-center left-[333px] top-[6px]" data-name="Checkbox">
            <CheckboxBase2 />
        </div>
    );
}

function Frame16() {
    return (
        <div className="bg-neutral-50 relative rounded-[18px] shrink-0 w-full">
            <div aria-hidden="true" className="absolute border border-[#d3d3e8] border-solid inset-0 pointer-events-none rounded-[18px]" />
            <div className="flex flex-row items-center size-full">
                <div className="box-border content-stretch flex gap-[16px] items-center pl-[11px] pr-0 py-[16px] relative w-full">
                    <Frame15 />
                    <Checkbox2 />
                </div>
            </div>
        </div>
    );
}

function Frame17() {
    return (
        <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
            <p className="font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">Centre de formation d’apprentis - CFA</p>
        </div>
    );
}

function Frame18() {
    return (
        <div className="content-stretch flex gap-[7px] items-center relative shrink-0">
            <p className="font-['Poppins:Regular',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#5c677e] text-[11px] w-[317.704px]">Le système sélectionne aléatoirement un nombre défini de questions à partir de votre banque de questions.</p>
        </div>
    );
}

function Frame19() {
    return (
        <div className="content-stretch flex flex-col items-start justify-center relative shrink-0">
            <Frame17 />
            <Frame18 />
        </div>
    );
}

function CheckboxBase3() {
    return (
        <div className="bg-white relative rounded-[3.75px] shrink-0 size-[15px]" data-name="_Checkbox base">
            <div aria-hidden="true" className="absolute border-[#6a90ba] border-[0.938px] border-solid inset-0 pointer-events-none rounded-[3.75px]" />
        </div>
    );
}

function Checkbox3() {
    return (
        <div className="absolute content-stretch flex items-center justify-center left-[333px] top-[7px]" data-name="Checkbox">
            <CheckboxBase3 />
        </div>
    );
}

function Frame24() {
    return (
        <div className="basis-0 bg-neutral-50 grow min-h-px min-w-px relative rounded-[18px] shrink-0 w-full">
            <div aria-hidden="true" className="absolute border border-[#d3d3e8] border-solid inset-0 pointer-events-none rounded-[18px]" />
            <div className="flex flex-row justify-center size-full">
                <div className="box-border content-stretch flex gap-[16px] items-start justify-center pl-[18px] pr-[24px] py-[16px] relative size-full">
                    <Frame19 />
                    <Checkbox3 />
                </div>
            </div>
        </div>
    );
}

function Frame9() {
    return (
        <div className="basis-0 content-stretch flex flex-col gap-[10px] grow items-start min-h-px min-w-px relative self-stretch shrink-0">
            <Frame16 />
            <Frame24 />
        </div>
    );
}

function Frame13() {
    return (
        <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-full">
            <Frame8 />
            <Frame9 />
        </div>
    );
}

function Frame20() {
    return (
        <div className="basis-0 content-stretch flex flex-col gap-[16px] grow items-start min-h-px min-w-px relative shrink-0">
            <Frame2 />
            <Frame13 />
        </div>
    );
}

function Frame12() {
    return (
        <div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
            <Frame20 />
        </div>
    );
}

function Frame26() {
    return (
        <div className="relative rounded-[18px] shrink-0 w-full">
            <div aria-hidden="true" className="absolute border border-[#dbd9d9] border-solid inset-0 pointer-events-none rounded-[18px]" />
            <div className="size-full">
                <div className="box-border content-stretch flex flex-col gap-[245px] items-start p-[18px] relative w-full">
                    <Frame12 />
                </div>
            </div>
        </div>
    );
}

function Frame36() {
    return (
        <div className="content-stretch flex flex-col gap-[6px] items-center relative shrink-0">
            <div className="relative shrink-0 size-[13.333px]" data-name="Icon">
                <div className="absolute inset-[-5%]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
                        <path d={svgPaths.p131fb370} id="Icon" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                    </svg>
                </div>
            </div>
            <p className="font-['Poppins:Regular',sans-serif] h-[68px] leading-[normal] not-italic relative shrink-0 text-[#6a90ba] text-[11px] text-center w-[600px]">
                {`Formly Propose par défaut les 22 Indicateurs Communs C’est à dire obligatoires lors de l'audit.`}
                <br aria-hidden="true" />
                Ici vous pouvez sélectionner les indicateurs spécifiques qui vous concernent OU personnaliser au mieux l’application pour une utilisation optimale.
            </p>
        </div>
    );
}

function Frame28() {
    return (
        <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-full">
            <Frame26 />
            <Frame36 />
        </div>
    );
}

function Frame48() {
    return (
        <div className="bg-[#ff7700] content-stretch flex gap-[3.305px] items-center justify-center relative rounded-[26.438px] shrink-0 size-[22.803px]">
            <p className="capitalize font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[10.643px] text-center text-nowrap text-white whitespace-pre">2</p>
        </div>
    );
}

function Frame47() {
    return (
        <div className="bg-[#ff7700] content-stretch flex gap-[3.305px] items-center justify-center relative rounded-[26.438px] shrink-0 size-[22.803px]">
            <p className="capitalize font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[10.643px] text-center text-nowrap text-white whitespace-pre">3</p>
        </div>
    );
}

function Frame37() {
    return (
        <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full">
            <div className="relative shrink-0 size-[13.333px]" data-name="Icon">
                <div className="absolute inset-[-5%]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
                        <path d={svgPaths.p131fb370} id="Icon" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                    </svg>
                </div>
            </div>
            <p className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#6a90ba] text-[15px] text-nowrap whitespace-pre">(Désactivation des indicateurs 1, 2 et 3)</p>
            <Frame44 className="bg-[#ff7700] content-stretch flex gap-[3.305px] items-center justify-center relative rounded-[26.438px] shrink-0 size-[22.803px]" />
            <Frame48 />
            <Frame47 />
        </div>
    );
}

function Frame55() {
    return (
        <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start min-h-px min-w-px relative shrink-0">
            <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[15px] w-full">Vous êtes EXCLUSIVEMENT sous-traitant (jamais de client en direct) ?</p>
            <Frame37 />
        </div>
    );
}

function Dot() {
    return (
        <div className="absolute left-[26.67px] size-[24px] top-[1.33px]" data-name="Dot">
            <div className="absolute inset-[-2.78%_-5.56%_-8.33%_-5.56%]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 27 27">
                    <g id="Dot">
                        <g filter="url(#filter0_d_1_1071)" id="Fill">
                            <circle cx="13.3333" cy="12.6667" fill="var(--fill-0, white)" r="12" />
                        </g>
                        <path d="M18.6667 12.6657L8 12.6676" id="Horz" stroke="var(--stroke-0, #007AFF)" strokeLinecap="round" strokeWidth="2" />
                        <path d="M13.3333 7.33333L13.3333 18" id="Vert" stroke="var(--stroke-0, #007AFF)" strokeLinecap="round" strokeWidth="2" />
                    </g>
                    <defs>
                        <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="26.6667" id="filter0_d_1_1071" width="26.6667" x="0" y="0">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                            <feOffset dy="0.666667" />
                            <feGaussianBlur stdDeviation="0.666667" />
                            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
                            <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_1071" />
                            <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_1071" mode="normal" result="shape" />
                        </filter>
                    </defs>
                </svg>
            </div>
        </div>
    );
}

function Toggle() {
    return (
        <div className="absolute bg-[#007aff] h-[26.667px] left-0 rounded-[13.333px] shadow-[0px_1.333px_6.667px_0px_rgba(0,74,215,0.45)] top-0 w-[52px]" data-name="Toggle">
            <Dot />
            <div className="absolute inset-0 pointer-events-none shadow-[0px_0px_3px_0px_inset_rgba(0,0,0,0.25)]" />
        </div>
    );
}

function Toggle1() {
    return (
        <div className="h-[26.667px] relative shrink-0 w-[52px]" data-name="Toggle">
            <Toggle />
        </div>
    );
}

function Frame29() {
    return (
        <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
            <Frame55 />
            <Toggle1 />
        </div>
    );
}

function Frame45() {
    return (
        <div className="bg-[#26c9b6] content-stretch flex gap-[3.305px] items-center justify-center relative rounded-[26.438px] shrink-0 size-[22.803px]">
            <p className="capitalize font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[10.643px] text-center text-nowrap text-white whitespace-pre">8</p>
        </div>
    );
}

function Frame38() {
    return (
        <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full">
            <div className="relative shrink-0 size-[13.333px]" data-name="Icon">
                <div className="absolute inset-[-5%]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
                        <path d={svgPaths.p131fb370} id="Icon" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                    </svg>
                </div>
            </div>
            <p className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#6a90ba] text-[15px] text-nowrap whitespace-pre">{`(Activation de l'indicateur 8)`}</p>
            <Frame45 />
        </div>
    );
}

function Frame56() {
    return (
        <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start min-h-px min-w-px relative shrink-0">
            <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[15px] w-full">Vos formations nécessitent des prérequis à l’entrée ?</p>
            <Frame38 />
        </div>
    );
}

function Toggle2() {
    return (
        <div className="absolute h-[26.667px] left-0 top-0 w-[52px]" data-name="Toggle">
            <div className="absolute inset-[-20%_-12.82%_-30%_-12.82%]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 66 40">
                    <g filter="url(#filter0_di_1_1058)" id="Toggle">
                        <g clipPath="url(#clip0_1_1058)">
                            <rect fill="var(--fill-0, #DADEE3)" height="26.6667" rx="13.3333" width="52" x="6.66667" y="5.33333" />
                            <g filter="url(#filter1_i_1_1058)" id="Rectangle 1">
                                <path d={svgPaths.p32eaeea0} fill="var(--fill-0, #007AFF)" />
                            </g>
                            <g id="Dot">
                                <g filter="url(#filter2_d_1_1058)" id="Fill">
                                    <circle cx="20" cy="18.6667" fill="var(--fill-0, white)" r="12" />
                                </g>
                                <path d="M14.6667 18.6667H25.3333" id="Horz" stroke="var(--stroke-0, #DADEE3)" strokeLinecap="round" strokeWidth="2" />
                                <path d="M14.6667 18.6667H25.3333" id="Vert" stroke="var(--stroke-0, #DADEE3)" strokeLinecap="round" strokeWidth="2" />
                            </g>
                        </g>
                    </g>
                    <defs>
                        <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="40" id="filter0_di_1_1058" width="65.3333" x="0" y="-1.19209e-07">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                            <feOffset dy="1.33333" />
                            <feGaussianBlur stdDeviation="3.33333" />
                            <feColorMatrix type="matrix" values="0 0 0 0 0.921569 0 0 0 0 0.933333 0 0 0 0 0.94902 0 0 0 1 0" />
                            <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_1058" />
                            <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_1058" mode="normal" result="shape" />
                            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                            <feOffset />
                            <feGaussianBlur stdDeviation="1.5" />
                            <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
                            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.09 0" />
                            <feBlend in2="shape" mode="normal" result="effect2_innerShadow_1_1058" />
                        </filter>
                        <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="26.6667" id="filter1_i_1_1058" width="0.000333333" x="6.66667" y="5.33333">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                            <feOffset />
                            <feGaussianBlur stdDeviation="1.5" />
                            <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
                            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                            <feBlend in2="shape" mode="normal" result="effect1_innerShadow_1_1058" />
                        </filter>
                        <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="26.6667" id="filter2_d_1_1058" width="26.6667" x="6.66667" y="6">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                            <feOffset dy="0.666667" />
                            <feGaussianBlur stdDeviation="0.666667" />
                            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
                            <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_1058" />
                            <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_1058" mode="normal" result="shape" />
                        </filter>
                        <clipPath id="clip0_1_1058">
                            <rect fill="white" height="26.6667" rx="13.3333" width="52" x="6.66667" y="5.33333" />
                        </clipPath>
                    </defs>
                </svg>
            </div>
        </div>
    );
}

function Toggle3() {
    return (
        <div className="h-[26.667px] relative shrink-0 w-[52px]" data-name="Toggle">
            <Toggle2 />
        </div>
    );
}

function Frame30() {
    return (
        <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
            <Frame56 />
            <Toggle3 />
        </div>
    );
}

function Frame46() {
    return (
        <div className="bg-[#ff7700] content-stretch flex gap-[3.305px] items-center justify-center relative rounded-[26.438px] shrink-0 size-[22.803px]">
            <p className="capitalize font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[10.643px] text-center text-nowrap text-white whitespace-pre">12</p>
        </div>
    );
}

function Frame39() {
    return (
        <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full">
            <div className="relative shrink-0 size-[13.333px]" data-name="Icon">
                <div className="absolute inset-[-5%]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
                        <path d={svgPaths.p131fb370} id="Icon" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                    </svg>
                </div>
            </div>
            <p className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#6a90ba] text-[15px] text-nowrap whitespace-pre">{`(Désactivation l'indicateur 12)`}</p>
            <Frame46 />
        </div>
    );
}

function Frame57() {
    return (
        <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start min-h-px min-w-px relative shrink-0">
            <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[15px] w-full">Vous ne proposez QUE des formations égales ou inférieures à 2 jours ?</p>
            <Frame39 />
        </div>
    );
}

function Toggle4() {
    return (
        <div className="absolute h-[26.667px] left-0 top-0 w-[52px]" data-name="Toggle">
            <div className="absolute inset-[-20%_-12.82%_-30%_-12.82%]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 66 40">
                    <g filter="url(#filter0_di_1_1078)" id="Toggle">
                        <g clipPath="url(#clip0_1_1078)">
                            <rect fill="var(--fill-0, #DADEE3)" height="26.6667" rx="13.3333" width="52" x="6.66667" y="5.33333" />
                            <g filter="url(#filter1_i_1_1078)" id="Rectangle 1">
                                <path d={svgPaths.p32eaeea0} fill="var(--fill-0, #FF7700)" />
                            </g>
                            <g id="Dot">
                                <g filter="url(#filter2_d_1_1078)" id="Fill">
                                    <circle cx="20" cy="18.6667" fill="var(--fill-0, white)" r="12" />
                                </g>
                                <path d="M14.6667 18.6667H25.3333" id="Horz" stroke="var(--stroke-0, #DADEE3)" strokeLinecap="round" strokeWidth="2" />
                                <path d="M14.6667 18.6667H25.3333" id="Vert" stroke="var(--stroke-0, #DADEE3)" strokeLinecap="round" strokeWidth="2" />
                            </g>
                        </g>
                    </g>
                    <defs>
                        <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="40" id="filter0_di_1_1078" width="65.3333" x="0" y="-1.19209e-07">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                            <feOffset dy="1.33333" />
                            <feGaussianBlur stdDeviation="3.33333" />
                            <feColorMatrix type="matrix" values="0 0 0 0 0.921569 0 0 0 0 0.933333 0 0 0 0 0.94902 0 0 0 1 0" />
                            <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_1078" />
                            <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_1078" mode="normal" result="shape" />
                            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                            <feOffset />
                            <feGaussianBlur stdDeviation="1.5" />
                            <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
                            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.09 0" />
                            <feBlend in2="shape" mode="normal" result="effect2_innerShadow_1_1078" />
                        </filter>
                        <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="26.6667" id="filter1_i_1_1078" width="0.000333333" x="6.66667" y="5.33333">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                            <feOffset />
                            <feGaussianBlur stdDeviation="1.5" />
                            <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
                            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                            <feBlend in2="shape" mode="normal" result="effect1_innerShadow_1_1078" />
                        </filter>
                        <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="26.6667" id="filter2_d_1_1078" width="26.6667" x="6.66667" y="6">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                            <feOffset dy="0.666667" />
                            <feGaussianBlur stdDeviation="0.666667" />
                            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
                            <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_1078" />
                            <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_1078" mode="normal" result="shape" />
                        </filter>
                        <clipPath id="clip0_1_1078">
                            <rect fill="white" height="26.6667" rx="13.3333" width="52" x="6.66667" y="5.33333" />
                        </clipPath>
                    </defs>
                </svg>
            </div>
        </div>
    );
}

function Toggle5() {
    return (
        <div className="h-[26.667px] relative shrink-0 w-[52px]" data-name="Toggle">
            <Toggle4 />
        </div>
    );
}

function Frame31() {
    return (
        <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
            <Frame57 />
            <Toggle5 />
        </div>
    );
}

function Frame49() {
    return (
        <div className="bg-[#26c9b6] content-stretch flex gap-[3.305px] items-center justify-center relative rounded-[26.438px] shrink-0 size-[22.803px]">
            <p className="capitalize font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[10.643px] text-center text-nowrap text-white whitespace-pre">3</p>
        </div>
    );
}

function Frame50() {
    return (
        <div className="bg-[#26c9b6] content-stretch flex gap-[3.305px] items-center justify-center relative rounded-[26.438px] shrink-0 size-[22.803px]">
            <p className="capitalize font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[10.643px] text-center text-nowrap text-white whitespace-pre">7</p>
        </div>
    );
}

function Frame51() {
    return (
        <div className="bg-[#26c9b6] content-stretch flex gap-[3.305px] items-center justify-center relative rounded-[26.438px] shrink-0 size-[22.803px]">
            <p className="capitalize font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[10.643px] text-center text-nowrap text-white whitespace-pre">16</p>
        </div>
    );
}

function Frame40() {
    return (
        <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full">
            <div className="relative shrink-0 size-[13.333px]" data-name="Icon">
                <div className="absolute inset-[-5%]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
                        <path d={svgPaths.p131fb370} id="Icon" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                    </svg>
                </div>
            </div>
            <p className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#6a90ba] text-[15px] text-nowrap whitespace-pre">(Activation des indicateurs 3, 7 et 16)</p>
            <Frame49 />
            <Frame50 />
            <Frame51 />
        </div>
    );
}

function Frame58() {
    return (
        <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start min-h-px min-w-px relative shrink-0">
            <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[15px] w-full">Vous proposez des formations menant à une certification professionnelle RNCP ?</p>
            <Frame40 />
        </div>
    );
}

function Dot1() {
    return (
        <div className="absolute left-[26.67px] size-[24px] top-[1.33px]" data-name="Dot">
            <div className="absolute inset-[-2.78%_-5.56%_-8.33%_-5.56%]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 27 27">
                    <g id="Dot">
                        <g filter="url(#filter0_d_1_1071)" id="Fill">
                            <circle cx="13.3333" cy="12.6667" fill="var(--fill-0, white)" r="12" />
                        </g>
                        <path d="M18.6667 12.6657L8 12.6676" id="Horz" stroke="var(--stroke-0, #007AFF)" strokeLinecap="round" strokeWidth="2" />
                        <path d="M13.3333 7.33333L13.3333 18" id="Vert" stroke="var(--stroke-0, #007AFF)" strokeLinecap="round" strokeWidth="2" />
                    </g>
                    <defs>
                        <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="26.6667" id="filter0_d_1_1071" width="26.6667" x="0" y="0">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                            <feOffset dy="0.666667" />
                            <feGaussianBlur stdDeviation="0.666667" />
                            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
                            <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_1071" />
                            <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_1071" mode="normal" result="shape" />
                        </filter>
                    </defs>
                </svg>
            </div>
        </div>
    );
}

function Toggle6() {
    return (
        <div className="absolute bg-[#007aff] h-[26.667px] left-0 rounded-[13.333px] shadow-[0px_1.333px_6.667px_0px_rgba(0,74,215,0.45)] top-0 w-[52px]" data-name="Toggle">
            <Dot1 />
            <div className="absolute inset-0 pointer-events-none shadow-[0px_0px_3px_0px_inset_rgba(0,0,0,0.25)]" />
        </div>
    );
}

function Toggle7() {
    return (
        <div className="h-[26.667px] relative shrink-0 w-[52px]" data-name="Toggle">
            <Toggle6 />
        </div>
    );
}

function Frame32() {
    return (
        <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
            <Frame58 />
            <Toggle7 />
        </div>
    );
}

function Frame52() {
    return (
        <div className="bg-[#26c9b6] content-stretch flex gap-[3.305px] items-center justify-center relative rounded-[26.438px] shrink-0 size-[22.803px]">
            <p className="capitalize font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[10.643px] text-center text-nowrap text-white whitespace-pre">13</p>
        </div>
    );
}

function Frame41() {
    return (
        <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full">
            <div className="relative shrink-0 size-[13.333px]" data-name="Icon">
                <div className="absolute inset-[-5%]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
                        <path d={svgPaths.p131fb370} id="Icon" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                    </svg>
                </div>
            </div>
            <p className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#6a90ba] text-[15px] text-nowrap whitespace-pre">{`(Activation de l'indicateur 13)`}</p>
            <Frame52 />
        </div>
    );
}

function Frame59() {
    return (
        <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start min-h-px min-w-px relative shrink-0">
            <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[15px] w-full">Vous proposez des prestations de formation en alternance ?</p>
            <Frame41 />
        </div>
    );
}

function Toggle8() {
    return (
        <div className="absolute h-[26.667px] left-0 top-0 w-[52px]" data-name="Toggle">
            <div className="absolute inset-[-20%_-12.82%_-30%_-12.82%]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 66 40">
                    <g filter="url(#filter0_di_1_1058)" id="Toggle">
                        <g clipPath="url(#clip0_1_1058)">
                            <rect fill="var(--fill-0, #DADEE3)" height="26.6667" rx="13.3333" width="52" x="6.66667" y="5.33333" />
                            <g filter="url(#filter1_i_1_1058)" id="Rectangle 1">
                                <path d={svgPaths.p32eaeea0} fill="var(--fill-0, #007AFF)" />
                            </g>
                            <g id="Dot">
                                <g filter="url(#filter2_d_1_1058)" id="Fill">
                                    <circle cx="20" cy="18.6667" fill="var(--fill-0, white)" r="12" />
                                </g>
                                <path d="M14.6667 18.6667H25.3333" id="Horz" stroke="var(--stroke-0, #DADEE3)" strokeLinecap="round" strokeWidth="2" />
                                <path d="M14.6667 18.6667H25.3333" id="Vert" stroke="var(--stroke-0, #DADEE3)" strokeLinecap="round" strokeWidth="2" />
                            </g>
                        </g>
                    </g>
                    <defs>
                        <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="40" id="filter0_di_1_1058" width="65.3333" x="0" y="-1.19209e-07">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                            <feOffset dy="1.33333" />
                            <feGaussianBlur stdDeviation="3.33333" />
                            <feColorMatrix type="matrix" values="0 0 0 0 0.921569 0 0 0 0 0.933333 0 0 0 0 0.94902 0 0 0 1 0" />
                            <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_1058" />
                            <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_1058" mode="normal" result="shape" />
                            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                            <feOffset />
                            <feGaussianBlur stdDeviation="1.5" />
                            <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
                            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.09 0" />
                            <feBlend in2="shape" mode="normal" result="effect2_innerShadow_1_1058" />
                        </filter>
                        <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="26.6667" id="filter1_i_1_1058" width="0.000333333" x="6.66667" y="5.33333">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                            <feOffset />
                            <feGaussianBlur stdDeviation="1.5" />
                            <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
                            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                            <feBlend in2="shape" mode="normal" result="effect1_innerShadow_1_1058" />
                        </filter>
                        <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="26.6667" id="filter2_d_1_1058" width="26.6667" x="6.66667" y="6">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                            <feOffset dy="0.666667" />
                            <feGaussianBlur stdDeviation="0.666667" />
                            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
                            <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_1058" />
                            <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_1058" mode="normal" result="shape" />
                        </filter>
                        <clipPath id="clip0_1_1058">
                            <rect fill="white" height="26.6667" rx="13.3333" width="52" x="6.66667" y="5.33333" />
                        </clipPath>
                    </defs>
                </svg>
            </div>
        </div>
    );
}

function Toggle9() {
    return (
        <div className="h-[26.667px] relative shrink-0 w-[52px]" data-name="Toggle">
            <Toggle8 />
        </div>
    );
}

function Frame33() {
    return (
        <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
            <Frame59 />
            <Toggle9 />
        </div>
    );
}

function Frame53() {
    return (
        <div className="bg-[#ff7700] content-stretch flex gap-[3.305px] items-center justify-center relative rounded-[26.438px] shrink-0 size-[22.803px]">
            <p className="capitalize font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[10.643px] text-center text-nowrap text-white whitespace-pre">27</p>
        </div>
    );
}

function Frame42() {
    return (
        <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full">
            <div className="relative shrink-0 size-[13.333px]" data-name="Icon">
                <div className="absolute inset-[-5%]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
                        <path d={svgPaths.p131fb370} id="Icon" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                    </svg>
                </div>
            </div>
            <p className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#6a90ba] text-[15px] text-nowrap whitespace-pre">{`(Désactivation de l'indicateur 27)`}</p>
            <Frame53 />
        </div>
    );
}

function Frame60() {
    return (
        <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start min-h-px min-w-px relative shrink-0">
            <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[15px] w-full">Vous ne faites JAMAIS appel à la sous-traitance ou au portage ?</p>
            <Frame42 />
        </div>
    );
}

function Toggle10() {
    return (
        <div className="absolute h-[26.667px] left-0 top-0 w-[52px]" data-name="Toggle">
            <div className="absolute inset-[-20%_-12.82%_-30%_-12.82%]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 66 40">
                    <g filter="url(#filter0_di_1_1078)" id="Toggle">
                        <g clipPath="url(#clip0_1_1078)">
                            <rect fill="var(--fill-0, #DADEE3)" height="26.6667" rx="13.3333" width="52" x="6.66667" y="5.33333" />
                            <g filter="url(#filter1_i_1_1078)" id="Rectangle 1">
                                <path d={svgPaths.p32eaeea0} fill="var(--fill-0, #FF7700)" />
                            </g>
                            <g id="Dot">
                                <g filter="url(#filter2_d_1_1078)" id="Fill">
                                    <circle cx="20" cy="18.6667" fill="var(--fill-0, white)" r="12" />
                                </g>
                                <path d="M14.6667 18.6667H25.3333" id="Horz" stroke="var(--stroke-0, #DADEE3)" strokeLinecap="round" strokeWidth="2" />
                                <path d="M14.6667 18.6667H25.3333" id="Vert" stroke="var(--stroke-0, #DADEE3)" strokeLinecap="round" strokeWidth="2" />
                            </g>
                        </g>
                    </g>
                    <defs>
                        <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="40" id="filter0_di_1_1078" width="65.3333" x="0" y="-1.19209e-07">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                            <feOffset dy="1.33333" />
                            <feGaussianBlur stdDeviation="3.33333" />
                            <feColorMatrix type="matrix" values="0 0 0 0 0.921569 0 0 0 0 0.933333 0 0 0 0 0.94902 0 0 0 1 0" />
                            <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_1078" />
                            <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_1078" mode="normal" result="shape" />
                            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                            <feOffset />
                            <feGaussianBlur stdDeviation="1.5" />
                            <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
                            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.09 0" />
                            <feBlend in2="shape" mode="normal" result="effect2_innerShadow_1_1078" />
                        </filter>
                        <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="26.6667" id="filter1_i_1_1078" width="0.000333333" x="6.66667" y="5.33333">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                            <feOffset />
                            <feGaussianBlur stdDeviation="1.5" />
                            <feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic" />
                            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                            <feBlend in2="shape" mode="normal" result="effect1_innerShadow_1_1078" />
                        </filter>
                        <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="26.6667" id="filter2_d_1_1078" width="26.6667" x="6.66667" y="6">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                            <feOffset dy="0.666667" />
                            <feGaussianBlur stdDeviation="0.666667" />
                            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
                            <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_1078" />
                            <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_1078" mode="normal" result="shape" />
                        </filter>
                        <clipPath id="clip0_1_1078">
                            <rect fill="white" height="26.6667" rx="13.3333" width="52" x="6.66667" y="5.33333" />
                        </clipPath>
                    </defs>
                </svg>
            </div>
        </div>
    );
}

function Toggle11() {
    return (
        <div className="h-[26.667px] relative shrink-0 w-[52px]" data-name="Toggle">
            <Toggle10 />
        </div>
    );
}

function Frame34() {
    return (
        <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
            <Frame60 />
            <Toggle11 />
        </div>
    );
}

function Frame54() {
    return (
        <div className="bg-[#26c9b6] content-stretch flex gap-[3.305px] items-center justify-center relative rounded-[26.438px] shrink-0 size-[22.803px]">
            <p className="capitalize font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[10.643px] text-center text-nowrap text-white whitespace-pre">28</p>
        </div>
    );
}

function Frame43() {
    return (
        <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full">
            <div className="relative shrink-0 size-[13.333px]" data-name="Icon">
                <div className="absolute inset-[-5%]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
                        <path d={svgPaths.p131fb370} id="Icon" stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                    </svg>
                </div>
            </div>
            <p className="font-['Poppins:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#6a90ba] text-[15px] text-nowrap whitespace-pre">{`(Activation de l'indicateur 28)`}</p>
            <Frame54 />
        </div>
    );
}

function Frame61() {
    return (
        <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start min-h-px min-w-px relative shrink-0">
            <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[15px] w-full">Vos actions incluent des périodes en entreprise ou en situation de travail(stage, alternance, AFEST) ?</p>
            <Frame43 />
        </div>
    );
}

function Dot2() {
    return (
        <div className="absolute left-[26.67px] size-[24px] top-[1.33px]" data-name="Dot">
            <div className="absolute inset-[-2.78%_-5.56%_-8.33%_-5.56%]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 27 27">
                    <g id="Dot">
                        <g filter="url(#filter0_d_1_1071)" id="Fill">
                            <circle cx="13.3333" cy="12.6667" fill="var(--fill-0, white)" r="12" />
                        </g>
                        <path d="M18.6667 12.6657L8 12.6676" id="Horz" stroke="var(--stroke-0, #007AFF)" strokeLinecap="round" strokeWidth="2" />
                        <path d="M13.3333 7.33333L13.3333 18" id="Vert" stroke="var(--stroke-0, #007AFF)" strokeLinecap="round" strokeWidth="2" />
                    </g>
                    <defs>
                        <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="26.6667" id="filter0_d_1_1071" width="26.6667" x="0" y="0">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                            <feOffset dy="0.666667" />
                            <feGaussianBlur stdDeviation="0.666667" />
                            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
                            <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_1071" />
                            <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_1071" mode="normal" result="shape" />
                        </filter>
                    </defs>
                </svg>
            </div>
        </div>
    );
}

function Toggle12() {
    return (
        <div className="absolute bg-[#007aff] h-[26.667px] left-0 rounded-[13.333px] shadow-[0px_1.333px_6.667px_0px_rgba(0,74,215,0.45)] top-0 w-[52px]" data-name="Toggle">
            <Dot2 />
            <div className="absolute inset-0 pointer-events-none shadow-[0px_0px_3px_0px_inset_rgba(0,0,0,0.25)]" />
        </div>
    );
}

function Toggle13() {
    return (
        <div className="h-[26.667px] relative shrink-0 w-[52px]" data-name="Toggle">
            <Toggle12 />
        </div>
    );
}

function Frame35() {
    return (
        <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
            <Frame61 />
            <Toggle13 />
        </div>
    );
}

function Frame27() {
    return (
        <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
            <Frame28 />
            <div className="h-0 relative shrink-0 w-full">
                <div className="absolute bottom-0 left-0 right-0 top-[-1.32px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 754 2">
                        <line id="Line 4" stroke="var(--stroke-0, #E4E5E7)" strokeWidth="1.32286" x2="754" y1="0.66143" y2="0.66143" />
                    </svg>
                </div>
            </div>
            <Frame29 />
            <div className="h-0 relative shrink-0 w-full">
                <div className="absolute bottom-0 left-0 right-0 top-[-1.32px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 754 2">
                        <line id="Line 4" stroke="var(--stroke-0, #E4E5E7)" strokeWidth="1.32286" x2="754" y1="0.66143" y2="0.66143" />
                    </svg>
                </div>
            </div>
            <Frame30 />
            <div className="h-0 relative shrink-0 w-full">
                <div className="absolute bottom-0 left-0 right-0 top-[-1.32px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 754 2">
                        <line id="Line 4" stroke="var(--stroke-0, #E4E5E7)" strokeWidth="1.32286" x2="754" y1="0.66143" y2="0.66143" />
                    </svg>
                </div>
            </div>
            <Frame31 />
            <div className="h-0 relative shrink-0 w-full">
                <div className="absolute bottom-0 left-0 right-0 top-[-1.32px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 754 2">
                        <line id="Line 4" stroke="var(--stroke-0, #E4E5E7)" strokeWidth="1.32286" x2="754" y1="0.66143" y2="0.66143" />
                    </svg>
                </div>
            </div>
            <Frame32 />
            <div className="h-0 relative shrink-0 w-full">
                <div className="absolute bottom-0 left-0 right-0 top-[-1.32px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 754 2">
                        <line id="Line 4" stroke="var(--stroke-0, #E4E5E7)" strokeWidth="1.32286" x2="754" y1="0.66143" y2="0.66143" />
                    </svg>
                </div>
            </div>
            <Frame33 />
            <div className="h-0 relative shrink-0 w-full">
                <div className="absolute bottom-0 left-0 right-0 top-[-1.32px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 754 2">
                        <line id="Line 4" stroke="var(--stroke-0, #E4E5E7)" strokeWidth="1.32286" x2="754" y1="0.66143" y2="0.66143" />
                    </svg>
                </div>
            </div>
            <Frame34 />
            <div className="h-0 relative shrink-0 w-full">
                <div className="absolute bottom-0 left-0 right-0 top-[-1.32px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 754 2">
                        <line id="Line 4" stroke="var(--stroke-0, #E4E5E7)" strokeWidth="1.32286" x2="754" y1="0.66143" y2="0.66143" />
                    </svg>
                </div>
            </div>
            <Frame35 />
        </div>
    );
}

function Frame22() {
    return (
        <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-[754px]">
            <Frame27 />
        </div>
    );
}

function Frame21() {
    return (
        <div className="absolute right-[13.33px] size-[30.667px] top-[11.48px]">
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

function Frame25() {
    return (
        <div className="bg-[#007aff] box-border content-stretch flex flex-col gap-[16px] items-center justify-center px-[16px] py-[10px] relative rounded-[50px] shrink-0 w-[292px]">
            <p className="capitalize font-['Poppins:Bold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[19px] text-nowrap text-white whitespace-pre">{`Valider `}</p>
        </div>
    );
}

export default function Prevue() {
    return (
        <div className="bg-white relative rounded-[18px] shadow-[0px_0px_75.7px_0px_rgba(25,41,74,0.09)] size-full" data-name="Prevue">
            <div className="flex flex-col items-center size-full">
                <div className="box-border content-stretch flex flex-col gap-[28px] items-center px-[20px] py-[32px] relative size-full">
                    <Frame1 />
                    <Frame22 />
                    <Frame21 />
                    <Frame25 />
                </div>
            </div>
        </div>
    );
}