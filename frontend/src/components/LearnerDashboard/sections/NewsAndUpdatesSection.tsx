import React, { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';

const weekDays = [
  { label: 'L', fullName: 'Lundi' },
  { label: 'M', fullName: 'Mardi' },
  { label: 'M', fullName: 'Mercredi' },
  { label: 'J', fullName: 'Jeudi' },
  { label: 'V', fullName: 'Vendredi' },
  { label: 'S', fullName: 'Samedi' },
  { label: 'D', fullName: 'Dimanche' },
];

export const NewsAndUpdatesSection: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ subdomain?: string }>();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get subdomain from path if present
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const subdomain = params.subdomain || (pathSegments[0] && pathSegments[0] !== 'learner' && pathSegments[0] !== 'superadmin' 
    ? pathSegments[0] 
    : null);

  // Build navigation paths with subdomain support
  const getPath = (path: string) => {
    if (subdomain) {
      return `/${subdomain}${path}`;
    }
    return path;
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const calendarDates: Array<{ day: string; opacity: string; isCurrentMonth: boolean }> = [];

  // Days from previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    calendarDates.push({
      day: String(prevMonthLastDay - i),
      opacity: 'opacity-40',
      isCurrentMonth: false,
    });
  }

  // Days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDates.push({
      day: String(day),
      opacity: '',
      isCurrentMonth: true,
    });
  }

  // Days from next month to fill the grid
  const remainingDays = 42 - calendarDates.length;
  for (let day = 1; day <= remainingDays; day++) {
    calendarDates.push({
      day: String(day),
      opacity: 'opacity-40',
      isCurrentMonth: false,
    });
  }

  return (
    <Card className="w-full max-w-[370px] bg-white rounded-2xl shadow-[0px_0px_14.7px_#0000001a] translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]">
      <CardContent className="p-6">
        <header className="flex items-start justify-between mb-6">
          <h2 className="[font-family:'Urbanist',Helvetica] font-bold text-[#19294a] text-[22px] tracking-[0] leading-normal">
            Calendrier
          </h2>
          <Button
            variant="link"
            className="h-auto p-0 flex items-center gap-1 text-[#007aff] [font-family:'Urbanist',Helvetica] font-normal text-[15px] underline hover:no-underline transition-colors"
            onClick={() => navigate(getPath('/learner/calendar'))}
          >
            Voir plus
            <ArrowRight className="w-[15.45px] h-[15.45px]" />
          </Button>
        </header>

        <div className="flex items-center justify-between mb-4">
          <span className="[font-family:'Urbanist',Helvetica] font-medium text-[#19294a] text-xs tracking-[0] leading-[46px]">
            {monthNames[month]}, {year}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0 hover:bg-gray-100 transition-colors"
              onClick={previousMonth}
            >
              <ChevronLeft className="w-4 h-4 text-[#19294a]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0 hover:bg-gray-100 transition-colors"
              onClick={nextMonth}
            >
              <ChevronRight className="w-4 h-4 text-[#19294a]" />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-4">
            {weekDays.map((day, index) => (
              <div
                key={`weekday-${index}`}
                className="flex items-center justify-center [font-family:'Urbanist',Helvetica] font-semibold text-[#aeaeae] text-[10px] text-center tracking-[0] leading-normal"
              >
                {day.label}
              </div>
            ))}
          </div>

          <div className="w-full h-px bg-gray-200" />

          <div className="relative">
            <div className="grid grid-cols-7 gap-y-[35px] gap-x-4">
              {calendarDates.map((date, index) => (
                <div
                  key={`date-${index}`}
                  className={`flex items-center justify-center [font-family:'Urbanist',Helvetica] font-semibold text-[#19294a] text-xs text-right tracking-[0] leading-normal ${date.opacity} hover:bg-gray-100 rounded-full w-6 h-6 cursor-pointer transition-colors`}
                >
                  {date.day}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

