import { AppError } from "@/lib/errors";

/*
 * Upload validation for images (logos, avatars).
 *
 * The browser-provided MIME type and file name are not trusted. The first bytes of the
 * file are checked against known signatures, and the stored extension and content type
 * come from that check. SVG is refused on purpose: it can carry scripts.
 */

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

type ImageKind = { contentType: string; extension: string };

const SIGNATURES: Array<{ kind: ImageKind; matches: (bytes: Uint8Array) => boolean }> = [
  {
    kind: { contentType: "image/png", extension: "png" },
    matches: (b) =>
      b.length >= 8 &&
      b[0] === 0x89 &&
      b[1] === 0x50 &&
      b[2] === 0x4e &&
      b[3] === 0x47 &&
      b[4] === 0x0d &&
      b[5] === 0x0a &&
      b[6] === 0x1a &&
      b[7] === 0x0a,
  },
  {
    kind: { contentType: "image/jpeg", extension: "jpg" },
    matches: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    kind: { contentType: "image/webp", extension: "webp" },
    matches: (b) =>
      b.length >= 12 &&
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50,
  },
  {
    kind: { contentType: "image/gif", extension: "gif" },
    matches: (b) =>
      b.length >= 6 &&
      b[0] === 0x47 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x38 &&
      (b[4] === 0x37 || b[4] === 0x39) &&
      b[5] === 0x61,
  },
];

export function detectImageKind(bytes: Uint8Array): ImageKind | null {
  return SIGNATURES.find((signature) => signature.matches(bytes))?.kind ?? null;
}

export interface ValidatedImage {
  bytes: Uint8Array;
  contentType: string;
  extension: string;
  size: number;
}

export async function validateImageUpload(
  file: unknown,
  { maxBytes = MAX_IMAGE_BYTES }: { maxBytes?: number } = {},
): Promise<ValidatedImage> {
  if (!(file instanceof Blob)) {
    throw new AppError("VALIDATION", "Choose an image to upload.");
  }
  if (file.size === 0) {
    throw new AppError("VALIDATION", "That file is empty.");
  }
  if (file.size > maxBytes) {
    const limitMb = (maxBytes / (1024 * 1024)).toFixed(0);
    throw new AppError("VALIDATION", `Images must be ${limitMb} MB or smaller.`);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectImageKind(bytes);
  if (!kind) {
    throw new AppError("VALIDATION", "Upload a PNG, JPG, WebP or GIF image.");
  }

  return {
    bytes,
    contentType: kind.contentType,
    extension: kind.extension,
    size: bytes.byteLength,
  };
}
