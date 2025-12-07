import { useState } from 'react';
import svgPaths from "./imports/svg-sz4da53ipj";

export default function App() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [shortDescription, setShortDescription] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const maxShortDescLength = 350;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDraft = () => {
    alert('Article saved as draft!');
  };

  const handlePublish = () => {
    if (!title) {
      alert('Please fill in the required title field');
      return;
    }
    alert('Article published!');
  };

  return (
    <div className="bg-white min-h-screen relative" data-name="Gestion des actualités - Blog Grid">
      {/* Top buttons */}
      <div className="absolute content-stretch flex gap-[12px] items-center right-[62px] top-[128px] z-10">
        <button 
          onClick={handleDraft}
          className="bg-[#ff9500] content-stretch flex gap-[8px] items-center justify-center px-[34px] py-[10px] relative rounded-[48px] shrink-0 hover:bg-[#e68500] transition-colors"
        >
          <div className="relative shrink-0 size-[25px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 25">
              <g>
                <circle cx="12.5" cy="12.5" r="11.5" stroke="white" strokeWidth="2" />
                <path d={svgPaths.p8f41000} stroke="white" strokeLinecap="round" strokeWidth="3" />
              </g>
            </svg>
          </div>
          <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[17px] text-nowrap text-right text-white whitespace-pre">brouillon</p>
        </button>
        <button 
          onClick={handlePublish}
          className="bg-[#007aff] content-stretch flex gap-[8px] items-center justify-center px-[15px] py-[10px] relative rounded-[48px] shrink-0 hover:bg-[#0066dd] transition-colors"
        >
          <div className="h-[13px] relative shrink-0 w-[14px]">
            <div className="absolute inset-[-7.69%_-7.14%_-7.69%_-7.19%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 15">
                <path d={svgPaths.p295abe00} stroke="white" strokeWidth="2" />
              </svg>
            </div>
          </div>
          <p className="capitalize font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[17px] text-nowrap text-right text-white whitespace-pre">Publier</p>
        </button>
      </div>

      {/* Main content */}
      <div className="absolute bg-[rgba(232,240,247,0.27)] content-stretch flex flex-col gap-[28px] items-start left-[37px] p-[20px] rounded-[18px] top-[221px] w-[1352px]">
        <div aria-hidden="true" className="absolute border border-[#d3d3e8] border-solid inset-0 pointer-events-none rounded-[18px]" />
        
        {/* Title */}
        <div className="content-stretch flex items-center relative shrink-0 w-[1307px]">
          <p className="font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">Ajouter une actualité</p>
        </div>

        {/* Form fields */}
        <div className="content-stretch flex flex-col gap-[37px] items-start relative shrink-0">
          {/* Title input */}
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0">
            <div className="bg-white content-stretch flex h-[67px] items-center justify-between px-[17px] py-[12px] relative rounded-[18px] shrink-0 w-[1307px]">
              <div aria-hidden="true" className="absolute border-2 border-[#e2e2ea] border-solid inset-0 pointer-events-none rounded-[18px]" />
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 flex-1">
                <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                  <div className="relative shrink-0 size-[17px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
                      <path clipRule="evenodd" d={svgPaths.p2c87b800} fill="#19294A" fillRule="evenodd" />
                    </svg>
                  </div>
                  <p className="font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">Titre de l&apos;actualité</p>
                </div>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Saisissez le titre de l'actualité"
                  className="flex-1 bg-transparent font-['Poppins:Medium',sans-serif] leading-[normal] not-italic text-[#6a90ba] text-[17px] outline-none"
                />
              </div>
            </div>
            <p className="font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#6a90ba] text-[15px] text-nowrap whitespace-pre">* Ce champ est obligatoire</p>
          </div>

          {/* Category dropdown */}
          <div className="bg-white relative rounded-[18px] shrink-0 w-full">
            <div aria-hidden="true" className="absolute border border-[#dbd9d9] border-solid inset-0 pointer-events-none rounded-[18px] shadow-[0px_0px_75.7px_0px_rgba(25,41,74,0.09)]" />
            <div className="flex flex-col justify-end size-full">
              <div className="content-stretch flex flex-col gap-[28px] items-start justify-end p-[20px] relative w-full">
                <button 
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="content-stretch flex items-center relative shrink-0 w-full"
                >
                  <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                    <div className="relative shrink-0 size-[17px]">
                      <div className="absolute inset-0" style={{ "--stroke-0": "rgba(226, 226, 234, 1)" } as React.CSSProperties}>
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
                          <circle cx="8.5" cy="8.5" r="7.5" stroke="var(--stroke-0, #E2E2EA)" strokeWidth="2" />
                        </svg>
                      </div>
                    </div>
                    <p className="capitalize font-['Poppins:SemiBold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">catégorie</p>
                    <div className="relative shrink-0 size-[15px]">
                      <div className="absolute inset-[-3.33%]" style={{ "--stroke-0": "rgba(106, 144, 186, 1)" } as React.CSSProperties}>
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                          <path d={svgPaths.p28ed2900} stroke="var(--stroke-0, #6A90BA)" strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </button>
                <div className="absolute h-[5.176px] right-[30px] top-[31px] w-[11.621px]">
                  <div className="absolute inset-[-19.31%_-8.61%_-19.33%_-8.61%]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 8">
                      <g>
                        <path d={svgPaths.p7ea2e80} stroke="#5C677E" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Image upload */}
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0">
            <label className="bg-white h-[166px] relative rounded-[18px] shrink-0 w-full cursor-pointer" htmlFor="image-upload">
              <div aria-hidden="true" className="absolute border-2 border-[#e2e2ea] border-solid inset-0 pointer-events-none rounded-[18px]" />
              <div className="flex flex-col items-center justify-center size-full">
                <div className="content-stretch flex flex-col h-[166px] items-center justify-center px-[17px] py-[12px] relative w-full">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="h-full w-auto object-contain rounded-[18px]" />
                  ) : (
                    <div className="content-stretch flex flex-col gap-[12px] items-center relative shrink-0 w-full">
                      <div className="bg-neutral-100 relative rounded-[28px] shrink-0 size-[40px]">
                        <div aria-hidden="true" className="absolute border-[6px] border-neutral-50 border-solid inset-[-3px] pointer-events-none rounded-[31px]" />
                        <div className="absolute left-[10px] overflow-clip size-[20px] top-[10px]">
                          <div className="absolute inset-[8.33%_12.5%]">
                            <div className="absolute inset-[-5%_-5.56%]">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 22">
                                <path d={svgPaths.p32522b00} stroke="#181D27" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0 w-full">
                        <div className="content-stretch flex gap-[4px] items-start justify-center relative shrink-0 w-full">
                          <div className="content-stretch flex items-start relative shrink-0">
                            <div className="content-stretch flex items-center justify-center relative shrink-0">
                              <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[20px] not-italic relative shrink-0 text-[14px] text-nowrap text-white whitespace-pre">Button CTA</p>
                            </div>
                          </div>
                          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[20px] not-italic relative shrink-0 text-[#535862] text-[14px] text-nowrap whitespace-pre">or drag and drop</p>
                        </div>
                        <p className="font-['Inter:Regular',sans-serif] font-normal leading-[18px] not-italic relative shrink-0 text-[#535862] text-[12px] text-center w-full">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </label>
            <input 
              id="image-upload"
              type="file" 
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <p className="font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#6a90ba] text-[15px] text-nowrap whitespace-pre">Formats acceptés : JPG, PNG. Taille recommandée : 1200x600 px</p>
          </div>

          {/* Short description */}
          <div className="bg-white content-stretch flex flex-col gap-[20px] items-start pb-[24px] pt-[12px] px-[17px] relative rounded-[18px] shrink-0 w-[1307px]">
            <div aria-hidden="true" className="absolute border-2 border-[#e2e2ea] border-solid inset-0 pointer-events-none rounded-[18px]" />
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-[1273px]">
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                <div className="relative shrink-0 size-[17px]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
                    <path clipRule="evenodd" d={svgPaths.p2c87b800} fill="#19294A" fillRule="evenodd" />
                  </svg>
                </div>
                <p className="font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">Description Court</p>
              </div>
              <p className="font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">{shortDescription.length}/{maxShortDescLength}</p>
            </div>
            <div className="bg-white h-[116px] relative rounded-[18px] shrink-0 w-full">
              <div aria-hidden="true" className="absolute border-2 border-[#e2e2ea] border-solid inset-0 pointer-events-none rounded-[18px]" />
              <div className="size-full">
                <div className="content-stretch flex flex-col gap-[9px] h-[116px] items-start px-[17px] py-[12px] relative w-full">
                  <textarea
                    value={shortDescription}
                    onChange={(e) => {
                      if (e.target.value.length <= maxShortDescLength) {
                        setShortDescription(e.target.value);
                      }
                    }}
                    placeholder="Résumez en quelques lignes le contenu de l'actualité"
                    className="w-full h-full bg-transparent font-['Poppins:Medium',sans-serif] leading-[normal] not-italic text-[#6a90ba] text-[17px] outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Content editor */}
          <div className="bg-white content-stretch flex flex-col gap-[20px] items-start pb-[24px] pt-[12px] px-[17px] relative rounded-[18px] shrink-0 w-[1307px]">
            <div aria-hidden="true" className="absolute border-2 border-[#e2e2ea] border-solid inset-0 pointer-events-none rounded-[18px]" />
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-[1273px]">
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                <div className="relative shrink-0 size-[17px]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
                    <path clipRule="evenodd" d={svgPaths.p2c87b800} fill="#19294A" fillRule="evenodd" />
                  </svg>
                </div>
                <p className="font-['Poppins:Medium',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">Contenu</p>
              </div>
            </div>
            <div className="bg-white h-[293px] relative rounded-[18px] shrink-0 w-full">
              <div aria-hidden="true" className="absolute border-2 border-[#e2e2ea] border-solid inset-0 pointer-events-none rounded-[18px]" />
              <div className="flex flex-col items-center size-full">
                <div className="content-stretch flex flex-col gap-[9px] h-[293px] items-center px-[17px] py-[12px] relative w-full">
                  {/* Toolbar */}
                  <div className="content-center flex flex-wrap gap-[24px] items-center justify-center px-[32px] py-[24px] relative shrink-0 w-[1273px]">
                    <div aria-hidden="true" className="absolute border-[#e2e2ea] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
                    {/* Undo/Redo */}
                    <div className="content-stretch flex gap-[12px] items-center justify-center relative rounded-[4px] shrink-0">
                      <button className="overflow-clip relative shrink-0 size-[28px] hover:bg-gray-100 rounded">
                        <div className="absolute inset-[8.33%_16.67%_8.33%_8.33%]">
                          <div className="absolute bottom-0 left-[2.03%] right-0 top-[3.68%]" style={{ "--fill-0": "rgba(82, 82, 91, 1)" } as React.CSSProperties}>
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 20">
                              <path d={svgPaths.pbe8aa00} fill="var(--fill-0, #52525B)" />
                            </svg>
                          </div>
                        </div>
                      </button>
                      <button className="overflow-clip relative shrink-0 size-[28px] hover:bg-gray-100 rounded">
                        <div className="absolute inset-[8.33%_8.33%_8.33%_16.67%]">
                          <div className="absolute bottom-0 left-0 right-[2.03%] top-[3.68%]" style={{ "--fill-0": "rgba(82, 82, 91, 1)" } as React.CSSProperties}>
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 20">
                              <path d={svgPaths.p123aad00} fill="var(--fill-0, #52525B)" />
                            </svg>
                          </div>
                        </div>
                      </button>
                    </div>
                    {/* Text styling buttons */}
                    <div className="content-stretch flex gap-[12px] items-center justify-center relative shrink-0">
                      <button className="overflow-clip relative shrink-0 size-[28px] hover:bg-gray-100 rounded">
                        <div className="absolute bottom-[16.67%] left-1/4 right-1/4 top-[16.67%]">
                          <div className="absolute inset-0" style={{ "--fill-0": "rgba(82, 82, 91, 1)" } as React.CSSProperties}>
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 16">
                              <path d={svgPaths.p20c88000} fill="var(--fill-0, #52525B)" />
                            </svg>
                          </div>
                        </div>
                      </button>
                      <button className="overflow-clip relative shrink-0 size-[28px] hover:bg-gray-100 rounded">
                        <div className="absolute inset-[16.67%]">
                          <div className="absolute inset-0" style={{ "--fill-0": "rgba(82, 82, 91, 1)" } as React.CSSProperties}>
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                              <path clipRule="evenodd" d={svgPaths.p23c7ef00} fill="var(--fill-0, #52525B)" fillRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </button>
                      <button className="overflow-clip relative shrink-0 size-[28px] hover:bg-gray-100 rounded">
                        <div className="absolute inset-[12.5%_20.83%]">
                          <div className="absolute inset-0" style={{ "--fill-0": "rgba(82, 82, 91, 1)" } as React.CSSProperties}>
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 18">
                              <g>
                                <path d={svgPaths.p199766f0} fill="var(--fill-0, #52525B)" />
                                <path d={svgPaths.p394ed500} fill="var(--fill-0, #52525B)" />
                              </g>
                            </svg>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                  {/* Content textarea */}
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Résumez en quelques lignes le contenu de l'actualité"
                    className="flex-1 w-full bg-transparent font-['Poppins:Medium',sans-serif] leading-[normal] not-italic text-[#6a90ba] text-[17px] outline-none resize-none px-[17px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
