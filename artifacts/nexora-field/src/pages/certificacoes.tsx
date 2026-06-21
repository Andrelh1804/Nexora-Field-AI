import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Upload, Clock, CheckCircle2, XCircle, Trash2 } from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";
function authH() {
  const t = localStorage.getItem("nexora_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

const CERT_TYPES = [
  { value: "nr10", label: "NR-10 — Segurança em Eletricidade" },
  { value: "nr35", label: "NR-35 — Trabalho em Altura" },
  { value: "cisco", label: "Cisco (CCNA / CCNP / CyberOps)" },
  { value: "mikrotik", label: "MikroTik (MTCNA / MTCRE / MTCINE)" },
  { value: "furukawa", label: "Furukawa Certified" },
  { value: "huawei", label: "Huawei Certified (HCIA / HCIP)" },
  { value: "aws", label: "AWS (Cloud Practitioner / SA / DevOps)" },
  { value: "microsoft", label: "Microsoft (AZ / MS Certifications)" },
  { value: "other", label: "Outra Certificação" },
];

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Aguardando análise", color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10", icon: <Clock size={12} /> },
  approved: { label: "Aprovada", color: "text-green-400 border-green-500/30 bg-green-500/10", icon: <CheckCircle2 size={12} /> },
  rejected: { label: "Reprovada", color: "text-red-400 border-red-500/30 bg-red-500/10", icon: <XCircle size={12} /> },
};

interface Cert {
  id: number;
  certType: string;
  certName: string;
  issuedBy: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  fileName: string | null;
  status: "pending" | "approved" | "rejected";
  adminNotes: string | null;
  approvedAt: string | null;
  createdAt: string;
}

const emptyForm = () => ({
  certType: "nr10",
  certName: "",
  issuedBy: "",
  issueDate: "",
  expiryDate: "",
  fileData: "",
  fileName: "",
  fileMime: "",
});

export default function Certificacoes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const { data: certs = [], isLoading } = useQuery<Cert[]>({
    queryKey: ["certifications-me"],
    queryFn: async () => {
      const res = await fetch(`${API}/certifications/me`, { headers: authH() as Record<string, string> });
      if (!res.ok) throw new Error();
      return res.json();
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/certifications`, {
        method: "POST",
        headers: { ...authH(), "Content-Type": "application/json" } as Record<string, string>,
        body: JSON.stringify({
          ...form,
          certName: form.certName || CERT_TYPES.find(t => t.value === form.certType)?.label || form.certType,
        }),
      });
      if (!res.ok) throw new Error("Erro ao enviar");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Certificação enviada!", description: "Aguardando análise do administrador." });
      qc.invalidateQueries({ queryKey: ["certifications-me"] });
      setModal(false);
      setForm(emptyForm());
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`${API}/certifications/${id}`, { method: "DELETE", headers: authH() as Record<string, string> });
    },
    onSuccess: () => {
      toast({ title: "Certificação removida." });
      qc.invalidateQueries({ queryKey: ["certifications-me"] });
    },
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 5 MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(",")[1];
      setForm(f => ({ ...f, fileData: b64, fileName: file.name, fileMime: file.type }));
    };
    reader.readAsDataURL(file);
  };

  const approvedCount = certs.filter(c => c.status === "approved").length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="text-primary" size={28} /> Certificações
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Envie seus certificados para validação. Certificações aprovadas aumentam sua visibilidade nos chamados.
          </p>
        </div>
        <Button onClick={() => setModal(true)} className="gap-2">
          <Upload size={16} /> Enviar Certificado
        </Button>
      </div>

      {approvedCount > 0 && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <CheckCircle2 className="text-green-400 shrink-0" size={20} />
          <p className="text-sm text-green-300">
            Você tem <strong>{approvedCount}</strong> certificação{approvedCount > 1 ? "ões" : ""} aprovada{approvedCount > 1 ? "s" : ""}. Isso melhora seu score no matching de chamados! 🚀
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-muted/30 rounded-xl animate-pulse" />)}
        </div>
      ) : certs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <ShieldCheck size={40} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">Nenhuma certificação enviada ainda.</p>
            <p className="text-sm text-muted-foreground mt-1">Envie seus certificados para aumentar sua credibilidade e visibilidade.</p>
            <Button variant="outline" className="mt-4" onClick={() => setModal(true)}>
              Enviar primeiro certificado
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {certs.map(cert => {
            const meta = STATUS_META[cert.status] || STATUS_META.pending;
            return (
              <Card key={cert.id} className="border-border">
                <CardContent className="py-4 px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{cert.certName}</p>
                        <Badge variant="outline" className={`text-[10px] flex items-center gap-1 ${meta.color}`}>
                          {meta.icon} {meta.label}
                        </Badge>
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        {cert.issuedBy && <span>Emitido por: {cert.issuedBy}</span>}
                        {cert.issueDate && <span>Data: {cert.issueDate}</span>}
                        {cert.expiryDate && <span>Validade: {cert.expiryDate}</span>}
                        {cert.fileName && <span>📎 {cert.fileName}</span>}
                      </div>
                      {cert.adminNotes && (
                        <p className="text-xs mt-1.5 text-muted-foreground italic">
                          Admin: {cert.adminNotes}
                        </p>
                      )}
                    </div>
                    {cert.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => deleteMutation.mutate(cert.id)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-bold text-lg">Enviar Certificação</h2>
              <button onClick={() => setModal(false)} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tipo de Certificação *</label>
                <select
                  value={form.certType}
                  onChange={e => setForm(f => ({ ...f, certType: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {CERT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {form.certType === "other" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Nome da Certificação *</label>
                  <Input
                    placeholder="Ex: Furukawa FTTH Advanced"
                    value={form.certName}
                    onChange={e => setForm(f => ({ ...f, certName: e.target.value }))}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Entidade Emissora</label>
                  <Input
                    placeholder="Ex: Cisco Systems"
                    value={form.issuedBy}
                    onChange={e => setForm(f => ({ ...f, issuedBy: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Data de Emissão</label>
                  <Input
                    type="date"
                    value={form.issueDate}
                    onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Validade (opcional)</label>
                <Input
                  type="date"
                  value={form.expiryDate}
                  onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Arquivo do Certificado (PDF ou Imagem, máx 5 MB)</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-5 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  {form.fileName ? (
                    <p className="text-sm text-primary">📎 {form.fileName}</p>
                  ) : (
                    <>
                      <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Clique para selecionar arquivo</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">PDF, JPG, PNG até 5 MB</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFile}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setModal(false)}>Cancelar</Button>
                <Button
                  className="flex-1"
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? "Enviando..." : "📤 Enviar para Análise"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
