"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-8 overflow-hidden font-sans text-center">
      
      {/* Elementos decorativos (Papel Picado vibe o círculos vibrantes) */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#E4007C]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[#006847]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#F57814]/5 via-transparent to-transparent pointer-events-none"></div>

      {/* Logo */}
      <div className="relative z-10 mb-6 drop-shadow-xl animate-fade-in-up">
        {/* Usando imagen real del logo o fallback estético en texto si no carga la img */}
        <img
          src="/LogoLF.png"
          alt="LocalFest"
          className="w-48 h-48 object-contain mx-auto mix-blend-multiply"
          onError={(e) => {
            // Fallback si la imagen no existe
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      {/* Título Principal */}
      <h1 className="relative z-10 text-5xl font-black text-[#2D2A26] tracking-tighter mb-4 leading-tight">
        <span className="text-[#006847]">Local</span>
        <span className="text-[#F57814]">Fest</span>
      </h1>

      {/* Descripción */}
      <p className="relative z-10 text-lg text-gray-600 font-semibold mb-10 max-w-xs leading-relaxed">
        Reserva y descubre los rincones más auténticos de México.
      </p>

      {/* Sello de Confianza */}
      <div className="relative z-10 bg-white/80 backdrop-blur-md border border-gray-200 px-5 py-2.5 rounded-full shadow-sm mb-12 flex items-center justify-center gap-2">
        <svg className="w-5 h-5 text-[#006847]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
        <span className="text-sm font-black uppercase tracking-widest text-[#006847]">Verificado por Ola</span>
      </div>

      {/* Botón Principal (Hero Action) */}
      <button
        onClick={() => router.push("/catalogo")}
        className="relative z-10 w-full max-w-sm py-5 px-8 bg-gradient-to-r from-[#006847] to-[#0a875e] text-white rounded-3xl text-lg font-black shadow-[0_15px_35px_-5px_rgba(0,104,71,0.4)] hover:shadow-[0_10px_20px_-5px_rgba(0,104,71,0.4)] active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-1 group mb-5"
      >
        <span>Entrar al Radar Festivo</span>
        <span className="text-xs font-bold text-white/80 font-normal uppercase tracking-wider group-hover:text-white transition-colors">Explorar negocios locales</span>
      </button>

      {/* Botón Secundario */}
      <button
        onClick={() => router.push("/negocio/registro")}
        className="relative z-10 w-full max-w-sm py-4 px-8 bg-white text-gray-700 border-2 border-gray-200 rounded-3xl text-sm font-extrabold shadow-sm active:scale-[0.98] hover:bg-gray-50 transition-all flex justify-center items-center gap-2"
      >
        <span>🏪</span> ¿Tienes un negocio? Regístralo
      </button>

      {/* Footer */}
      <div className="absolute bottom-6 w-full text-center px-4">
        <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">
          Impulsado por Fundación Coppel · Impact Hub
        </p>
      </div>

    </div>
  );
}