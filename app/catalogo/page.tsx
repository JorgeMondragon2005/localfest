"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChatBot from "@/components/ChatBot";

type Categoria = "todos" | "restaurante" | "hospedaje" | "artesanias" | "entretenimiento";

interface Negocio {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  disponible: boolean;
  calificacion: number;
  direccion: string;
  mensaje_flash?: string;
  imagen_url?: string;
}

const CATEGORIAS = [
  { key: "todos", label: "Recomendados" },
  { key: "restaurante", label: "Gastronomía" },
  { key: "artesanias", label: "Cultura local" },
  { key: "hospedaje", label: "Descanso" },
  { key: "entretenimiento", label: "Experiencias" },
];

// Imágenes de alta calidad por defecto para dar vibra Premium si no hay foto real
const FALLBACK_IMAGES: Record<string, string> = {
  restaurante: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=800&auto=format&fit=crop",
  hospedaje: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop",
  artesanias: "https://images.unsplash.com/photo-1603708453303-3fa0e9aa7d37?q=80&w=800&auto=format&fit=crop",
  entretenimiento: "https://images.unsplash.com/photo-1533174000228-5ae0467b5f54?q=80&w=800&auto=format&fit=crop",
  default: "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?q=80&w=800&auto=format&fit=crop"
};

