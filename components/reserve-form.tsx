"use client";
import { reserveSeat } from "@/app/actions/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import React from "react";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns-jalali";

function defaultEndDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}

export function ReserveForm({ maxSeats }: { maxSeats: number }) {
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 30);
  const [date, setDate] = React.useState<Date | undefined>(defaultDate);

  const handleDateChange = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const adjustedDate = new Date(selectedDate);
      // تنظیم ساعت روی انتهای روز به وقت محلی (ایران)
      adjustedDate.setHours(23, 59, 59, 999);
      setDate(adjustedDate);
    } else {
      setDate(undefined);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>پذیرش و رزرو صندلی</CardTitle>
        <CardDescription>
          برای دانش‌آموز یک User عضو و یک Subscription فعال ساخته می‌شود.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={reserveSeat}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="seatNumber">شماره صندلی</FieldLabel>
              <Input
                id="seatNumber"
                name="seatNumber"
                type="number"
                min="1"
                max={maxSeats}
                placeholder="12"
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
              <FieldLabel htmlFor="phoneNumber">شماره تلفن</FieldLabel>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                inputMode="tel"
                placeholder="09123456789"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="endDate">تاریخ پایان اشتراک</FieldLabel>
              <input
                type="hidden"
                name="endDate"
                value={date ? date.toISOString() : ""}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
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
            <Button type="submit">ثبت رزرو</Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
