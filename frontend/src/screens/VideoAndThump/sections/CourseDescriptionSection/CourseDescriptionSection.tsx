import React from "react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Separator } from "../../../../components/ui/separator";

const categories = [
  { id: 1, name: "Category Name" },
  { id: 2, name: "Category Name 2" },
];

const videoCards = [
  {
    title: "Vidéo D'introduction",
    thumbnail: "/assets/images/video-thumbnail-2.svg",
    filename: "Titre De Video.MP4",
    status: "Telechargé",
    statusColor: "border-[#007aff] text-[#007aff]",
    bgColor: "bg-[#ffffff]",
  },
  {
    title: "Miniature Vidéo",
    thumbnail: "/assets/images/video-thumbnail.png",
    filename: "Titre De Video.MP4",
    status: "En course",
    statusColor: "border-[#ff7700] text-[#ff7700]",
    bgColor: "bg-[#ffffff]",
    hasOverlay: true,
  },
];

const collapsibleSections = [
  {
    id: 1,
    title: "Modules",
    icon: "/assets/icons/expand-module.png",
  },
  {
    id: 2,
    title: "Objectif Pedagogique",
    icon: "/assets/icons/expand-objective.png",
  },
  {
    id: 3,
    title: "Public Vise  Prerequis",
    icon: "/assets/icons/expand-public.png",
  },
  {
    id: 4,
    title: "Méthodes De Formation",
    icon: "/assets/icons/expand-method.png",
  },
  {
    id: 5,
    title: "Tarification",
    icon: "/assets/icons/expand-pricing.png",
  },
  {
    id: 6,
    title: "Spécificités De La Formation",
    icon: "/assets/icons/expand-specifics.png",
  },
];

