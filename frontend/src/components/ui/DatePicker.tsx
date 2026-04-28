"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Calendar } from "@/components/ui/Calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { Separator } from "@/components/ui/Separator";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  isAvailableDate?: (date: Date) => boolean;
  fromYear?: number;
  toYear?: number;
  className?: string;
  required?: boolean;
}

export function DatePicker({
  selected,
  onSelect,
  placeholder = "Válasszon dátumot",
  disabled,
  isAvailableDate,
  fromYear,
  toYear,
  className,
  required,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const clearSelection = () => {
    onSelect?.(undefined);
    setOpen(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10 px-3 py-2",
            "border-gray-300 bg-white hover:bg-gray-50",
            "focus:outline-none focus:ring-accent focus:border-accent",
            !selected && "text-gray-500",
            className,
          )}
          aria-required={required}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? formatDate(selected) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          selected={selected}
          onSelect={(date) => {
            onSelect?.(date);
            setOpen(false);
          }}
          disabled={disabled}
          isAvailableDate={isAvailableDate}
          fromYear={fromYear}
          toYear={toYear}
        />
        {selected && (
          <>
            <Separator />
            <div className="p-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={clearSelection}
              >
                Törlés
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
