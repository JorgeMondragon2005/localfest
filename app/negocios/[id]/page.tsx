"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ChatBot from "@/components/ChatBot";

// ─── Tipo exacto según la API de Jorge ───────────────────────────────────────
interface Negocio {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  direccion: string;
  lat: number;
  lng: number;
  telefono: string;
  whatsapp: string | null;
  metodos_pago: string | null;
  horario: string | null;
  disponible: boolean;
  calificacion: number;
  imagen_url: string | null;
  created_at: string;
}

// ─── Colores y emojis por categoría ──────────────────────────────────────────
const CAT_BG: Record<string, string> = {
  restaurante:     "#E1F5EE",
  hospedaje:       "#E6F1FB",
  artesanias:      "#FAEEDA",
  entretenimiento: "#EEEDFE",
  servicios:       "#F1EFE8",
};

const CAT_EMOJI: Record<string, string> = {
  restaurante:     "🌮",
  hospedaje:       "🏨",
  artesanias:      "🪆",
  entretenimiento: "🎭",
  servicios:       "🗺️",
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating ?? 0);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ color: "#EF9F27", fontSize: 13 }}>
        {"★".repeat(full)}{"☆".repeat(Math.max(0, 5 - full))}
      </span>
      <span style={{ fontSize: 11, color: "#BA7517", fontWeight: 500 }}>
        {(rating ?? 0).toFixed(1)}
      </span>
    </div>
  );
}

function InfoPill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 10,
      background: "var(--color-background-secondary)",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: 20,
      padding: "3px 8px",
      color: "var(--color-text-secondary)",
    }}>
      {children}
    </span>
  );
}

