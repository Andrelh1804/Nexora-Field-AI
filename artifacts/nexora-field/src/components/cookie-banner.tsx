import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "nexora_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  }

  function reject() {
    localStorage.setItem(STORAGE_KEY, "rejected");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-card border border-border rounded-xl shadow-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Cookie className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Utilizamos cookies</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Usamos cookies estritamente necessários para autenticação e funcionamento da plataforma.
              Nenhum dado é compartilhado com terceiros para fins publicitários.{" "}
              <Link href="/privacidade" className="text-primary hover:underline">
                Saiba mais
              </Link>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={reject} className="flex-1 md:flex-none text-xs">
            Recusar
          </Button>
          <Button size="sm" onClick={accept} className="flex-1 md:flex-none text-xs bg-primary hover:bg-primary/90">
            Aceitar
          </Button>
        </div>
      </div>
    </div>
  );
}
