"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Categoria = "todos" | "restaurante" | "hospedaje" | "artesanias" | "entretenimiento";

interface Negocio {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  lat: number;
  lng: number;
  disponible: boolean;
  calificacion: number;
  direccion: string;
  mensaje_flash?: string;
  flash_updated_at?: string;
}

const CATEGORIAS: { key: Categoria; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "restaurante", label: "Comida" },
  { key: "hospedaje", label: "Hospedaje" },
  { key: "artesanias", label: "Artesanías" },
  { key: "entretenimiento", label: "Entretenimiento" },
];

const EMOJI: Record<string, string> = {
  restaurante: "🌮",
  hospedaje: "🏨",
  artesanias: "🪆",
  entretenimiento: "🎭",
  default: "⭐",
};

const BG_COLOR: Record<string, string> = {
  restaurante: "#E1F5EE",
  hospedaje: "#E6F1FB",
  artesanias: "#FAEEDA",
  entretenimiento: "#EEEDFE",
  default: "#F1EFE8",
};

function Estrellas({ valor }: { valor: number }) {
  const llenas = Math.floor(valor);
  const vacias = 5 - llenas;
  return (
    <span style={{ fontSize: 11, color: "#EF9F27" }}>
      {"★".repeat(llenas)}{"☆".repeat(vacias)}
      <span style={{ color: "#888780", marginLeft: 4 }}>{valor.toFixed(1)}</span>
    </span>
  );
}

function SkeletonCard() {
  return (
    <div style={{
      background: "white",
      borderRadius: 12,
      border: "0.5px solid #D3D1C7",
      overflow: "hidden",
      animation: "pulse 1.5s ease-in-out infinite",
    }}>
      <div style={{ height: 90, background: "#F1EFE8" }} />
      <div style={{ padding: "8px 10px" }}>
        <div style={{ height: 13, background: "#F1EFE8", borderRadius: 4, width: "70%", marginBottom: 6 }} />
        <div style={{ height: 11, background: "#F1EFE8", borderRadius: 4, width: "50%" }} />
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [filtro, setFiltro] = useState<Categoria>("todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("https://localfest.vercel.app/api/negocios")
      .then((r) => {
        if (!r.ok) throw new Error("Error al cargar");
        return r.json();
      })
      .then((data) => {
        setNegocios(data);
        setCargando(false);
      })
      .catch(() => {
        setError(true);
        setCargando(false);
      });
  }, []);

  const negociosFiltrados = filtro === "todos"
    ? negocios
    : negocios.filter((n) => n.categoria === filtro);

  return (
    <div style={{
      maxWidth: 430,
      margin: "0 auto",
      minHeight: "100dvh",
      background: "#F8F8F5",
      fontFamily: "system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* Header */}
      <div style={{
        background: "white",
        padding: "14px 16px 0",
        borderBottom: "0.5px solid #D3D1C7",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#1D9E75" }}>Local</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#D85A30" }}>Fest</span>
            <span style={{
              fontSize: 10,
              background: "#1D9E75",
              color: "#E1F5EE",
              padding: "2px 8px",
              borderRadius: 20,
              fontWeight: 500,
            }}>Ola México</span>
          </div>
          <span style={{ fontSize: 12, color: "#888780" }}>📍 CDMX</span>
        </div>

        {/* Filtros */}
        <div style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          paddingBottom: 10,
          scrollbarWidth: "none",
        }}>
          {CATEGORIAS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFiltro(key)}
              style={{
                fontSize: 11,
                padding: "5px 12px",
                borderRadius: 20,
                border: filtro === key ? "none" : "0.5px solid #D3D1C7",
                background: filtro === key ? "#1D9E75" : "white",
                color: filtro === key ? "#E1F5EE" : "#5F5E5A",
                whiteSpace: "nowrap",
                cursor: "pointer",
                fontWeight: filtro === key ? 500 : 400,
                flexShrink: 0,
                transition: "all 0.15s ease",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Pasaporte de Impacto (Gamificación Prototype) */}
      <div style={{ margin: "10px 16px", background: "#E1F5EE", border: "1px solid #1D9E75", padding: "12px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); alert("Modo Scanner Activado. Escaneando QR Local..."); }}>
        <div>
          <div style={{fontSize: 14, fontWeight: 700, color: "#0F6E56"}}>Pasaporte Aliado 🌟</div>
          <div style={{fontSize: 11, color: "#1D9E75", marginTop: 2}}>0/3 sellos para tu premio</div>
        </div>
        <div style={{background: "#0F6E56", color: "white", padding: "6px 14px", borderRadius: "20px", fontSize: 12, fontWeight: "bold", border: "none"}}>
          📸 Escanear
        </div>
      </div>

      {/* Contador */}
      <div style={{ padding: "10px 16px 4px", fontSize: 12, color: "#888780" }}>
        {cargando ? "Buscando negocios cerca de ti..." : `${negociosFiltrados.length} negocios verificados cerca de ti`}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          margin: "12px 16px",
          padding: "12px",
          background: "#FCEBEB",
          borderRadius: 10,
          fontSize: 13,
          color: "#A32D2D",
          textAlign: "center",
        }}>
          No se pudieron cargar los negocios. Intenta de nuevo.
        </div>
      )}

      {/* Cards */}
      <div style={{
        padding: "8px 12px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        flex: 1,
      }}>
        {cargando
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : negociosFiltrados.map((negocio) => {
              const emoji = EMOJI[negocio.categoria] ?? EMOJI.default;
              const bg = BG_COLOR[negocio.categoria] ?? BG_COLOR.default;
              return (
                <div
                  key={negocio.id}
                  onClick={() => router.push(`/negocios/${negocio.id}`)}
                  style={{
                    background: "white",
                    borderRadius: 12,
                    border: "0.5px solid #D3D1C7",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "transform 0.1s ease, box-shadow 0.1s ease",
                  }}
                  onMouseDown={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "scale(0.98)";
                  }}
                  onMouseUp={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
                  }}
                >
                  {/* Imagen */}
                  <div style={{
                    height: 90,
                    background: bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 32,
                  }}>
                    {emoji}
                  </div>

                  {/* Cuerpo */}
                  <div style={{ padding: "8px 10px" }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#2C2C2A" }}>
                      {negocio.nombre}
                    </div>
                    {negocio.mensaje_flash ? (
                      <div style={{ fontSize: 13, color: "#0F6E56", fontWeight: 700, marginTop: 4, background: "#E1F5EE", padding: "4px 8px", borderRadius: 6, display: "inline-block" }}>
                        ⚡ {negocio.mensaje_flash}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: "#888780", marginTop: 2 }}>
                        {negocio.categoria.charAt(0).toUpperCase() + negocio.categoria.slice(1)}
                        {negocio.direccion ? ` · ${negocio.direccion}` : ""}
                      </div>
                    )}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: 6,
                    }}>
                      <Estrellas valor={negocio.calificacion ?? 5} />
                      <span style={{
                        fontSize: 10,
                        color: negocio.disponible ? "#1D9E75" : "#A32D2D",
                        fontWeight: 500,
                      }}>
                        {negocio.disponible ? "Abierto ahora" : "Cerrado"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

        {/* Sin resultados */}
        {!cargando && !error && negociosFiltrados.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "#888780",
            fontSize: 13,
          }}>
            No hay negocios en esta categoría todavía.
          </div>
        )}
      </div>
    </div>
  );
}