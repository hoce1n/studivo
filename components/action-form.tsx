"use client";

import * as React from "react";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getActionErrorMessage, isNextNavigationError } from "@/lib/action-errors";
import { cn } from "@/lib/utils";

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
        await action(formData);
        if (resetOnSuccess) {
          form.reset();
        }
        if (successMessage) {
          toast.success(successMessage);
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