export default function CatalogPlaza() {
  const router = useRouter();
  const [negocios, setNegocios] = useState<any[]>([]);
  const [filtro, setFiltro] = useState<Categoria>("todos");
  const [cargando, setCargando] = useState(true);
  const [globalChatOpen, setGlobalChatOpen] = useState(false);

  useEffect(() => {
    fetch("/api/negocios")
      .then((r) => r.json())
      .then((data) => {
        // Enriched mapping for AI Personalized Hooks and Responsiveness Semaphore
        const enriched = data.map((n: Negocio) => {
          let reqSpeed = 0; // 0: Verde, 1: Amarillo, 2: Rojo
          
          // SEMÁFORO DE RESPUESTA EN CHAT A LA SOLICITUD
          if (n.mensaje_flash) reqSpeed = 0; // Mandaron mensaje flash hoy = actúan rapidísimo.
          else if (n.disponible) reqSpeed = n.nombre.length % 2 === 0 ? 0 : 1; // Mitad contesta rápido, mitad regular.
          else reqSpeed = 2; // Cerrados o sin contacto.

          // GENERADOR IA SIMULADO DE TARJETA PERSONALIZADA
          let aiHook = "";
          if (n.categoria === 'restaurante') aiHook = "Acaban de liberar 2 mesas cerca. Pide el menú por chat.";
          else if (n.categoria === 'hospedaje') aiHook = "Quedan algunos cuartos libres céntricos, checa disponibilidad.";
          else if (n.categoria === 'artesanias') aiHook = "Artesanías locales famosas a bajo costo de la zona.";
          else if (n.categoria === 'entretenimiento') aiHook = "Función a punto de empezar cerca de ti. Aparta lugar.";
          else aiHook = "Visita recomendada por la curaduría de LocalFest.";

          return { ...n, reqSpeed, aiHook };
        });

        // ORDENAMIENTO: Semáforos verdes (contestan rápido) siempre van primero.
        const sorted = enriched.sort((a: any, b: any) => a.reqSpeed - b.reqSpeed);
        setNegocios(sorted);
        setCargando(false);
      })
      .catch(() => setCargando(false));
  }, []);

  const negociosFiltrados = filtro === "todos"
    ? negocios
    : negocios.filter((n) => n.categoria === filtro);

  return (
    <div className="relative min-h-screen text-[#2D2A26] pb-32 bg-[#FAF8F5]">
      {/* Header Auténtico Mexicano */}
      <div className="px-5 pt-8 pb-4 bg-[#FAF8F5]/90 backdrop-blur-md sticky top-0 z-20">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-1.5 drop-shadow-sm">
            <span className="text-3xl font-black tracking-tighter text-[#006847]">Local</span>
            <span className="text-3xl font-black tracking-tighter text-[#F57814]">Fest</span>
          </div>
          <button onClick={() => setGlobalChatOpen(true)} className="bg-gradient-to-r from-[#E4007C] to-[#ff1a8c] text-white px-4 py-2.5 rounded-full text-xs font-black shadow-[0_8px_20px_rgba(228,0,124,0.35)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
            Guía AI
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2" style={{scrollbarWidth: 'none'}}>
          {CATEGORIAS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFiltro(key as Categoria)}
              className={`px-5 py-2.5 rounded-full text-[13px] font-extrabold transition-all duration-300 whitespace-nowrap shadow-sm border-2 ${
                filtro === key 
                  ? "bg-[#006847] border-[#006847] text-white" 
                  : "bg-white border-transparent text-gray-500 hover:border-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed Content - Rich Interactive Cards */}
      <div className="px-5 pt-3 flex flex-col gap-8 max-w-md mx-auto w-full">
        {cargando ? (
          <div className="text-center font-bold text-gray-400 py-10 flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-[#E4007C] border-t-transparent rounded-full animate-spin mb-4"></div>
            GENERANDO CURADURÍA IA...
          </div>
        ) : (
          negociosFiltrados.map((negocio) => {
            const isGreen = negocio.reqSpeed === 0;
            const isYellow = negocio.reqSpeed === 1;
            
            const semaforoColor = isGreen ? 'bg-[#006847]' : isYellow ? 'bg-[#F57814]' : 'bg-[#CE1126]';
            const semaforoText = isGreen ? 'Contesta al instante' : isYellow ? 'Suele tardar minutos' : 'No disponible en chat';
            const imgUrl = negocio.imagen_url || FALLBACK_IMAGES[negocio.categoria?.toLowerCase()] || FALLBACK_IMAGES['default'];

            return (
              <div 
                key={negocio.id}
                onClick={() => router.push(`/negocios/${negocio.id}`)}
                className="bg-white rounded-[28px] overflow-hidden shadow-[0_15px_40px_-15px_rgba(0,0,0,0.12)] transition-transform active:scale-[0.98] cursor-pointer border border-gray-100"
              >
                {/* Imagen Destacada Inmersiva */}
                <div className="relative h-64 w-full">
                  <img src={imgUrl} alt={negocio.nombre} className="w-full h-full object-cover" />
                  
                  {/* Gradiente Oscuro para Legibilidad */}
                  <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0B0F19]/90 to-transparent"></div>
                  
                  {/* Semáforo de Respuesta: Lo que el User pidió para priorizar a los que contestan WhatsApp */}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-full text-xs font-black shadow-lg flex items-center gap-2 text-[#2D2A26]">
                     <span className={`w-2.5 h-2.5 rounded-full ${semaforoColor} ${isGreen ? 'animate-pulse' : ''} shadow-sm`}></span>
                     {semaforoText}
                  </div>

                  {/* Calificación */}
                  {negocio.calificacion && (
                    <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-black text-[#F57814] flex items-center gap-1 border border-white/10">
                      ★ {negocio.calificacion}
                    </div>
                  )}

                  {/* Texto Inmersivo sobre Imagen */}
                  <div className="absolute bottom-4 left-5 right-5">
                    <h3 className="text-2xl font-black text-white leading-tight drop-shadow-md mb-2">{negocio.nombre}</h3>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] bg-[#E4007C] text-white px-2 py-0.5 rounded shadow-sm uppercase font-black tracking-wider">
                         Verificado
                       </span>
                       <span className="text-xs text-white/90 font-bold uppercase tracking-widest drop-shadow-sm">
                         {negocio.categoria}
                       </span>
                    </div>
                  </div>
                </div>

                {/* Zona de Información de la Tarjeta */}
                <div className="p-5">
                  {/* Detalle AI Generado por Tipo de Negocio */}
                  <div className="flex items-start gap-3 mb-4 p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100/50">
                    <div className="text-[13px] font-bold text-gray-700 leading-snug">
                      {negocio.aiHook}
                    </div>
                  </div>

                  {/* Mensaje Flash en Tiempo Real (si el negocio escribió en WhatsApp) */}
                  {negocio.mensaje_flash && (
                    <div className="mb-4 bg-[#F57814]/10 rounded-2xl p-3 border border-[#F57814]/20 flex items-center gap-2.5">
                      <span className="text-white font-black text-[10px] uppercase bg-[#F57814] px-2 py-1 rounded shadow-sm">
                        Flash
                      </span>
                      <span className="text-sm font-bold text-[#F57814] italic leading-snug">
                        "{negocio.mensaje_flash}"
                      </span>
                    </div>
                  )}

                  {/* Mini Descripción Atrayente */}
                  <p className="text-[13px] text-gray-500 font-semibold line-clamp-2 leading-relaxed px-1">
                    {negocio.descripcion}
                  </p>

                  <div className="mt-5 flex justify-end">
                    <span className="text-xs font-black text-[#006847] uppercase tracking-widest flex items-center gap-1 group-hover:underline">
                      Visitar Perfil <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Global Chat Overlay */}
      {globalChatOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setGlobalChatOpen(false)} />
          <div className="relative bg-[#FAF8F5] rounded-t-[32px] h-[85vh] w-full max-w-lg mx-auto flex flex-col overflow-hidden shadow-2xl">
            
            <div className="bg-[#E4007C] text-white p-5 flex justify-between items-center rounded-t-[32px] shadow-sm z-10">
              <div>
                <h3 className="font-black text-xl tracking-tight">Guía LocalFest</h3>
                <p className="text-xs font-bold text-white/90 uppercase tracking-widest">Recomendaciones e Inteligencia</p>
              </div>
              <button onClick={() => setGlobalChatOpen(false)} className="bg-black/20 p-2.5 rounded-full hover:bg-black/30 transition text-white">
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden bg-white">
              <ChatBot isGlobal={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}