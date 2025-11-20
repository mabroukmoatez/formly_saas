import * as React from "react"
import { cn } from "../../lib/utils"

export interface CalendarProps {
  mode?: "single" | "range" | "multiple";
  selected?: Date | undefined;
  onSelect?: (date: Date | undefined) => void;
  initialFocus?: boolean;
  locale?: any;
  className?: string;
  classNames?: any;
}

function Calendar({
  className,
  selected,
  onSelect,
  locale,
  ...props
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    if (selected) {
      return new Date(selected);
    }
    return new Date();
  });
  
  // Update currentMonth when selected changes
  React.useEffect(() => {
    if (selected) {
      setCurrentMonth(new Date(selected));
    }
  }, [selected]);

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (onSelect) {
      onSelect(newDate);
    }
  };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }, (_, i) => i);

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isSelected = (day: number) => {
    if (!selected) return false;
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return checkDate.toDateString() === selected.toDateString();
  };

  const isToday = (day: number) => {
    const today = new Date();
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return checkDate.toDateString() === today.toDateString();
  };

  return (
    <div className={cn("p-3", className)}>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent"
        >
          ←
        </button>
        <div className="font-medium">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <button
          onClick={nextMonth}
          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent"
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
          <div key={day} className="text-sm font-medium text-center text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((day) => (
          <button
            key={day}
            onClick={() => handleDateClick(day)}
            className={cn(
              "h-9 w-9 p-0 font-normal rounded-md hover:bg-accent hover:text-accent-foreground",
              isSelected(day) && "bg-primary text-primary-foreground",
              isToday(day) && !isSelected(day) && "bg-accent text-accent-foreground"
            )}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }

