import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuthToken } from "@/lib/auth";

const authFetch = async (url: string, opts: RequestInit = {}) => {
  const token = getAuthToken();
  const r = await fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

export default function Copilot() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState("");
  const [specialty, setSpecialty] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: sessions = [] } = useQuery({ queryKey: ["copilot-sessions"], queryFn: () => authFetch("/api/copilot/sessions") });

  const startSession = useMutation({
    mutationFn: () => authFetch("/api/copilot/sessions", { method: "POST", body: JSON.stringify({ specialty: specialty || "geral", context: {} }) }),
    onSuccess: (data) => { setSessionId(data.id); setMessages([]); qc.invalidateQueries({ queryKey: ["copilot-sessions"] }); }
  });

  const sendMessage = useMutation({
    mutationFn: ({ sid, message }: any) => authFetch(`/api/copilot/sessions/${sid}/message`, { method: "POST", body: JSON.stringify({ message }) }),
    onSuccess: (data) => {
      setMessages(m => [...m, { role: "assistant", content: data.response || data.message }]);
    }
  });

  const handleSend = () => {
    if (!input.trim() || !sessionId) return;
    const msg = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", content: msg }]);
    sendMessage.mutate({ sid: sessionId, message: msg });
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const loadSession = async (id: number) => {
    setSessionId(id);
    const data = await authFetch(`/api/copilot/sessions/${id}`);
    setMessages(data.messages || []);
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">🤖 Copiloto IA</h1>
        <p className="text-muted-foreground mt-1">Assistente técnico inteligente para chamados de campo</p>
      </div>

      {!sessionId ? (
        <div className="space-y-4">
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader><CardTitle>Iniciar Sessão de Suporte</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Especialidade técnica (ex: TI, Elétrica, Refrigeração...)" value={specialty} onChange={e => setSpecialty(e.target.value)} />
              <Button onClick={() => startSession.mutate()} disabled={startSession.isPending} className="w-full">
                {startSession.isPending ? "Iniciando..." : "🚀 Iniciar Copiloto"}
              </Button>
            </CardContent>
          </Card>

          {sessions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Sessões anteriores</p>
              {sessions.slice(0, 5).map((s: any) => (
                <Card key={s.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => loadSession(s.id)}>
                  <CardContent className="pt-3 pb-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{s.specialty}</p>
                      <p className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{s.status}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col h-[70vh]">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="sm" onClick={() => setSessionId(null)} className="text-muted-foreground">← Sessões</Button>
            <span className="text-xs text-muted-foreground">Sessão #{sessionId} · {specialty || "Geral"}</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {messages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-4xl mb-2">🤖</p>
                <p>Olá! Sou seu copiloto técnico. Como posso ajudar no chamado de hoje?</p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {["Como diagnosticar o problema?", "Quais ferramentas preciso?", "Qual o procedimento de segurança?"].map(q => (
                    <button key={q} onClick={() => { setInput(q); }} className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/50 hover:bg-primary/10 transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-3 ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
                  {m.role === "assistant" && <p className="text-xs text-muted-foreground mb-1">🤖 Copiloto</p>}
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                </div>
              </div>
            ))}
            {sendMessage.isPending && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-xl px-4 py-3">
                  <div className="flex gap-1"><span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" /><span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.1s]" /><span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" /></div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-2 mt-3 pt-3 border-t border-border">
            <Input placeholder="Digite sua pergunta técnica..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()} />
            <Button onClick={handleSend} disabled={!input.trim() || sendMessage.isPending}>Enviar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
