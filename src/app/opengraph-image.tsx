import { ImageResponse } from "next/og";

export const alt = "Operiq - Your business. One intelligent workspace.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#101318",
        color: "#f4f6f8",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "#0f6f78",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div style={{ width: 30, height: 30, borderRadius: 999, border: "5px solid #f7fdfd" }} />
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              width: 11,
              height: 11,
              borderRadius: 999,
              background: "#f7fdfd",
            }}
          />
        </div>
        <div style={{ fontSize: 40, fontWeight: 700 }}>Operiq</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1, letterSpacing: -2 }}>
          Your business. One intelligent workspace.
        </div>
        <div style={{ fontSize: 30, color: "#a3acb9", lineHeight: 1.4 }}>
          CRM, projects, finance, documents and an AI agent that acts only with your approval.
        </div>
      </div>
      <div
        style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#7dd3d8" }}
      >
        <span>AI business command center</span>
        <span style={{ color: "#a3acb9" }}>Built by Ehan Siddique</span>
      </div>
    </div>,
    size,
  );
}
