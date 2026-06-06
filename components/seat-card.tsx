"use client"

import * as React from "react"
import { Armchair, Phone, User, CalendarClock } from "lucide-react"

import { releaseSeat } from "@/app/actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type SeatCardProps = {
  seatNumber: string
  statusLabel: string
  className: string
  dotClass: string
  subscription?: {
    id: string
    memberName: string
    phoneNumber: string
    endDate: string
  }
}

export function SeatCard({
  seatNumber,
  statusLabel,
  className,
  dotClass,
  subscription,
}: SeatCardProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [pending, startTransition] = React.useTransition()

  function handleRelease() {
    if (!subscription) return
    startTransition(async () => {
      await releaseSeat(subscription.id)
      setConfirmOpen(false)
    })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex flex-col rounded-2xl border p-3 text-right transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            className,
          )}
          aria-label={`جزئیات صندلی ${seatNumber} — ${statusLabel}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 font-bold">
              <Armchair className="size-3.5 opacity-70" />
              صندلی {seatNumber}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium">
              <span className={cn("size-1.5 rounded-full", dotClass)} aria-hidden />
              {statusLabel}
            </span>
          </div>
          {subscription ? (
            <div className="mt-3 space-y-1 text-xs leading-6">
              <p className="truncate font-medium">{subscription.memberName}</p>
              <p className="opacity-80">تا {subscription.endDate}</p>
            </div>
          ) : (
            <p className="mt-3 text-xs leading-6 opacity-80">برای مشاهده جزئیات کلیک کنید.</p>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="center" className="gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-base font-bold">
            <Armchair className="size-4 opacity-70" />
            صندلی {seatNumber}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-1 text-xs font-medium">
            <span className={cn("size-1.5 rounded-full", dotClass)} aria-hidden />
            {statusLabel}
          </span>
        </div>

        {subscription ? (
          <>
            <div className="space-y-2 rounded-2xl bg-muted/50 p-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="size-4 shrink-0 text-muted-foreground" />
                <span className="font-medium">{subscription.memberName}</span>
              </div>
              <div className="flex items-center gap-2" dir="ltr">
                <Phone className="size-4 shrink-0 text-muted-foreground" />
                <span className="font-mono">{subscription.phoneNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarClock className="size-4 shrink-0 text-muted-foreground" />
                <span>پایان اشتراک: {subscription.endDate}</span>
              </div>
            </div>

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  تخلیه دستی
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogMedia className="text-destructive">
                    <Armchair />
                  </AlertDialogMedia>
                  <AlertDialogTitle>تخلیه صندلی {seatNumber}؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    اشتراک فعال {subscription.memberName} لغو می‌شود و این صندلی خالی خواهد شد. این عمل قابل بازگشت نیست.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={pending}>انصراف</AlertDialogCancel>
                  <Button
                    variant="destructive"
                    onClick={(event) => {
                      event.preventDefault()
                      handleRelease()
                    }}
                    disabled={pending}
                  >
                    {pending ? "در حال تخلیه…" : "بله، تخلیه کن"}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <p className="rounded-2xl border border-dashed p-3 text-center text-xs leading-6 text-muted-foreground">
            این صندلی خالی است. برای پذیرش، شماره آن را در فرم رزرو وارد کنید.
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}
