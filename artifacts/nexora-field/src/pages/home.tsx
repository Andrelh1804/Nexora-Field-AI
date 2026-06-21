import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center">
      <img src="/nexora-logo.png" alt="Nexora Field" className="h-24 mb-8" />
      <h1 className="text-5xl font-bold tracking-tight mb-4">Intelligent Field Services</h1>
      <p className="text-xl text-muted-foreground max-w-2xl mb-8">
        Conectamos empresas que precisam de suporte técnico em campo com técnicos autônomos especializados através de IA.
      </p>
      <div className="flex gap-4">
        <a href="/app/register">
          <Button size="lg" className="text-lg px-8">Começar Agora</Button>
        </a>
        <a href="/app/login">
          <Button variant="outline" size="lg" className="text-lg px-8">Acessar Conta</Button>
        </a>
      </div>
    </div>
  );
}
