import ChatBot from '../components/ChatBot'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
      <ChatBot negocioId="90f238ad-bd29-455b-8219-c68e146eb53e" negocioNombre="El Sabor Mexicano" />
    </main>
  )
}
