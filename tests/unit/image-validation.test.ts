import { describe, expect, it } from "vitest";

import { detectImageKind, validateImageUpload } from "@/lib/storage/image-validation";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
const GIF = new TextEncoder().encode("GIF89a......");
const SVG = new TextEncoder().encode(
  '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
);

describe("detectImageKind", () => {
  it("recognises the supported formats from their bytes", () => {
    expect(detectImageKind(PNG)?.contentType).toBe("image/png");
    expect(detectImageKind(JPEG)?.extension).toBe("jpg");
    expect(detectImageKind(WEBP)?.contentType).toBe("image/webp");
    expect(detectImageKind(GIF)?.contentType).toBe("image/gif");
  });

  it("refuses SVG and anything else", () => {
    expect(detectImageKind(SVG)).toBeNull();
    expect(detectImageKind(new Uint8Array([1, 2, 3]))).toBeNull();
  });
});

describe("validateImageUpload", () => {
  it("trusts the bytes, not the declared type", async () => {
    const disguised = new File([SVG], "logo.png", { type: "image/png" });
    await expect(validateImageUpload(disguised)).rejects.toMatchObject({ code: "VALIDATION" });

    const realPng = new File([PNG], "logo.txt", { type: "text/plain" });
    await expect(validateImageUpload(realPng)).resolves.toMatchObject({
      contentType: "image/png",
      extension: "png",
    });
  });

  it("enforces the size limit", async () => {
    const big = new File([PNG, new Uint8Array(2048)], "big.png", { type: "image/png" });
    await expect(validateImageUpload(big, { maxBytes: 1024 })).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });

  it("rejects empty and missing files", async () => {
    await expect(validateImageUpload(new File([], "empty.png"))).rejects.toMatchObject({
      code: "VALIDATION",
    });
    await expect(validateImageUpload(null)).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(validateImageUpload("not a file")).rejects.toMatchObject({ code: "VALIDATION" });
  });
});
