"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function WorkspaceError({
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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
      <span className="mb-4 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlert className="size-5" aria-hidden />
      </span>
      <h2 className="text-base font-semibold">This page couldn&apos;t load</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Something went wrong on our side. Your data is safe. Try again, and if it keeps happening,
        share this reference with support.
      </p>
      {error.digest ? (
        <code className="mt-3 rounded bg-muted px-2 py-1 font-mono text-xs">{error.digest}</code>
      ) : null}
      <Button className="mt-5" variant="outline" onClick={reset}>
        <RotateCcw aria-hidden />
        Try again
      </Button>
    </div>
  );
}
