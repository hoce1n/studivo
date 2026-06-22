"use client";

import * as React from "react";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getActionErrorMessage, isNextNavigationError } from "@/lib/action-errors";
import { cn } from "@/lib/utils";

type ServerActionResult = {
  success?: boolean;
  error?: string;
  message?: string;
};

function isServerActionResult(value: unknown): value is ServerActionResult {
  return typeof value === "object" && value !== null && "success" in value;
}

type ActionFormProps = Omit<React.ComponentProps<"form">, "action" | "children" | "onSubmit"> & {
  action: (formData: FormData) => Promise<unknown>;
  children: React.ReactNode | ((pending: boolean) => React.ReactNode);
  errorTitle?: string;
  resetOnSuccess?: boolean;
  successMessage?: string;
  onSuccess?: () => void;
};

export function ActionForm({
  action,
  children,
  className,
  errorTitle = "خطا در انجام عملیات",
  resetOnSuccess = false,
  successMessage,
  onSuccess,
  ...props
}: ActionFormProps) {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setErrorMessage(null);
    startTransition(async () => {
      try {
        const result = await action(formData);

        if (isServerActionResult(result) && result.success === false) {
          const message = result.error || "انجام عملیات ناموفق بود.";
          setErrorMessage(message);
          toast.error(message);
          return;
        }

        if (resetOnSuccess) {
          form.reset();
        }
        const resolvedSuccessMessage =
          isServerActionResult(result) && result.message
            ? result.message
            : successMessage;

        if (resolvedSuccessMessage) {
          toast.success(resolvedSuccessMessage);
        }
        onSuccess?.();
      } catch (error) {
        if (isNextNavigationError(error)) {
          throw error;
        }

        const message = getActionErrorMessage(error);
        setErrorMessage(message);
        toast.error(message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)} {...props}>
      {errorMessage ? (
        <Alert variant="destructive">
          <ShieldAlert />
          <AlertTitle>{errorTitle}</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}
      {typeof children === "function" ? children(pending) : children}
    </form>
  );
}
