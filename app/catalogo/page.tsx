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
  { key: "todos", label: "Sector" },
  { key: "restaurante", label: "Gastronomía" },
  { key: "hospedaje", label: "Descanso" },
  { key: "artesanias", label: "Cultura" },
  { key: "entretenimiento", label: "Vida Nocturna" },
];

export default function RadarView() {
  const router = useRouter();
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [filtro, setFiltro] = useState<Categoria>("todos");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("https://localfest.vercel.app/api/negocios")
      .then((r) => r.json())
      .then((data) => {
        // Ordenar primero los que tienen mensaje_flash (Alta prioridad en tiempo real)
        const sorted = data.sort((a: Negocio, b: Negocio) => {
          if (a.mensaje_flash && !b.mensaje_flash) return -1;
          if (!a.mensaje_flash && b.mensaje_flash) return 1;
          return 0;
        });
        setNegocios(sorted);
        setCargando(false);
      })
      .catch(() => setCargando(false));
  }, []);

  const negociosFiltrados = filtro === "todos"
    ? negocios
    : negocios.filter((n) => n.categoria === filtro);

  return (
    <div className="relative min-h-screen overflow-hidden text-white font-sans selection:bg-[#1D9E75] selection:text-white pb-32">
      {/* Background Radar Elements */}
      <div className="radar-grid"></div>
      <div className="radar-bg"></div>
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-[#090e17]/50 to-[#090e17] pointer-events-none z-0"></div>

      {/* Header Overlay */}
      <div className="relative z-10 px-6 pt-10 pb-4 backdrop-blur-md bg-[#090e17]/80 border-b border-[#1D9E75]/20">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight text-white neon-text-green">Local</span>
              <span className="text-2xl font-bold tracking-tight text-[#D85A30] neon-text-orange">Fest</span>
            </div>
            <div className="text-xs text-[#1D9E75] font-mono tracking-widest mt-1 opacity-80 uppercase">
              Radar de Disponibilidad
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1D9E75] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#1D9E75]"></span>
            </span>
            <span className="text-xs font-mono text-[#1D9E75]">CDMX LIVE</span>
          </div>
        </div>

        {/* Dynamic Filters */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2" style={{scrollbarWidth: 'none'}}>
          {CATEGORIAS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFiltro(key)}
              className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 whitespace-nowrap border ${
                filtro === key 
                  ? "bg-[#1D9E75] border-[#1D9E75] text-white shadow-[0_0_15px_rgba(29,158,117,0.5)]" 
                  : "bg-transparent border-[#1D9E75]/30 text-white/70 hover:bg-[#1D9E75]/10 hover:border-[#1D9E75]/50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed Content */}
      <div className="relative z-10 px-4 pt-6 flex flex-col gap-5">
        {cargando ? (
          <div className="text-center font-mono text-[#1D9E75] animate-pulse py-20 flex flex-col items-center">
            <svg className="w-10 h-10 animate-spin mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/>
              <path d="M12 2a10 10 0 0 1 10 10"/>
            </svg>
            ESCANEA EL ÁREA...
          </div>
        ) : (
          negociosFiltrados.map((negocio) => (
            <div 
              key={negocio.id}
              onClick={() => router.push(`/negocios/${negocio.id}`)}
              className="glass-card cursor-pointer rounded-2xl overflow-hidden group"
            >
              {/* Flash Alert Banner */}
              {negocio.mensaje_flash && (
                <div className="flash-banner backdrop-blur-sm px-4 py-3 flex items-start gap-3">
                  <div className="text-white animate-pulse mt-0.5 text-lg">⚡</div>
                  <div>
                    <div className="text-[10px] font-bold text-white uppercase tracking-widest mb-1 opacity-90">Actualización en vivo</div>
                    <div className="text-sm font-semibold text-white leading-snug">"{negocio.mensaje_flash}"</div>
                  </div>
                </div>
              )}

              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-[#1D9E75] transition-colors">{negocio.nombre}</h3>
                  <div className={`status-indicator w-3 h-3 rounded-full shadow-sm ${negocio.disponible ? 'bg-[#1D9E75]' : 'bg-red-500/50'}`}></div>
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-bold tracking-wider text-[#1D9E75] bg-[#1D9E75]/15 px-2 py-1 rounded uppercase">
                    {negocio.categoria}
                  </span>
                  {negocio.direccion && <span className="text-xs text-white/50 truncate max-w-[200px]">📍 {negocio.direccion}</span>}
                </div>

                <div className="flex justify-between items-center mt-3 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-[#EF9F27]">
                    <span>★</span>
                    <span className="text-white/80 font-semibold">{negocio.calificacion?.toFixed(1) || "5.0"}</span>
                  </div>
                  
                  <div className="text-[11px] font-bold uppercase tracking-widest text-[#1D9E75] group-hover:text-[#2dd199] group-hover:translate-x-1 transition-all flex items-center gap-1">
                    Abrir transmisión
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}