export const CourseDescriptionSection = (): JSX.Element => {
  return (
    <section className="w-full flex justify-center px-7 py-[26px]">
      <div className="w-full max-w-[1362px] flex flex-col gap-6">
        <Card className="rounded-[18px] border-[#dbd8d8] shadow-[0px_0px_75.7px_#19294a17]">
          <CardContent className="p-5 flex flex-col gap-7">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-[17px] py-3 bg-[#ffffff] rounded-[18px] border border-solid border-[#e2e2ea]">
                <div className="inline-flex items-center gap-3">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-[17px] h-[17px] rounded-[8.5px] border-2 border-solid border-[#e2e2ea]" />
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[#19294a] text-[17px]">
                      Course Title:
                    </span>
                  </div>
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-[#6a90b9] text-[17px]">
                    Inter Course Title...
                  </span>
                </div>
                <span className="[font-family:'Poppins',Helvetica] font-medium text-[#6a90b9] text-[15px]">
                  110
                </span>
              </div>

              <div className="flex items-center justify-between px-[17px] py-3 bg-[#ffffff] rounded-[18px] border border-solid border-[#e2e2ea]">
                <div className="inline-flex items-center gap-3">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-[17px] h-[17px] rounded-[8.5px] border-2 border-solid border-[#e2e2ea]" />
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[#19294a] text-[17px]">
                      Course Category:
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-3">
                    {categories.map((category) => (
                      <Badge
                        key={category.id}
                        variant="outline"
                        className="inline-flex items-center gap-2 px-2.5 py-2 rounded-lg border-[#007aff] bg-[#ffffff] h-auto"
                      >
                        <span className="[font-family:'Poppins',Helvetica] font-medium text-[#5c677e] text-[17px]">
                          {category.name}
                        </span>
                        <img
                          className="w-[15.29px] h-[15.29px]"
                          alt="Remove"
                          src="/assets/icons/close.svg"
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
                <img
                  className="w-[11.47px] h-[13.14px]"
                  alt="Dropdown"
                  src="/assets/icons/dropdown-2.svg"
                />
              </div>

              <Card className="rounded-[18px] border-[#dbd8d8] shadow-[0px_0px_75.7px_#19294a17]">
                <CardContent className="p-5 flex flex-col gap-7">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4">
                      <div className="inline-flex items-center gap-3">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-[17px] h-[17px] rounded-[8.5px] border-2 border-solid border-[#e2e2ea]" />
                          <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-[17px]">
                            Ajouter Photo Ou Video D&apos;intoduction
                          </span>
                          <img
                            className="w-4 h-4"
                            alt="Info"
                            src="/assets/icons/info.svg"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Button className="inline-flex items-center gap-2.5 px-[19px] py-[26px] h-auto bg-[#ff7700] rounded-[15px] border hover:bg-[#ff7700]/90">
                          <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#ffffff] text-[17px]">
                            Vidéo D&#39;introduction
                          </span>
                          <img
                            className="w-[38.89px] h-[26.39px]"
                            alt="Video icon"
                            src="/assets/icons/video.png"
                          />
                        </Button>

                        <Button
                          variant="outline"
                          className="inline-flex items-center gap-2.5 px-[19px] py-[26px] h-auto bg-[#e8f0f7] rounded-[15px] border-[#6a90b9] hover:bg-[#e8f0f7]/90"
                        >
                          <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#6a90b9] text-[17px]">
                            Image D&#39;introduction
                          </span>
                          <img
                            className="w-[25.53px] h-[27px]"
                            alt="Image icon"
                            src="/assets/icons/image.png"
                          />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 px-[22px] py-[15px] bg-[#fcf1e5] rounded-[20px]">
                      <div className="flex gap-7">
                        {videoCards.map((card, index) => (
                          <div
                            key={index}
                            className="flex-1 flex flex-col gap-4"
                          >
                            <div className="inline-flex items-center gap-2">
                              <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#6a90b9] text-[17px]">
                                {card.title}
                              </span>
                              <img
                                className="w-4 h-4"
                                alt="Info"
                                src="/assets/icons/info.svg"
                              />
                            </div>

                            <div className="flex items-center gap-4 px-3.5 py-[13px] bg-[#ffffff] rounded-[42px] relative">
                              <img
                                className="flex-1 h-[168px] object-cover rounded-[26px]"
                                alt="Thumbnail"
                                src={card.thumbnail}
                              />
                              {card.hasOverlay && (
                                <div className="absolute top-[13px] left-3.5 w-[401px] h-[168px] bg-[#ffffff03] rounded-[26px] backdrop-blur-[10.7px]" />
                              )}

                              <div className="inline-flex flex-col gap-[22px]">
                                <div className="inline-flex flex-col gap-4">
                                  <span className="[font-family:'Poppins',Helvetica] font-medium text-[#6a90b9] text-[17px]">
                                    {card.filename}
                                  </span>

                                  <Badge
                                    variant="outline"
                                    className={`inline-flex items-center justify-center gap-2.5 px-3 py-[7px] h-auto ${card.bgColor} rounded-[70px] ${card.statusColor}`}
                                  >
                                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]">
                                      {card.status}
                                    </span>
                                    {index === 0 ? (
                                      <img
                                        className="w-[21.77px] h-[21.77px]"
                                        alt="Status icon"
                                        src="/assets/icons/check-circle.png"
                                      />
                                    ) : (
                                      <img
                                        className="w-[16.79px] h-[20.52px]"
                                        alt="Status icon"
                                        src="/assets/icons/upload.svg"
                                      />
                                    )}
                                  </Badge>
                                </div>

                                <div className="inline-flex items-center gap-[12.37px]">
                                  <img
                                    className="w-[37.92px] h-[37.92px]"
                                    alt="Edit"
                                    src="/assets/icons/edit.svg"
                                  />
                                  <img
                                    className="w-[37.92px] h-[37.92px]"
                                    alt="Delete"
                                    src="/assets/icons/delete.svg"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col px-[17px] py-3 bg-[#ffffff] rounded-[18px] border border-solid border-[#e2e2ea]">
                <div className="flex flex-col gap-4">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-[17px] h-[17px] rounded-[8.5px] border-2 border-solid border-[#e2e2ea]" />
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[#19294a] text-[17px]">
                      Course Description:
                    </span>
                  </div>

                  <div className="flex flex-col gap-[9px] px-[17px] py-3 bg-[#ffffff] rounded-[18px]">
                    <div className="flex flex-col gap-[11px]">
                      <div className="inline-flex items-center gap-2.5">
                        <div className="inline-flex items-center gap-3">
                          <img
                            className="w-6 h-6"
                            alt="Bold"
                            src="/assets/icons/bold.svg"
                          />
                          <img
                            className="w-6 h-6"
                            alt="Italic"
                            src="/assets/icons/italic.svg"
                          />
                          <img
                            className="w-6 h-6"
                            alt="Underline"
                            src="/assets/icons/underline.svg"
                          />
                        </div>

                        <img
                          className="w-px h-[21.5px]"
                          alt="Separator"
                          src="/assets/icons/separator.svg"
                        />

                        <div className="inline-flex flex-wrap items-center gap-4">
                          <div className="inline-flex items-center gap-3">
                            <div className="inline-flex items-center gap-1">
                              <img
                                className="w-6 h-6"
                                alt="List"
                                src="/assets/icons/list-number.svg"
                              />
                              <img
                                className="w-6 h-6"
                                alt="List"
                                src="/assets/icons/list-bullet.svg"
                              />
                            </div>
                          </div>

                          <div className="inline-flex items-center gap-3">
                            <img
                              className="w-6 h-6"
                              alt="Align left"
                              src="/assets/icons/align-left.svg"
                            />
                            <img
                              className="w-6 h-6"
                              alt="Align center"
                              src="/assets/icons/align-center.svg"
                            />
                            <img
                              className="w-6 h-6"
                              alt="Align right"
                              src="/assets/icons/align-right.svg"
                            />
                          </div>
                        </div>
                      </div>

                      <Separator className="w-full" />
                    </div>

                    <div className="inline-flex items-center gap-3">
                      <div className="inline-flex items-center gap-[7px] px-[23px] py-[7px]">
                        <span className="[font-family:'Poppins',Helvetica] font-light text-[#5b677d] text-[13px]">
                          Inter Course Description...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[18px] border-[#dbd8d8] shadow-[0px_0px_75.7px_#19294a17]">
          <CardContent className="p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-4">
              <div className="inline-flex items-center gap-[25px]">
                <div className="inline-flex items-center gap-2">
                  <div className="w-[17px] h-[17px] rounded-[8.5px] border-2 border-solid border-[#e2e2ea]" />
                  <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-[17px]">
                    Durée De La Formation
                  </span>
                  <img
                    className="w-4 h-4"
                    alt="Info"
                    src="/assets/icons/info.svg"
                  />
                </div>

                <div className="flex items-center justify-between px-2.5 py-2 w-[212px] rounded-lg border border-solid border-[#007aff]">
                  <span className="[font-family:'Poppins',Helvetica] font-medium text-[#19294a] text-[17px]">
                    -
                  </span>
                  <div className="flex items-center gap-[3px]">
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[#007aff] text-[17px]">
                      H
                    </span>
                    <img
                      className="w-3.5 h-3.5"
                      alt="Time"
                      src="/assets/icons/clock.png"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {collapsibleSections.map((section) => (
          <Card
            key={section.id}
            className="rounded-[18px] border-[#dbd8d8] shadow-[0px_0px_75.7px_#19294a17]"
          >
            <CardContent className="p-5 relative">
              <div className="inline-flex items-center gap-3">
                <div className="inline-flex items-center gap-2">
                  <div className="w-[17px] h-[17px] rounded-[8.5px] border-2 border-solid border-[#e2e2ea]" />
                  <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-[17px]">
                    {section.title}
                  </span>
                  <img
                    className="w-4 h-4"
                    alt="Info"
                    src="/assets/icons/info.svg"
                  />
                </div>
              </div>

              <img
                className="absolute top-[18px] right-5 w-[31px] h-[31px]"
                alt="Expand"
                src={section.icon}
              />
            </CardContent>
          </Card>
        ))}

        <Button className="inline-flex items-center justify-center gap-4 px-[19px] py-2.5 h-auto bg-[#007aff] rounded-lg hover:bg-[#007aff]/90 w-fit">
          <span className="[font-family:'Poppins',Helvetica] font-medium text-[#ffffff] text-[17px]">
            Suivant
          </span>
          <img
            className="w-[11.67px] h-2.5"
            alt="Arrow"
            src="/assets/icons/arrow-right.svg"
          />
        </Button>
      </div>
    </section>
  );
};
