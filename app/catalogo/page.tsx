"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChatBot from "@/components/ChatBot";

type Categoria = "todos" | "restaurante" | "hospedaje" | "artesanias" | "entretenimiento";

interface Negocio {
  id: string;
  nombre: string;
  categoria: string;
  disponible: boolean;
  calificacion: number;
  direccion: string;
  mensaje_flash?: string;
}

const CATEGORIAS = [
  { key: "todos", label: "Cerca de mí" },
  { key: "restaurante", label: "Gastronomía" },
  { key: "artesanias", label: "Cultura local" },
  { key: "hospedaje", label: "Descanso" },
  { key: "entretenimiento", label: "Experiencias" },
];

export default function CatalogPlaza() {
  const router = useRouter();
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [filtro, setFiltro] = useState<Categoria>("todos");
  const [cargando, setCargando] = useState(true);
  const [globalChatOpen, setGlobalChatOpen] = useState(false);

  useEffect(() => {
    fetch("/api/negocios")
      .then((r) => r.json())
      .then((data) => {
        const sorted = data.sort((a: Negocio, b: Negocio) => {
          if (a.mensaje_flash && !b.mensaje_flash) return -1;
          if (!a.mensaje_flash && b.mensaje_flash) return 1;
          if (a.disponible && !b.disponible) return -1;
          if (!a.disponible && b.disponible) return 1;
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
    <div className="relative min-h-screen text-[#2D2A26] pb-32 bg-[#FAF8F5]">
      {/* Header Auténtico Mexicano */}
      <div className="px-5 pt-8 pb-4 bg-[#FAF8F5] sticky top-0 z-20">
        <div className="flex justify-between items-center mb-6 px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-3xl font-black tracking-tighter text-[#006847]">Local</span>
            <span className="text-3xl font-black tracking-tighter text-[#F57814]">Fest</span>
          </div>
          <div className="bg-[#E4007C]/10 text-[#E4007C] px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-[#E4007C]/20">
            📍 Tu Zona
          </div>
        </div>

        {/* Dynamic Filters */}
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

      {/* Feed Content */}
      <div className="px-5 pt-4 flex flex-col gap-6">
        
        {/* Giant Hero Button - The core hackathon action */}
        {filtro === "todos" && (
          <button 
            className="btn-hero w-full py-6 flex flex-col items-center justify-center gap-2 group"
            onClick={() => setGlobalChatOpen(true)}
          >
            <span className="text-xl font-black tracking-tight leading-tight px-4 flex items-center gap-2 text-center">
              Encontrar negocios abiertos<br/> a menos de 5 min
            </span>
          </button>
        )}

        <div className="flex justify-between items-end px-1 mt-2">
          <h2 className="text-xl font-black text-[#2D2A26] tracking-tight">Status Radar</h2>
          <span className="text-xs font-bold text-[#006847] bg-[#006847]/10 px-2.5 py-1 rounded-md uppercase tracking-wider">
            {negociosFiltrados.length} Vivos
          </span>
        </div>

        {cargando ? (
          <div className="text-center font-bold text-gray-400 py-10 flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-[#F57814] border-t-transparent rounded-full animate-spin mb-4"></div>
            EXPLORANDO...
          </div>
        ) : (
          negociosFiltrados.map((negocio) => {
            let semaforoClass = "semaforo-rojo";
            let statusText = "CERRADO O LLENO";
            let actionText = "No disponible o muy lleno. ¡Te avisarán!";
            
            if (negocio.mensaje_flash) {
              semaforoClass = "semaforo-amarillo";
              statusText = "AVISO LOCAL";
              actionText = `"${negocio.mensaje_flash}"`;
            } else if (negocio.disponible) {
              semaforoClass = "semaforo-verde";
              if (negocio.categoria === 'restaurante') { statusText = "MESAS LIBRES"; actionText = "Aún hay mesas disponibles, puedes ir ahora mismo."; }
              else if (negocio.categoria === 'hospedaje') { statusText = "HABITACIONES LISTAS"; actionText = "Hay habitaciones listas para ti."; }
              else if (negocio.categoria === 'artesanias') { statusText = "STOCK DISPONIBLE"; actionText = "Excelente stock de piezas y productos locales."; }
              else { statusText = "ABIERTO"; actionText = "Lugar ideal para visitar ahora mismo."; }
            }

            const randomDist = Math.floor(Math.random() * (500 - 50 + 1)) + 50;

            return (
              <div 
                key={negocio.id}
                onClick={() => router.push(`/negocios/${negocio.id}`)}
                className="status-card cursor-pointer group flex flex-col"
              >
                {/* Cabecera Tarjeta: Verificado + Distancia */}
                <div className="flex justify-between items-center px-5 pt-4 pb-3 border-b border-gray-100 bg-gray-50/50 rounded-t-[16px]">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-[#006847] tracking-wider">
                    <svg className="w-4 h-4 text-[#006847]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                    Verificado Ola
                  </div>
                  <span className="text-[11px] font-bold text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-md shadow-sm">
                    A {randomDist}m de ti
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-2xl font-black text-[#2D2A26] leading-none flex-1 group-hover:text-[#006847] transition-colors">{negocio.nombre}</h3>
                    <div className="flex flex-col items-center gap-1 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                      <div className={`w-4 h-4 rounded-full ${semaforoClass}`}></div>
                    </div>
                  </div>

                  <div className="text-[13px] font-extrabold text-[#F57814] uppercase tracking-widest mt-2">
                    {negocio.categoria}
                  </div>

                  {/* Tarjeta interior Semaphore */}
                  <div className={`mt-5 p-4 rounded-xl border-2 ${negocio.mensaje_flash ? 'bg-[#F57814]/10 border-[#F57814]/30' : negocio.disponible ? 'bg-[#006847]/5 border-[#006847]/20' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs font-black tracking-widest uppercase ${negocio.mensaje_flash ? 'text-[#F57814]' : negocio.disponible ? 'text-[#006847]' : 'text-red-700'}`}>
                        {statusText}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-gray-800 leading-snug">
                      {actionText}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Global Floating Chatbot Button (Sticky Bubble) */}
      {!globalChatOpen && (
        <button 
          onClick={() => setGlobalChatOpen(true)}
          className="fab-chat fixed bottom-8 right-6 z-40 text-white p-4 lg:px-6 lg:py-5 sm:px-6 sm:py-5 rounded-full flex gap-3 items-center"
        >
          <div className="flex flex-col items-start text-left max-w-[160px]">
            <span className="text-sm font-black uppercase text-white tracking-widest">Ask anything!</span>
            <span className="text-[11px] font-bold text-white/90">In your language</span>
          </div>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
          </svg>
        </button>
      )}

      {/* Global Chat Overlay */}
      {globalChatOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setGlobalChatOpen(false)} />
          <div className="relative bg-[#FAF8F5] rounded-t-[32px] h-[85vh] w-full max-w-lg mx-auto flex flex-col overflow-hidden shadow-2xl">
            
            <div className="bg-[#E4007C] text-white p-5 flex justify-between items-center rounded-t-[32px] shadow-sm z-10">
              <div>
                <h3 className="font-black text-xl tracking-tight">Guía LocalFest</h3>
                <p className="text-xs font-bold text-white/90 uppercase tracking-widest">Asistente General de la Zona</p>
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