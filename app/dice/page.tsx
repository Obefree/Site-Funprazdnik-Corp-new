import { DiceDraftGame } from "./DiceDraftGame";

export default function DicePage() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return (
    <>
      <a
        href={`${basePath}/dice/ai/`}
        style={{
          position: "fixed",
          right: 14,
          top: 14,
          zIndex: 1000,
          borderRadius: 999,
          padding: "10px 14px",
          background: "#f59e0b",
          color: "#111827",
          fontWeight: 900,
          textDecoration: "none",
          boxShadow: "0 10px 30px rgba(0,0,0,.28)",
        }}
      >
        ⚙ Играть против ИИ · v0.4
      </a>
      <DiceDraftGame />
    </>
  );
}
