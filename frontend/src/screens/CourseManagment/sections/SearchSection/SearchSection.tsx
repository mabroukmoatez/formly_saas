import { ClockIcon, UserIcon } from "lucide-react";
import React from "react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";

const coursesData = [
  {
    id: 1,
    image: "/assets/images/course-1.png",
    title: "Page Not Found",
    category: "Development",
    additionalCategories: "+5",
    duration: "No duration set",
    instructor: "No instructor assigned",
    price: "30 €",
    status: "draft",
    statusLabel: "Brouillon",
    statusBg: "bg-gray-600",
    statusBorder: "border-gray-600",
    statusText: "text-white",
    statusDot: "bg-gray-600",
  },
  {
    id: 2,
    image: "/assets/images/course-2.png",
    title: "information technique",
    category: "Development",
    additionalCategories: "+5",
    duration: "No duration set",
    instructor: "No instructor assigned",
    price: "220 €",
    status: "draft",
    statusLabel: "Brouillon",
    statusBg: "bg-gray-600",
    statusBorder: "border-gray-600",
    statusText: "text-white",
    statusDot: "bg-gray-600",
  },
  {
    id: 3,
    image: "/assets/images/course-3.png",
    title: "The Complete AI Guide: Learn ChatGPT, Generative AI & More",
    category: "Ai Tools",
    additionalCategories: "+5",
    duration: "32 Hours",
    instructor: "Formateur Nom",
    price: "350 €",
    status: "draft",
    statusLabel: "Brouillon",
    statusBg: "bg-gray-600",
    statusBorder: "border-gray-600",
    statusText: "text-white",
    statusDot: "bg-gray-600",
  },
  {
    id: 4,
    image: "/assets/images/course-4.png",
    title: "Advanced Web Development",
    category: "Development",
    additionalCategories: "+5",
    duration: "24 Hours",
    instructor: "John Doe",
    price: "180 €",
    status: "draft",
    statusLabel: "Brouillon",
    statusBg: "bg-gray-600",
    statusBorder: "border-gray-600",
    statusText: "text-white",
    statusDot: "bg-gray-600",
  },
  {
    id: 5,
    image: "/assets/images/course-5.png",
    title: "Data Science Fundamentals",
    category: "Data Science",
    additionalCategories: "+5",
    duration: "40 Hours",
    instructor: "Jane Smith",
    price: "450 €",
    status: "draft",
    statusLabel: "Brouillon",
    statusBg: "bg-gray-600",
    statusBorder: "border-gray-600",
    statusText: "text-white",
    statusDot: "bg-gray-600",
  },
  {
    id: 6,
    image: "/assets/images/course-6.png",
    title: "Mobile App Development",
    category: "Mobile",
    additionalCategories: "+5",
    duration: "36 Hours",
    instructor: "Mike Johnson",
    price: "320 €",
    status: "draft",
    statusLabel: "Brouillon",
    statusBg: "bg-gray-600",
    statusBorder: "border-gray-600",
    statusText: "text-white",
    statusDot: "bg-gray-600",
  },
];

export const SearchSection = (): JSX.Element => {
  return (
    <section className="w-full py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[31px] max-w-[1205px] mx-auto px-4">
        {coursesData.map((course, index) => (
          <Card
            key={course.id}
            className="translate-y-[-1rem] animate-fade-in opacity-0 bg-white rounded-[18px] shadow-lg overflow-hidden transition-transform hover:scale-[1.02] border-0"
            style={
              { "--animation-delay": `${index * 100}ms` } as React.CSSProperties
            }
          >
            <CardContent className="p-0 flex flex-col">
              {/* Header Image/Banner */}
              <div className="w-full h-[180px] overflow-hidden relative">
                <img
                  className="w-full h-full object-cover"
                  alt={course.title}
                  src={course.image}
                />
              </div>

              {/* Status Badge - positioned below image */}
              <div className="px-4 pt-3 pb-2">
                <Badge className="bg-gray-600 text-white rounded-full px-3 py-1 text-[12px] font-medium">
                  {course.statusLabel}
                </Badge>
              </div>

              {/* Content Section */}
              <div className="px-4 pb-4 flex flex-col gap-3">
                {/* Title */}
                <h3 className="font-bold text-[#19294a] text-[16px] leading-tight">
                  {course.title}
                </h3>

                {/* Category */}
                <Badge className="bg-gray-200 text-gray-700 rounded-full px-3 py-1 text-[12px] font-normal w-fit">
                  {course.category}
                </Badge>

                {/* Duration */}
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-500 text-[14px] font-normal">
                    {course.duration}
                  </span>
                </div>

                {/* Instructor */}
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-500 text-[14px] font-normal">
                    {course.instructor}
                  </span>
                </div>

                {/* Footer - Price and Action Icons */}
                <div className="flex items-center justify-between pt-2">
                  {/* Price */}
                  <span className="font-semibold text-orange-500 text-[16px]">
                    {course.price}
                  </span>

                  {/* Action Icons */}
                  <div className="flex items-center gap-3">
                    {/* Eye Icon */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                    >
                      <img
                        className="w-4 h-4"
                        alt="View"
                        src="/assets/icons/favorite-2.svg"
                      />
                    </Button>

                    {/* Edit Icon */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                    >
                      <img
                        className="w-4 h-4"
                        alt="Edit"
                        src="/assets/icons/edit.svg"
                      />
                    </Button>

                    {/* Delete Icon */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                    >
                      <img
                        className="w-4 h-4"
                        alt="Delete"
                        src="/assets/icons/delete.svg"
                      />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
