import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAuthToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const authFetch = async (url: string, opts: RequestInit = {}) => {
  const token = getAuthToken();
  const r = await fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

const DOC_TYPES: Record<string, { label: string; icon: string; color: string }> = {
  procedure: { label: "Procedimento", icon: "📋", color: "bg-blue-500/20 text-blue-400" },
  faq: { label: "FAQ", icon: "❓", color: "bg-yellow-500/20 text-yellow-400" },
  safety: { label: "Segurança", icon: "⚠️", color: "bg-red-500/20 text-red-400" },
  troubleshooting: { label: "Troubleshoot", icon: "🔧", color: "bg-orange-500/20 text-orange-400" },
  checklist: { label: "Checklist", icon: "✅", color: "bg-green-500/20 text-green-400" },
};

export default function Conhecimento() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [specialty, setSpecialty] = useState("todos");
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [form, setForm] = useState({ title: "", content: "", specialty: "", docType: "procedure", tags: "" });

  const { data: docs = [], isLoading } = useQuery({ queryKey: ["knowledge", q, specialty], queryFn: () => authFetch(`/api/knowledge?${new URLSearchParams({ ...(q ? { q } : {}), ...(specialty !== "todos" ? { specialty } : {}), limit: "30" })}`) });
  const { data: detail } = useQuery({ queryKey: ["knowledge-doc", selected?.id], queryFn: () => authFetch(`/api/knowledge/${selected?.id}`), enabled: !!selected?.id });

  const createDoc = useMutation({ mutationFn: (data: any) => authFetch("/api/knowledge", { method: "POST", body: JSON.stringify(data) }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["knowledge"] }); setShowNew(false); toast({ title: "Documento publicado!" }); } });
  const askAi = useMutation({ mutationFn: (q: string) => authFetch("/api/knowledge/ask", { method: "POST", body: JSON.stringify({ question: q }) }), onSuccess: () => { } });

  const specialties = [...new Set(docs.map((d: any) => d.specialty).filter(Boolean))];

  if (selected) {
    const doc = detail || selected;
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => setSelected(null)} className="text-muted-foreground">← Voltar</Button>
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span>{DOC_TYPES[doc.docType]?.icon}</span>
                  <Badge className={`text-xs ${DOC_TYPES[doc.docType]?.color}`}>{DOC_TYPES[doc.docType]?.label}</Badge>
                  {doc.specialty && <Badge variant="outline" className="text-xs">{doc.specialty}</Badge>}
                </div>
                <CardTitle className="text-xl">{doc.title}</CardTitle>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>👁 {doc.views || 0}</span>
                <span>👍 {doc.helpful || 0}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">{doc.content}</div>
            {doc.tags?.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-4 pt-4 border-t border-border">
                {doc.tags.map((t: string) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardHeader><CardTitle className="text-base">💬 Perguntar à IA sobre este documento</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Faça uma pergunta técnica..." value={aiQuestion} onChange={e => setAiQuestion(e.target.value)} />
            <Button size="sm" onClick={() => askAi.mutate(aiQuestion)} disabled={!aiQuestion || askAi.isPending}>
              {askAi.isPending ? "Consultando..." : "Perguntar"}
            </Button>
            {askAi.data && <div className="bg-card border border-border rounded-lg p-3 text-sm">{askAi.data.answer}</div>}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">📚 Base de Conhecimento</h1>
          <p className="text-muted-foreground mt-1">Documentação técnica da plataforma</p>
        </div>
        {user && <Button onClick={() => setShowNew(!showNew)}>+ Novo Documento</Button>}
      </div>

      {showNew && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader><CardTitle>Novo Documento</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Título *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            <Textarea placeholder="Conteúdo *" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={6} />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Select value={form.docType} onValueChange={v => setForm(p => ({ ...p, docType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(DOC_TYPES).map(([v, { label, icon }]) => <SelectItem key={v} value={v}>{icon} {label}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Especialidade" value={form.specialty} onChange={e => setForm(p => ({ ...p, specialty: e.target.value }))} />
              <Input placeholder="Tags (vírgula)" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => createDoc.mutate({ ...form, tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()) : [] })} disabled={!form.title || !form.content || createDoc.isPending}>
                {createDoc.isPending ? "Publicando..." : "Publicar"}
              </Button>
              <Button variant="ghost" onClick={() => setShowNew(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Buscar na base de conhecimento..." value={q} onChange={e => setQ(e.target.value)} className="sm:max-w-sm" />
        <Select value={specialty} onValueChange={setSpecialty}>
          <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todas especialidades</SelectItem>{specialties.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {isLoading ? <div className="animate-pulse text-muted-foreground">Carregando documentos...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {docs.map((doc: any) => (
            <Card key={doc.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setSelected(doc)}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span>{DOC_TYPES[doc.docType]?.icon || "📄"}</span>
                  <Badge className={`text-xs ${DOC_TYPES[doc.docType]?.color}`}>{DOC_TYPES[doc.docType]?.label}</Badge>
                  {doc.specialty && <Badge variant="outline" className="text-xs">{doc.specialty}</Badge>}
                </div>
                <p className="font-semibold hover:text-primary transition-colors">{doc.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{doc.content}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>👁 {doc.views || 0}</span>
                  <span>👍 {doc.helpful || 0}</span>
                </div>
              </CardContent>
            </Card>
          ))}
          {docs.length === 0 && <p className="text-muted-foreground col-span-2 text-center py-8">Nenhum documento encontrado.</p>}
        </div>
      )}
    </div>
  );
}
