"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/errors";
import { cn } from "@/lib/utils";

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";
const MAX_BYTES = 2 * 1024 * 1024;

/**
 * Upload control for a single image. It does a quick size and type check in the browser
 * to save a round trip, but the server validates the bytes again before storing anything.
 */
export function ImageUpload({
  value,
  fallback,
  shape = "square",
  label,
  description = "PNG, JPG, WebP or GIF, up to 2 MB.",
  onUpload,
  onRemove,
  disabled,
}: {
  value: string | null;
  fallback: React.ReactNode;
  shape?: "square" | "circle";
  label: string;
  description?: string;
  onUpload: (formData: FormData) => Promise<ActionResult<{ [key: string]: string | null }>>;
  onRemove?: () => Promise<ActionResult<{ [key: string]: string | null }>>;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value);
  const [pending, startTransition] = useTransition();

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!ACCEPT.split(",").includes(file.type)) {
      toast.error("Upload a PNG, JPG, WebP or GIF image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Images must be 2 MB or smaller.");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    const previous = preview;
    setPreview(localUrl);

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const result = await onUpload(formData);
      URL.revokeObjectURL(localUrl);
      if (result.ok) {
        const url = Object.values(result.data)[0] ?? null;
        setPreview(url);
        toast.success(result.message ?? "Image uploaded.");
      } else {
        setPreview(previous);
        toast.error(result.error);
      }
    });
  }

  function handleRemove() {
    if (!onRemove) return;
    startTransition(async () => {
      const result = await onRemove();
      if (result.ok) {
        setPreview(null);
        toast.success(result.message ?? "Image removed.");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className={cn(
          "relative flex size-16 shrink-0 items-center justify-center overflow-hidden border bg-muted",
          shape === "circle" ? "rounded-full" : "rounded-xl",
          pending && "opacity-60",
        )}
      >
        {preview ? (
          // Plain img: the source can be a local blob URL during upload.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="size-full object-cover" />
        ) : (
          fallback
        )}
      </div>
      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            loading={pending}
            disabled={disabled}
          >
            {pending ? null : <ImagePlus aria-hidden />}
            {preview ? "Replace" : label}
          </Button>
          {preview && onRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={pending || disabled}
            >
              <Trash2 aria-hidden />
              Remove
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-label={label}
          onChange={(event) => {
            handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
