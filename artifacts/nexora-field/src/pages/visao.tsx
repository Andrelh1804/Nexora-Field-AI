import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuthToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const authFetch = async (url: string, opts: RequestInit = {}) => {
  const token = getAuthToken();
  const r = await fetch(url, { ...opts, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

export default function Visao() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState("damage_assessment");
  const [result, setResult] = useState<any>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const { data: history = [] } = useQuery({ queryKey: ["vision-history"], queryFn: () => authFetch("/api/vision/analyses") });

  const analyze = useMutation({
    mutationFn: (data: any) => authFetch("/api/vision/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
    onSuccess: (data) => { setResult(data); toast({ title: "Análise concluída!" }); },
    onError: () => toast({ title: "Erro na análise", variant: "destructive" }),
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string)?.split(",")[1] || "";
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const ANALYSIS_TYPES = [
    { value: "damage_assessment", label: "🔍 Avaliação de Dano" },
    { value: "equipment_identification", label: "⚙️ Identificar Equipamento" },
    { value: "safety_check", label: "⚠️ Checagem de Segurança" },
    { value: "progress_report", label: "📊 Relatório de Progresso" },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">👁️ Visão IA</h1>
        <p className="text-muted-foreground mt-1">Análise inteligente de imagens de campo com IA</p>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader><CardTitle>Nova Análise Visual</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {ANALYSIS_TYPES.map(t => (
              <button key={t.value} onClick={() => setAnalysisType(t.value)} className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${analysisType === t.value ? "border-primary bg-primary/20 text-primary" : "border-border hover:border-primary/40 text-muted-foreground"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {preview ? (
            <div className="relative">
              <img src={preview} alt="Preview" className="w-full max-h-64 object-contain rounded-lg border border-border bg-black/20" />
              <Button size="sm" variant="ghost" className="absolute top-2 right-2 bg-black/50" onClick={() => { setPreview(null); setImageBase64(null); setResult(null); }}>✕</Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fileRef.current?.click()}>
              <p className="text-4xl mb-2">📷</p>
              <p className="text-muted-foreground">Clique para selecionar uma imagem</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP até 10MB</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

          <Button className="w-full" onClick={() => { if (!imageBase64) { toast({ title: "Selecione uma imagem", variant: "destructive" }); return; } analyze.mutate({ imageBase64, analysisType, orderId: null }); }} disabled={!preview || analyze.isPending}>
            {analyze.isPending ? "Analisando com IA..." : "🔍 Analisar Imagem"}
          </Button>

          {result && (
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-primary font-semibold text-sm">🤖 Resultado da Análise</span>
                {result.confidence && <Badge variant="outline" className="text-xs">{Math.round(result.confidence * 100)}% confiança</Badge>}
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.result || result.findings || result.description || "Análise concluída"}</p>
              {result.recommendations?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Recomendações:</p>
                  <ul className="space-y-1">{result.recommendations.map((r: string, i: number) => <li key={i} className="text-xs text-muted-foreground flex gap-1"><span>→</span>{r}</li>)}</ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Análises Anteriores ({history.length})</h3>
          {history.slice(0, 5).map((h: any) => (
            <Card key={h.id}>
              <CardContent className="pt-3 pb-3 flex items-center gap-3">
                {h.imageUrl && <img src={h.imageUrl} alt="" className="w-12 h-12 object-cover rounded" />}
                <div className="flex-1">
                  <p className="text-sm font-medium">{h.analysisType?.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{typeof h.findings === "string" ? h.findings : JSON.stringify(h.findings)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleDateString("pt-BR")}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