function Skeleton() {
  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <div style={{ height: 140, background: "var(--color-background-secondary)" }} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {[70, 40, 100, 80, 60].map((w, i) => (
          <div key={i} style={{
            height: i === 0 ? 16 : 11,
            width: `${w}%`,
            background: "var(--color-background-secondary)",
            borderRadius: 4,
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function PerfilNegocio() {
  const params  = useParams();
  const router  = useRouter();
  const id      = params?.id as string;

  const [negocio,  setNegocio]  = useState<Negocio | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`https://localfest.vercel.app/api/negocios/${id}`);
        if (!res.ok) throw new Error("Negocio no encontrado");
        const data: Negocio = await res.json();
        setNegocio(data);
      } catch (e: any) {
        setError(e.message ?? "Error al cargar");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <Skeleton />;

  if (error || !negocio) {
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        minHeight: "100vh", gap: 12, padding: 24,
      }}>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          {error ?? "No encontrado"}
        </p>
        <button
          onClick={() => router.back()}
          style={{
            fontSize: 13, color: "#1D9E75",
            background: "none", border: "none", cursor: "pointer",
          }}
        >
          ← Volver al catálogo
        </button>
      </div>
    );
  }

  // Normaliza la categoría para buscar colores/emojis
  const cat    = negocio.categoria?.toLowerCase() ?? "servicios";
  const bgImg  = CAT_BG[cat]    ?? "#F1EFE8";
  const emoji  = CAT_EMOJI[cat] ?? "📍";

  return (
    <>
      {/* ── Vista principal ───────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 480, margin: "0 auto",
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
        background: "var(--color-background-secondary)",
      }}>

        {/* Barra de navegación */}
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          background: "var(--color-background-primary)",
          borderBottom: "0.5px solid var(--color-border-tertiary)",
          padding: "10px 14px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <button
            onClick={() => router.back()}
            style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "none", border: "none",
              cursor: "pointer", fontSize: 16,
              color: "var(--color-text-primary)",
            }}
          >
            ←
          </button>
          <span style={{
            fontSize: 13, fontWeight: 500,
            color: "var(--color-text-primary)", flex: 1,
          }}>
            {negocio.nombre}
          </span>
          <span style={{
            fontSize: 9, background: "#1D9E75", color: "#E1F5EE",
            padding: "2px 7px", borderRadius: 99, fontWeight: 500,
          }}>
            Verif. Ola México
          </span>
        </div>

        {/* Foto / Banner */}
        <div style={{
          height: 140, background: bgImg,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 52, position: "relative",
        }}>
          {negocio.imagen_url
            ? <img
                src={negocio.imagen_url}
                alt={negocio.nombre}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            : emoji
          }
          {/* Badge disponibilidad */}
          <span style={{
            position: "absolute", bottom: 10, left: 12,
            fontSize: 10, fontWeight: 500,
            padding: "3px 8px", borderRadius: 99,
            background: negocio.disponible ? "#E1F5EE" : "#FCEBEB",
            color:      negocio.disponible ? "#085041" : "#A32D2D",
          }}>
            {negocio.disponible ? "● Disponible ahora" : "● Cerrado"}
          </span>
        </div>

        {/* Cuerpo del perfil */}
        <div style={{
          flex: 1, padding: 14,
          display: "flex", flexDirection: "column", gap: 14,
          background: "var(--color-background-primary)",
        }}>

          {/* Nombre + categoría */}
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)" }}>
              {negocio.nombre}
            </div>
            <div style={{ fontSize: 11, color: "#1D9E75", marginTop: 3 }}>
              {negocio.categoria} · Verificado por Ola México
            </div>
          </div>

          {/* Calificación */}
          <Stars rating={negocio.calificacion} />

          {/* Descripción */}
          {negocio.descripcion && (
            <p style={{
              fontSize: 12, lineHeight: 1.6,
              color: "var(--color-text-secondary)",
            }}>
              {negocio.descripcion}
            </p>
          )}

          {/* Pills de info — solo muestra si tiene dato */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {negocio.horario      && <InfoPill>🕐 {negocio.horario}</InfoPill>}
            {negocio.metodos_pago && <InfoPill>💳 {negocio.metodos_pago}</InfoPill>}
            {negocio.telefono     && <InfoPill>📞 {negocio.telefono}</InfoPill>}
            {negocio.direccion    && <InfoPill>📍 {negocio.direccion}</InfoPill>}
            <InfoPill>Español · English</InfoPill>
          </div>

          {/* Divider */}
          <div style={{ height: "0.5px", background: "var(--color-border-tertiary)" }} />

          {/* Disponibilidad */}
          <div style={{
            background: "var(--color-background-secondary)",
            borderRadius: "var(--border-radius-md)",
            padding: "10px 12px",
            border: "0.5px solid var(--color-border-tertiary)",
          }}>
            <p style={{
              fontSize: 10, fontWeight: 500,
              color: "var(--color-text-secondary)", marginBottom: 4,
            }}>
              Disponibilidad actual
            </p>
            <p style={{ fontSize: 13, color: "var(--color-text-primary)" }}>
              {negocio.disponible ? "Abierto y disponible" : "Cerrado por el momento"}
            </p>
          </div>

          {/* Botón principal */}
          <button
            onClick={() => setShowChat(true)}
            style={{
              width: "100%", padding: "11px 0",
              background: "#1D9E75", color: "#E1F5EE",
              border: "none", borderRadius: "var(--border-radius-md)",
              fontSize: 13, fontWeight: 500, cursor: "pointer",
            }}
          >
            Reservar o preguntar al asistente
          </button>

          {/* Llamar directamente */}
          {negocio.telefono && (
            <a
              href={`tel:${negocio.telefono}`}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "9px 0",
                border: "0.5px solid var(--color-border-secondary)",
                borderRadius: "var(--border-radius-md)",
                fontSize: 13, color: "var(--color-text-primary)",
                textDecoration: "none",
              }}
            >
              Llamar directamente
            </a>
          )}
        </div>
      </div>

      {/* ── Chatbot (bottom sheet) ────────────────────────────────────────── */}
      {showChat && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", flexDirection: "column", justifyContent: "flex-end",
        }}>
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }}
            onClick={() => setShowChat(false)}
          />
          <div style={{
            position: "relative",
            background: "var(--color-background-primary)",
            borderRadius: "20px 20px 0 0",
            height: "85vh", maxWidth: 480, width: "100%", margin: "0 auto",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            {/* Handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
              <div style={{
                width: 36, height: 4, borderRadius: 99,
                background: "var(--color-border-secondary)",
              }} />
            </div>
            {/* Header del chat */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 14px 10px",
              borderBottom: "0.5px solid var(--color-border-tertiary)",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: bgImg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
              }}>
                {emoji}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>
                  {negocio.nombre}
                </p>
                <p style={{ fontSize: 11, color: "#1D9E75" }}>
                  Asistente LocalFest · en línea
                </p>
              </div>
              <button
                onClick={() => setShowChat(false)}
                style={{
                  background: "none", border: "none",
                  cursor: "pointer", fontSize: 16,
                  color: "var(--color-text-secondary)", padding: 4,
                }}
              >
                ✕
              </button>
            </div>
            {/* Chatbot */}
            <div style={{ flex: 1, overflow: "hidden" }}>
              <ChatBot negocioId={negocio.id} negocioNombre={negocio.nombre} categoria={negocio.categoria} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
