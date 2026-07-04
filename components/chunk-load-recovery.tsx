"use client";

import { useEffect } from "react";

const RELOAD_STORAGE_KEY = "studivo:chunk-load-reload-at";
const RELOAD_WINDOW_MS = 30_000;

function isChunkLoadFailure(reason: unknown): boolean {
  const message =
    reason instanceof Error
      ? `${reason.name} ${reason.message}`
      : typeof reason === "string"
        ? reason
        : reason && typeof reason === "object" && "message" in reason
          ? String((reason as { message?: unknown }).message)
          : "";

  return /ChunkLoadError|Loading chunk \d+ failed|failed to fetch dynamically imported module|Importing a module script failed/i.test(
    message,
  );
}

function reloadOnceForFreshBuild() {
  const lastReloadAt = Number(window.sessionStorage.getItem(RELOAD_STORAGE_KEY) ?? 0);

  if (Date.now() - lastReloadAt < RELOAD_WINDOW_MS) {
    return;
  }

  window.sessionStorage.setItem(RELOAD_STORAGE_KEY, String(Date.now()));
  window.location.reload();
}

export function ChunkLoadRecovery() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadFailure(event.reason)) {
        event.preventDefault();
        reloadOnceForFreshBuild();
      }
    };

    const handleError = (event: ErrorEvent) => {
      const failedResource = event.target instanceof HTMLScriptElement ? event.target.src : "";

      if (isChunkLoadFailure(event.error ?? event.message) || failedResource.includes("/_next/static/")) {
        event.preventDefault();
        reloadOnceForFreshBuild();
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError, true);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleError, true);
    };
  }, []);

  return null;
}
