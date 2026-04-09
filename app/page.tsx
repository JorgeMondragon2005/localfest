"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{
      maxWidth: 430,
      margin: "0 auto",
      minHeight: "100dvh",
      background: "#0F6E56",
      fontFamily: "system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 28px",
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Círculos decorativos — solo abajo, lejos del logo */}
      <div style={{
        position: "absolute",
        bottom: -120,
        right: -120,
        width: 320,
        height: 320,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.05)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        bottom: -60,
        left: -100,
        width: 250,
        height: 250,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.05)",
        pointerEvents: "none",
      }} />

      {/* Logo centrado */}
      <img
  src="/LogoLF.png"
  alt="LocalFest"
  style={{
    width: 180,
    height: 180,
    objectFit: "contain",
    marginBottom: 20,
    position: "relative",
    zIndex: 2,
    mixBlendMode: "screen",
  }}
/>

      {/* Título */}
      <h1 style={{
        fontSize: 38,
        fontWeight: 800,
        color: "white",
        margin: "0 0 10px",
        letterSpacing: -1,
        position: "relative",
        zIndex: 2,
      }}>
        LocalFest
      </h1>

      {/* Descripción */}
      <p style={{
        fontSize: 15,
        color: "rgba(255,255,255,0.75)",
        margin: "0 0 12px",
        lineHeight: 1.6,
        maxWidth: 260,
        position: "relative",
        zIndex: 2,
      }}>
        Descubre negocios locales auténticos cerca de ti
      </p>

      {/* Sello */}
      <div style={{
        background: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: 20,
        padding: "5px 16px",
        fontSize: 12,
        color: "rgba(255,255,255,0.9)",
        marginBottom: 48,
        fontWeight: 500,
        position: "relative",
        zIndex: 2,
      }}>
        ✓ Verificado por Ola México
      </div>

      {/* Botón principal */}
      <button
        onClick={() => router.push("/catalogo")}
        style={{
          width: "100%",
          maxWidth: 320,
          padding: "18px 24px",
          background: "white",
          color: "#0F6E56",
          border: "none",
          borderRadius: 16,
          fontSize: 16,
          fontWeight: 700,
          cursor: "pointer",
          marginBottom: 14,
          transition: "transform 0.1s ease",
          position: "relative",
          zIndex: 2,
        }}
        onMouseDown={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)";
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        }}
      >
        Explorar negocios locales
      </button>

      {/* Botón secundario */}
      <button
        onClick={() => router.push("/negocio/registro")}
        style={{
          width: "100%",
          maxWidth: 320,
          padding: "16px 24px",
          background: "transparent",
          color: "rgba(255,255,255,0.8)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 16,
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          transition: "transform 0.1s ease",
          position: "relative",
          zIndex: 2,
        }}
        onMouseDown={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)";
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        }}
      >
        ¿Tienes un negocio? Regístralo aquí
      </button>

      {/* Footer */}
      <p style={{
        position: "absolute",
        bottom: 20,
        fontSize: 11,
        color: "rgba(255,255,255,0.3)",
        zIndex: 2,
      }}>
        Impulsado por Fundación Coppel · Impact Hub CDMX
      </p>

    </div>
  );
}