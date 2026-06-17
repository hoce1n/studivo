"use client";

import * as React from "react";
import { CalendarIcon, Loader } from "lucide-react";
import { format } from "date-fns-jalali";

import { reserveSeat } from "@/app/actions/actions";
import { ActionForm } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

function getDefaultEndDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  date.setHours(23, 59, 59, 999);
  return date;
}

export function ReserveForm({
  maxSeats,
  open,
  seatNumber,
  onOpenChange,
}: {
  maxSeats: number;
  open: boolean;
  seatNumber: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [date, setDate] = React.useState<Date | undefined>(getDefaultEndDate);

  const handleDateChange = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const adjustedDate = new Date(selectedDate);
      adjustedDate.setHours(23, 59, 59, 999);
      setDate(adjustedDate);
    } else {
      setDate(undefined);
    }
  };

  const handleSuccess = () => {
    setDate(getDefaultEndDate());
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-right">رزرو سریع صندلی</SheetTitle>
          <SheetDescription className="text-right">
            شماره صندلی از نقشه پر شده است؛ ابتدا تلفن دانش‌آموز را وارد کنید.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 pb-6">
          <ActionForm
            key={seatNumber ?? "empty"}
            action={reserveSeat}
            successMessage="رزرو صندلی با موفقیت ثبت شد."
            resetOnSuccess
            onSuccess={handleSuccess}
          >
            {(pending) => (
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="phoneNumber">شماره تلفن</FieldLabel>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    inputMode="tel"
                    placeholder="09123456789"
                    autoFocus
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="memberName">نام دانش‌آموز</FieldLabel>
                  <Input
                    id="memberName"
                    name="memberName"
                    placeholder="نام و نام خانوادگی"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="seatNumber">شماره صندلی</FieldLabel>
                  <Input
                    id="seatNumber"
                    name="seatNumber"
                    type="number"
                    min="1"
                    max={maxSeats}
                    value={seatNumber ?? ""}
                    readOnly
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="endDate">تاریخ پایان اشتراک</FieldLabel>
                  <input
                    id="endDate"
                    type="hidden"
                    name="endDate"
                    value={date ? date.toISOString() : ""}
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-right font-normal",
                          !date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                        {date ? (
                          format(date, "yyyy/MM/dd")
                        ) : (
                          <span>انتخاب تاریخ تمدید</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        className="w-full"
                        mode="single"
                        selected={date}
                        onSelect={handleDateChange}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </Field>
                <Button type="submit" disabled={pending || !seatNumber}>
                  {pending ? <Loader className="animate-spin" /> : "رزرو"}
                </Button>
              </FieldGroup>
            )}
          </ActionForm>
        </div>
      </SheetContent>
    </Sheet>
  );
}
