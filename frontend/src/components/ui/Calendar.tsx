"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";

export interface CalendarProps {
  className?: string;
  showOutsideDays?: boolean;
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  isAvailableDate?: (date: Date) => boolean;
  isUnavailableDate?: (date: Date) => boolean;
  weekStart?: "monday" | "sunday";
  fromYear?: number;
  toYear?: number;
}

const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  (
    {
      className,
      showOutsideDays = true,
      selected,
      onSelect,
      disabled,
      isAvailableDate,
      isUnavailableDate,
      weekStart = "monday",
      fromYear = 1900,
      toYear = new Date().getFullYear(),
      ...props
    },
    ref,
  ) => {
    const [currentMonth, setCurrentMonth] = React.useState(() => {
      if (selected) return selected;
      return new Date();
    });

    const [currentYear, setCurrentYear] = React.useState(() => {
      if (selected) return selected.getFullYear();
      return new Date().getFullYear();
    });

    const [showYearPicker, setShowYearPicker] = React.useState(false);
    const [showMonthPicker, setShowMonthPicker] = React.useState(false);

    const monthNames = [
      "Január",
      "Február",
      "Március",
      "Április",
      "Május",
      "Június",
      "Július",
      "Augusztus",
      "Szeptember",
      "Október",
      "November",
      "December",
    ];

    const dayNames =
      weekStart === "monday"
        ? ["H", "K", "Sze", "Cs", "P", "Szo", "V"]
        : ["V", "H", "K", "Sze", "Cs", "P", "Szo"];

    const daysInMonth = (year: number, month: number) =>
      new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) =>
      new Date(year, month, 1).getDay();

    const generateCalendarDays = () => {
      const year = currentYear;
      const month = currentMonth.getMonth();
      const daysCount = daysInMonth(year, month);
      const firstDay = firstDayOfMonth(year, month);
      const startDay = weekStart === "monday" ? (firstDay + 6) % 7 : firstDay;

      const days = [];

      // Previous month days
      if (showOutsideDays) {
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        const prevMonthDays = daysInMonth(prevYear, prevMonth);

        for (let i = startDay - 1; i >= 0; i--) {
          days.push({
            date: new Date(prevYear, prevMonth, prevMonthDays - i),
            isCurrentMonth: false,
            isToday: false,
          });
        }
      }

      // Current month days
      for (let day = 1; day <= daysCount; day++) {
        const date = new Date(year, month, day);
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();

        days.push({
          date,
          isCurrentMonth: true,
          isToday,
        });
      }

      // Next month days
      if (showOutsideDays) {
        const totalCells = Math.ceil(days.length / 7) * 7;
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;

        for (let day = 1; days.length < totalCells; day++) {
          days.push({
            date: new Date(nextYear, nextMonth, day),
            isCurrentMonth: false,
            isToday: false,
          });
        }
      }

      return days;
    };

    const goToPreviousMonth = () => {
      if (currentMonth.getMonth() === 0) {
        if (currentYear > fromYear) {
          setCurrentMonth(new Date(currentYear - 1, 11, 1));
          setCurrentYear(currentYear - 1);
        }
      } else {
        setCurrentMonth(new Date(currentYear, currentMonth.getMonth() - 1, 1));
      }
    };

    const goToNextMonth = () => {
      if (currentMonth.getMonth() === 11) {
        if (currentYear < toYear) {
          setCurrentMonth(new Date(currentYear + 1, 0, 1));
          setCurrentYear(currentYear + 1);
        }
      } else {
        setCurrentMonth(new Date(currentYear, currentMonth.getMonth() + 1, 1));
      }
    };

    const selectDate = (date: Date) => {
      if (disabled && disabled(date)) return;
      onSelect?.(date);
    };

    const selectYear = (year: number) => {
      setCurrentYear(year);
      setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
      setShowYearPicker(false);
    };

    const selectMonth = (monthIndex: number) => {
      setCurrentMonth(new Date(currentYear, monthIndex, 1));
      setShowMonthPicker(false);
    };

    const generateYearOptions = () => {
      const years = [];
      for (let year = fromYear; year <= toYear; year++) {
        years.push(year);
      }
      return years.reverse(); // Show recent years first
    };

    const yearOptions = generateYearOptions();

    const days = generateCalendarDays();

    return (
      <div className={cn("p-3", className)} ref={ref} {...props}>
        <div className="space-y-4">
          <div className="relative">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="icon"
                type="button"
                className="h-7 w-7 cursor-pointer"
                onClick={goToPreviousMonth}
                disabled={
                  currentYear === fromYear && currentMonth.getMonth() === 0
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center space-x-2">
                <Popover
                  open={showMonthPicker}
                  onOpenChange={setShowMonthPicker}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      type="button"
                      className="text-sm font-medium px-2 py-1 h-auto hover:bg-gray-100"
                    >
                      {monthNames[currentMonth.getMonth()]}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="center">
                    <div className="grid grid-cols-3 gap-1">
                      {monthNames.map((month, index) => (
                        <Button
                          key={month}
                          variant="ghost"
                          size="sm"
                          type="button"
                          className={cn(
                            "text-xs p-2 h-8",
                            index === currentMonth.getMonth() &&
                              "bg-accent text-white",
                          )}
                          onClick={() => selectMonth(index)}
                        >
                          {month}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover open={showYearPicker} onOpenChange={setShowYearPicker}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      type="button"
                      className="text-sm font-medium px-2 py-1 h-auto hover:bg-gray-100"
                    >
                      {currentYear}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-32 p-2 max-h-64 overflow-y-auto"
                    align="center"
                  >
                    <div className="space-y-1">
                      {yearOptions.map((year) => (
                        <Button
                          key={year}
                          variant="ghost"
                          size="sm"
                          type="button"
                          className={cn(
                            "w-full justify-start text-sm p-2 h-8",
                            year === currentYear && "bg-accent text-white",
                          )}
                          onClick={() => selectYear(year)}
                        >
                          {year}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                variant="outline"
                size="icon"
                type="button"
                className="h-7 w-7 cursor-pointer"
                onClick={goToNextMonth}
                disabled={
                  currentYear === toYear && currentMonth.getMonth() === 11
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {dayNames.map((day) => (
                      <th
                        key={day}
                        className="text-xs font-normal text-gray-500 p-1"
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: Math.ceil(days.length / 7) }).map(
                    (_, weekIndex) => (
                      <tr key={weekIndex}>
                        {days
                          .slice(weekIndex * 7, (weekIndex + 1) * 7)
                          .map((day, dayIndex) => {
                            const isSelected =
                              selected &&
                              day.date.toDateString() ===
                                selected.toDateString();
                            const isDisabled = disabled && disabled(day.date);
                            const isAvailable =
                              Boolean(isAvailableDate?.(day.date)) &&
                              !isDisabled &&
                              day.isCurrentMonth;
                            const isUnavailable =
                              Boolean(isUnavailableDate?.(day.date)) &&
                              !isDisabled &&
                              day.isCurrentMonth;

                            return (
                              <td key={dayIndex} className="p-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => selectDate(day.date)}
                                  disabled={isDisabled}
                                  className={cn(
                                    "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-normal transition-colors",
                                    "hover:bg-gray-100 hover:text-gray-900",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                                    day.isCurrentMonth
                                      ? "text-gray-900"
                                      : "text-gray-400",
                                    isSelected &&
                                      "bg-accent text-white hover:bg-accent",
                                    day.isToday &&
                                      !isSelected &&
                                      "bg-gray-100 text-accent font-semibold",
                                    isAvailable &&
                                      !isSelected &&
                                      "ring-1 ring-accent/35",
                                    isUnavailable &&
                                      !isSelected &&
                                      "bg-amber-100 text-amber-800 ring-1 ring-amber-300",
                                    isDisabled &&
                                      "text-gray-300 cursor-not-allowed hover:bg-transparent",
                                  )}
                                >
                                  {day.date.getDate()}
                                </button>
                              </td>
                            );
                          })}
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

Calendar.displayName = "Calendar";

export { Calendar };
