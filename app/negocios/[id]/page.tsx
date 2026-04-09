"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ChatBot from "@/components/ChatBot";

interface Negocio {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  direccion: string;
  telefono: string;
  metodos_pago: string | null;
  horario: string | null;
  disponible: boolean;
  calificacion: number;
  imagen_url: string | null;
}

export default function PerfilNegocio() {
  const params  = useParams();
  const router  = useRouter();
  const id      = params?.id as string;

  const [negocio,  setNegocio]  = useState<Negocio | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/negocios/${id}`)
      .then(r => r.json())
      .then(d => setNegocio(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center font-bold text-gray-400">
      <div className="w-8 h-8 border-4 border-[#006847] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!negocio) return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
      <p className="text-gray-500 font-bold mb-4">No encontrado.</p>
      <button onClick={() => router.back()} className="text-[#E4007C] font-bold">← Volver al catálogo</button>
    </div>
  );

  return (
    <div className="bg-[#FAF8F5] min-h-screen relative pb-20 w-full max-w-lg mx-auto shadow-xl">
      {/* Header NavBar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-bold hover:bg-gray-200 transition">
           ←
        </button>
        <span className="flex-1 font-black text-[#2D2A26] truncate text-lg">
          {negocio.nombre}
        </span>
        <span className="text-[9px] font-black tracking-widest uppercase bg-[#006847] text-white px-2 py-1 rounded-sm shadow-sm">
          Verif. Ola
        </span>
      </div>

      {/* Banner / Foto */}
      <div className="h-[220px] bg-[#F57814]/10 relative flex items-center justify-center text-7xl select-none">
        {negocio.imagen_url ? (
          <img src={negocio.imagen_url} alt={negocio.nombre} className="w-full h-full object-cover" />
        ) : (
          negocio.categoria === 'restaurante' ? '🌮' : 
          negocio.categoria === 'hospedaje' ? '🏨' : 
          negocio.categoria === 'artesanias' ? '🪆' : '🎪'
        )}
        
        {/* Availability Badge */}
        <div className={`absolute -bottom-4 right-6 px-5 py-2 rounded-xl font-black text-xs uppercase shadow-lg border-2 border-white flex items-center gap-2 ${
          negocio.disponible ? 'bg-[#006847] text-white' : 'bg-[#CE1126] text-white'
        }`}>
          <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
          {negocio.disponible ? "Abierto Ahora" : "Cerrado"}
        </div>
      </div>

      <div className="px-6 pt-10 pb-6 bg-[#FAF8F5]">
        <h1 className="text-[28px] font-black text-[#2D2A26] leading-tight mb-1">{negocio.nombre}</h1>
        <p className="text-[#006847] font-extrabold text-[11px] uppercase tracking-widest mb-3">{negocio.categoria}</p>
        
        <div className="flex items-center gap-1.5 mb-6 text-[#F57814] font-black text-sm bg-[#F57814]/10 inline-flex px-2.5 py-1 rounded-lg">
          ★ {negocio.calificacion?.toFixed(1) || "5.0"}
        </div>

        {negocio.descripcion && (
          <p className="text-gray-700 font-semibold leading-relaxed mb-8 text-sm">
            {negocio.descripcion}
          </p>
        )}

        {/* Info Pills */}
        <div className="flex flex-wrap gap-2.5 mb-8">
          {negocio.horario && <span className="bg-white px-3 py-2 rounded-xl border-2 border-gray-100 shadow-sm text-xs font-bold text-gray-700 flex items-center gap-1.5"><span className="text-lg">🕐</span> {negocio.horario}</span>}
          {negocio.metodos_pago && <span className="bg-white px-3 py-2 rounded-xl border-2 border-gray-100 shadow-sm text-xs font-bold text-gray-700 flex items-center gap-1.5"><span className="text-lg">💳</span> {negocio.metodos_pago}</span>}
          {negocio.direccion && <span className="bg-white px-3 py-2 rounded-xl border-2 border-gray-100 shadow-sm text-xs font-bold text-gray-700 flex items-center gap-1.5"><span className="text-lg">📍</span> {negocio.direccion}</span>}
        </div>

        {/* Action Button CTA */}
        <button
          onClick={() => setShowChat(true)}
          className="w-full py-4 bg-gradient-to-r from-[#E4007C] to-[#ff2a9d] text-white font-black rounded-3xl shadow-[0_8px_25px_rgba(228,0,124,0.35)] hover:shadow-[0_4px_15px_rgba(228,0,124,0.4)] active:scale-95 transition-all text-[15px] flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
          Consultar al asistente IA
        </button>

        {negocio.telefono && (
          <a
            href={`tel:${negocio.telefono}`}
            className="mt-4 flex items-center justify-center w-full py-3 bg-white text-gray-600 font-extrabold rounded-full shadow-sm border-[1.5px] border-gray-200 hover:bg-gray-50 transition-colors text-sm"
          >
            Llamar al {negocio.telefono}
          </a>
        )}
      </div>

      {/* Chat Bot Overlay */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowChat(false)} />
          <div className="relative bg-[#FAF8F5] rounded-t-[32px] h-[85vh] w-full max-w-lg mx-auto flex flex-col overflow-hidden shadow-2xl">
            {/* Cabecera modal chatbot */}
            <div className="bg-[#006847] text-white p-5 flex justify-between items-center rounded-t-[32px] shadow-sm z-10">
              <div>
                <h3 className="font-black text-xl tracking-tight leading-none mb-0.5">{negocio.nombre}</h3>
                <p className="text-[10px] font-black text-[#E1F5EE] uppercase tracking-widest">Asistente Local</p>
              </div>
              <button onClick={() => setShowChat(false)} className="bg-black/20 w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/30 transition text-white font-bold">✕</button>
            </div>
            
            <div className="flex-1 overflow-hidden bg-white">
              <ChatBot negocioId={negocio.id} negocioNombre={negocio.nombre} categoria={negocio.categoria} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
