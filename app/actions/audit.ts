import { revalidatePath } from "next/cache";

export type ActionResult<T = unknown> = {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
};

export function actionError<T = unknown>(error: unknown, fallback: string): ActionResult<T> {
  if (error instanceof Error && error.message.trim()) {
    return { success: false, error: error.message };
  }

  return { success: false, error: fallback };
}

export function revalidateOperationalPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/logs");
}
