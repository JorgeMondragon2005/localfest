'use client'

import React, { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatBotProps {
  negocioId?: string
  negocioNombre?: string
  categoria?: string
  isGlobal?: boolean
  telefono?: string
}

export default function ChatBot({ negocioId, negocioNombre, categoria, isGlobal, telefono }: ChatBotProps) {
  const defaultMessage: Message = {
      role: 'assistant',
      content: isGlobal 
        ? "¡Hola! Soy tu Guía LocalFest. ¿Qué te gustaría probar hoy? Dímelo y te encuentro el mejor negocio. / What are you looking for today?" 
        : `Hi! I'm the assistant for ${negocioNombre || 'this business'}. How can I help you today?`
  };

  const [messages, setMessages] = useState<Message[]>([defaultMessage])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [reservacionPendiente, setReservacionPendiente] = useState<string | null>(null)
  const [lang, setLang] = useState<'ES' | 'EN'>('EN')

  // Cargar estado guardado al montar
  useEffect(() => {
    const key = `lf_chat_${negocioId || 'global'}`
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.messages?.length) setMessages(parsed.messages)
        if (parsed.reservacionPendiente) setReservacionPendiente(parsed.reservacionPendiente)
      } catch (e) {}
    }
  }, [negocioId])

  // Guardar estado cada que cambie
  useEffect(() => {
    const key = `lf_chat_${negocioId || 'global'}`
    localStorage.setItem(key, JSON.stringify({ messages, reservacionPendiente }))
  }, [messages, reservacionPendiente, negocioId])
  
  const cat = isGlobal ? 'global' : (categoria?.toLowerCase() || 'servicios');
  const catFilters = isGlobal ? ['Dónde comer ahorita', 'Eventos de noche', 'Quiero artesanías'] :
                     cat === 'restaurante' ? ['Opciones veganas', 'Alergias y dieta', 'Métodos de pago'] :
                     cat === 'hospedaje' ? ['Disponibilidad hoy', 'Check-in y Out', 'Aceptan USD?'] :
                     cat === 'artesanias' ? ['Catálogo de productos', 'Mayoreo?', 'Envíos internacionales'] :
                     cat === 'entretenimiento' ? ['Comprar boletos', 'Horarios de hoy', 'Ubicación exacta'] :
                     ['Cómo llego?', 'Métodos de pago', 'Horarios de hoy'];
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading, reservacionPendiente])

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || loading) return

    const userText = input.trim()
    const newMessages: Message[] = [...messages, { role: 'user', content: userText }]
    
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, negocioId: isGlobal ? null : negocioId })
      })

      if (!response.ok) {
        throw new Error('Chat API Error')
      }
      
      const data = await response.json()
      let botMessageContent = data.message || ''

      // Detectar string de reservación lista
      if (botMessageContent.includes('[RESERVACION_LISTA]')) {
        const cleanMessage = botMessageContent.replace('[RESERVACION_LISTA]', '').trim()
        setReservacionPendiente(cleanMessage)
        botMessageContent = cleanMessage
      }

      setMessages(prev => [...prev, { role: 'assistant', content: botMessageContent }])

    } catch (error) {
      console.error(error)
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: lang === 'ES' 
            ? 'Error de conexión. Por favor, intenta de nuevo.' 
            : 'Connection error. Please try again.' 
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmar = async () => {
    if (!reservacionPendiente) return

    // 1. Llamada real a WhatsApp
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ negocioId, mensaje: reservacionPendiente })
      })

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Server error');
      }

      // 2. Mensaje de espera inmediato
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: lang === 'ES' 
          ? '⏳ Enviando tu solicitud al restaurante vía WhatsApp oficial...' 
          : '⏳ Sending your request via official WhatsApp...'
      }])
      setReservacionPendiente(null)

      // 3. Confirmación (Sólo se llega aquí si Twilio no tiró Error 500)
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: lang === 'ES'
            ? '✅ ¡Tu solicitud ya fue enviada directamente al WhatsApp del local! Te confirmarán pronto. ¿Te puedo ayudar resolviendo alguna otra duda mientras tanto?'
            : '✅ Your request has been sent directly to the local\'s WhatsApp! They will confirm shortly. Can I help you with anything else in the meantime?'
        }])
      }, 3000)

    } catch (err: any) {
      console.error('WhatsApp notification API failed', err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: lang === 'ES' 
          ? `El negocio no pudo recibir el mensaje (su número no está activo en Twilio). Por favor contáctalos directo al ${telefono || 'teléfono principal'} para asegurar tu lugar. ¡No pierdas tu venta!`
          : `The business couldn't receive the message (Twilio inactive). Please contact them directly at ${telefono || 'their phone'} to secure your spot.`
      }])
      setReservacionPendiente(null)
    }
  }

  return (
    <div className="flex flex-col w-full max-w-md mx-auto h-full border-none overflow-hidden bg-gray-50 font-sans">
      
      {/* HEADER -> Se esconde u oculta en Global si pasas isGlobal, pero el UI general lo controla */}
      {!isGlobal && (
        <div className="bg-[#006847] text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-full">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="M12 8V4H8"/>
                <rect width="16" height="12" x="4" y="8" rx="2"/>
                <path d="M2 14h2"/>
                <path d="M20 14h2"/>
                <path d="M15 13v2"/>
                <path d="M9 13v2"/>
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-lg leading-tight">{negocioNombre}</h2>
              <p className="text-xs text-white/80">AI Assistant</p>
            </div>
          </div>
          <button onClick={() => setLang(l => l === 'EN' ? 'ES' : 'EN')} className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
            {lang === 'EN' ? 'EN / es' : 'es / EN'}
          </button>
        </div>
      )}

      {/* MENSAJES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user'
          return (
            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm text-[13.5px] font-medium leading-relaxed ${
                  isUser 
                    ? 'bg-[#006847] text-white rounded-br-none shadow-md' 
                    : 'bg-white border border-gray-100 text-gray-700 rounded-bl-none shadow-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          )
        })}

        {/* LOADING DOTS */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-4 shadow-sm flex items-center justify-center">
              <div className="flex space-x-1 items-center h-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* BOTÓN CONFIRMAR CUANDO APLICA */}
        {reservacionPendiente && !loading && (
          <div className="flex justify-center mt-6 mb-2">
            <button
              onClick={handleConfirmar}
              className="bg-[#0F6E56] hover:bg-[#1D9E75] text-white font-medium px-6 py-3 rounded-full shadow-md transition-all transform hover:scale-105 active:scale-95 flex items-center space-x-2"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>{lang === 'ES' ? 'Confirmar Reservación' : 'Confirm Reservation'}</span>
            </button>
          </div>
        )}

        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* FILTROS DINAMICOS POR CATEGORIA */}
      <div className="px-4 pb-3 bg-white auto-scroll shrink-0 flex gap-2 overflow-x-auto whitespace-nowrap text-xs" style={{scrollbarWidth: 'none'}}>
        {catFilters.map((f, i) => (
          <button 
            key={i} 
            onClick={() => setInput(f)} 
            className="bg-gray-50 hover:bg-[#1D9E75]/10 text-[#0F6E56] font-semibold px-4 py-2 rounded-full transition border border-[#1D9E75]/20 shadow-sm"
          >
            {f}
          </button>
        ))}
      </div>

      {/* INPUT */}
      <div className="p-4 bg-white border-t border-gray-100 shrink-0">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder={lang === 'ES' ? 'Escribe un mensaje...' : 'Type a message...'}
            className="flex-1 bg-gray-100 border border-transparent focus:bg-white focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20 rounded-full px-4 py-3 text-gray-700 outline-none transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-[#1D9E75] hover:bg-[#0F6E56] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full w-12 h-12 flex items-center justify-center shrink-0 transition-colors"
            aria-label="Send message"
          >
            {/* Ícono Send */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 ml-1">
              <line x1="22" x2="11" y1="2" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
