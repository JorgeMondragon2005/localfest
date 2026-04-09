export default function ChatBot({ negocioNombre }: { negocioId: string; negocioNombre: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 13, color: "gray" }}>
      Chat próximamente — {negocioNombre}
    </div>
  );
}