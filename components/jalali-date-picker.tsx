"use client";

import * as React from "react";
import { format } from "date-fns-jalali";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function toLocalDateParam(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  const year = normalized.getFullYear();
  const month = String(normalized.getMonth() + 1).padStart(2, "0");
  const day = String(normalized.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type JalaliDatePickerProps = {
  id?: string;
  name?: string;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  className?: string;
  buttonClassName?: string;
};

export function JalaliDatePicker({
  id,
  name,
  value,
  onChange,
  placeholder = "انتخاب تاریخ",
  disabled,
  className,
  buttonClassName,
}: JalaliDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Date | undefined>(value);

  React.useEffect(() => {
    setSelected(value);
  }, [value]);

  const handleSelect = (date: Date | undefined) => {
    setSelected(date);
    onChange?.(date);
    if (date) setOpen(false);
  };

  return (
    <div className={className}>
      {name && selected ? <input type="hidden" name={name} value={toLocalDateParam(selected)} /> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-right font-normal",
              !selected && "text-muted-foreground",
              buttonClassName,
            )}
          >
            <CalendarIcon className="ml-2 size-4 opacity-50" />
            {selected ? format(selected, "yyyy/MM/dd") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar className="w-full" mode="single" selected={selected} onSelect={handleSelect} disabled={disabled} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
