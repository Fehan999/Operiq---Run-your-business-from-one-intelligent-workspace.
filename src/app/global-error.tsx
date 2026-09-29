"use client";

import { useEffect } from "react";

import "./globals.css";

// Last resort when the root layout itself fails, so it renders its own html and body.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-4 text-center font-sans text-foreground">
        <h1 className="text-2xl font-semibold">Operiq is having trouble loading</h1>
        <p className="max-w-sm text-muted-foreground">Please try again in a moment.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
