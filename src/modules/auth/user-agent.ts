/**
 * A tiny, dependency-free user agent summary for the sessions list. It only needs to be
 * good enough for a person to recognise their own devices.
 */
export function describeUserAgent(userAgent: string | null | undefined): {
  label: string;
  mobile: boolean;
} {
  if (!userAgent) return { label: "Unknown device", mobile: false };

  const ua = userAgent;
  const mobile = /Mobile|Android|iPhone|iPad/i.test(ua);

  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Browser";

  const os = /iPhone|iPad|iPod/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Mac OS X|Macintosh/.test(ua)
        ? "macOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : null;

  return { label: os ? `${browser} on ${os}` : browser, mobile };
}
