import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, CheckCircle2, XCircle, Eye } from "lucide-react";
import { SecureFilePreview, isObjectStorageKey } from "@/components/secure-image";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";
function authH() {
  const t = localStorage.getItem("nexora_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

interface CertRow {
  cert: {
    id: number;
    certType: string;
    certName: string;
    issuedBy: string | null;
    issueDate: string | null;
    expiryDate: string | null;
    fileName: string | null;
    fileMime: string | null;
    fileData: string | null;
    fileUrl: string | null;
    status: "pending" | "approved" | "rejected";
    adminNotes: string | null;
    approvedAt: string | null;
    createdAt: string;
  };
  tech: { id: number; name: string; email: string; city: string; state: string };
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:  { label: "Pendente",  color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" },
  approved: { label: "Aprovada",  color: "text-green-400 border-green-500/30 bg-green-500/10"   },
  rejected: { label: "Reprovada", color: "text-red-400 border-red-500/30 bg-red-500/10"         },
};

function FilePreviewModal({ row, onClose }: { row: CertRow; onClose: () => void }) {
  const c = row.cert;
  const hasObjectKey = c.fileUrl && isObjectStorageKey(c.fileUrl);
  const hasBase64 = !!c.fileData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="max-w-3xl w-full max-h-[90vh] bg-card rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <p className="font-medium text-sm">{c.fileName ?? "Arquivo"}</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-4 overflow-auto max-h-[80vh]">
          {hasObjectKey ? (
            <SecureFilePreview objectKey={c.fileUrl!} mimeType={c.fileMime ?? undefined} fileName={c.fileName ?? undefined} />
          ) : hasBase64 ? (
            c.fileMime?.startsWith("image/") ? (
              <img
                src={`data:${c.fileMime};base64,${c.fileData}`}
                alt="Certificado"
                className="max-w-full mx-auto rounded-lg"
              />
            ) : (
              <iframe
                src={`data:${c.fileMime};base64,${c.fileData}`}
                className="w-full h-[70vh] rounded-lg"
                title="Certificado PDF"
              />
            )
          ) : (
            <p className="text-center text-muted-foreground py-12">Nenhum arquivo disponível.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminCertificacoes() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [reviewing, setReviewing] = useState<CertRow | null>(null);
  const [notes, setNotes] = useState("");
  const [previewRow, setPreviewRow] = useState<CertRow | null>(null);

  const { data: rows = [], isLoading } = useQuery<CertRow[]>({
    queryKey: ["admin-certifications"],
    queryFn: async () => {
      const res = await fetch(`${API}/admin/certifications`, { headers: authH() as Record<string, string> });
      if (!res.ok) throw new Error();
      return res.json();
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "approved" | "rejected" }) => {
      const res = await fetch(`${API}/admin/certifications/${id}/review`, {
        method: "PUT",
        headers: { ...authH(), "Content-Type": "application/json" } as Record<string, string>,
        body: JSON.stringify({ status, adminNotes: notes }),
      });
      if (!res.ok) throw new Error("Erro ao revisar");
      return res.json();
    },
    onSuccess: (_, { status }) => {
      toast({ title: status === "approved" ? "✅ Certificação aprovada!" : "❌ Certificação reprovada." });
      qc.invalidateQueries({ queryKey: ["admin-certifications"] });
      setReviewing(null);
      setNotes("");
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const displayed = filter === "all" ? rows : rows.filter(r => r.cert.status === filter);
  const pendingCount = rows.filter(r => r.cert.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="text-primary" size={28} /> Certificações
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Aprove ou reprove os certificados enviados pelos técnicos.</p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            {pendingCount} aguardando análise
          </Badge>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "approved", "rejected"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}
          >
            {f === "all" ? "Todas" : f === "pending" ? "Pendentes" : f === "approved" ? "Aprovadas" : "Reprovadas"}
            {" "}
            <span className="opacity-60">{rows.filter(r => f === "all" || r.cert.status === f).length}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-muted/30 rounded-xl animate-pulse" />)}
        </div>
      ) : displayed.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <ShieldCheck size={36} className="mx-auto mb-3 opacity-30" />
            <p>Nenhuma certificação nesta categoria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayed.map(row => {
            const meta = STATUS_META[row.cert.status];
            const hasFile = !!(row.cert.fileUrl || row.cert.fileData);
            return (
              <Card key={row.cert.id} className="border-border">
                <CardContent className="py-4 px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{row.cert.certName}</p>
                        <Badge variant="outline" className={`text-[10px] ${meta.color}`}>{meta.label}</Badge>
                        {row.cert.fileUrl && isObjectStorageKey(row.cert.fileUrl) && (
                          <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-500/30 bg-blue-500/10">☁ Storage</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Técnico: <strong>{row.tech.name}</strong> · {row.tech.city}/{row.tech.state} · {row.tech.email}
                      </p>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        {row.cert.issuedBy && <span>Emitido por: {row.cert.issuedBy}</span>}
                        {row.cert.issueDate && <span>Data: {row.cert.issueDate}</span>}
                        {row.cert.fileName && <span>📎 {row.cert.fileName}</span>}
                        <span>Enviado: {new Date(row.cert.createdAt).toLocaleDateString("pt-BR")}</span>
                      </div>
                      {row.cert.adminNotes && (
                        <p className="text-xs mt-1 text-muted-foreground italic">Nota: {row.cert.adminNotes}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {hasFile && (
                        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setPreviewRow(row)}>
                          <Eye size={13} /> Ver
                        </Button>
                      )}
                      {row.cert.status === "pending" && (
                        <Button size="sm" variant="outline" onClick={() => { setReviewing(row); setNotes(""); }}>
                          Revisar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-bold">Revisar Certificação</h2>
              <button onClick={() => setReviewing(null)} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-muted/30 rounded-xl p-4 space-y-1 text-sm">
                <p><strong>{reviewing.cert.certName}</strong></p>
                <p className="text-muted-foreground">Técnico: {reviewing.tech.name} — {reviewing.tech.email}</p>
                {reviewing.cert.issuedBy && <p className="text-muted-foreground">Emitido por: {reviewing.cert.issuedBy}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Observação (opcional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Motivo da reprovação ou comentário para o técnico..."
                  className="w-full h-24 px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white gap-2"
                  onClick={() => reviewMutation.mutate({ id: reviewing.cert.id, status: "rejected" })}
                  disabled={reviewMutation.isPending}
                >
                  <XCircle size={15} /> Reprovar
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
                  onClick={() => reviewMutation.mutate({ id: reviewing.cert.id, status: "approved" })}
                  disabled={reviewMutation.isPending}
                >
                  <CheckCircle2 size={15} /> Aprovar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewRow && (
        <FilePreviewModal row={previewRow} onClose={() => setPreviewRow(null)} />
      )}
    </div>
  );
}
