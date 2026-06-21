import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { User, Shield, Download, Trash2, Lock, Mail, Calendar, Building, Camera } from "lucide-react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFileUpload } from "@/hooks/use-file-upload";
import { SecureImage, isObjectStorageKey } from "@/components/secure-image";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";
function authH() {
  const t = localStorage.getItem("nexora_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function roleLabel(role: string) {
  if (role === "admin" || role === "admin_master") return { label: "Administrador", variant: "destructive" as const };
  if (role === "company") return { label: "Empresa", variant: "secondary" as const };
  return { label: "Técnico", variant: "default" as const };
}

interface TechProfile {
  id: number;
  name: string;
  photoUrl: string | null;
}

function AvatarSection({ userId }: { userId: number }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: tech } = useQuery<TechProfile>({
    queryKey: ["tech-profile-me"],
    queryFn: async () => {
      const res = await fetch(`${API}/technicians/me`, { headers: authH() as Record<string, string> });
      if (!res.ok) throw new Error();
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { uploadFile, isUploading } = useFileUpload({
    maxSizeMb: 5,
    accept: ["image/jpeg", "image/png", "image/webp"],
    onError: (e) => toast({ title: "Erro no upload", description: e.message, variant: "destructive" }),
  });

  const photoUrl = tech?.photoUrl ?? null;
  const initials = (tech?.name ?? "?")[0].toUpperCase();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!file.type.startsWith("image/")) {
      toast({ title: "Formato inválido", description: "Use JPG, PNG ou WebP.", variant: "destructive" });
      return;
    }

    const result = await uploadFile(file);
    if (!result) return;

    const res = await fetch(`${API}/technicians/me`, {
      method: "PUT",
      headers: { ...authH(), "Content-Type": "application/json" } as Record<string, string>,
      body: JSON.stringify({ photoUrl: result.objectKey }),
    });

    if (!res.ok) {
      toast({ title: "Erro ao salvar", description: "Não foi possível atualizar o avatar.", variant: "destructive" });
      return;
    }

    qc.invalidateQueries({ queryKey: ["tech-profile-me"] });
    qc.invalidateQueries({ queryKey: ["tech-avatar"] });
    toast({ title: "Foto atualizada!", description: "Seu avatar foi salvo com sucesso." });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Camera className="h-4 w-4 text-primary" />
          Foto do Perfil
        </CardTitle>
        <CardDescription className="text-xs">Sua foto aparece no seu perfil público e no cabeçalho.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-6">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
            {photoUrl && isObjectStorageKey(photoUrl) ? (
              <SecureImage
                objectKey={photoUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
                fallback={<span>{initials}</span>}
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          {isUploading && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">JPG, PNG ou WebP · Máximo 5 MB</p>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => fileRef.current?.click()}
            disabled={isUploading}
          >
            <Camera className="h-4 w-4" />
            {isUploading ? "Enviando..." : photoUrl ? "Alterar foto" : "Adicionar foto"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Perfil() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [deletePassword, setDeletePassword] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [exportingData, setExportingData] = useState(false);

  if (!user) return null;

  const { label, variant } = roleLabel(user.role);
  const apiBase = import.meta.env.BASE_URL.replace(/\/$/, "");

  async function handleExportData() {
    setExportingData(true);
    try {
      const token = localStorage.getItem("nexora_token");
      const res = await fetch(`${apiBase}/api/auth/export-data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Falha ao exportar dados");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nexorafield-meus-dados-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Dados exportados com sucesso!", description: "Arquivo JSON baixado para o seu dispositivo." });
    } catch {
      toast({ title: "Erro ao exportar", description: "Tente novamente em instantes.", variant: "destructive" });
    } finally {
      setExportingData(false);
    }
  }

  async function handleDeleteAccount() {
    if (!deletePassword) {
      toast({ title: "Senha obrigatória", description: "Digite sua senha para confirmar a exclusão.", variant: "destructive" });
      return;
    }
    setDeletingAccount(true);
    try {
      const token = localStorage.getItem("nexora_token");
      const res = await fetch(`${apiBase}/api/auth/account`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao excluir conta");
      toast({ title: "Conta excluída", description: "Seus dados foram removidos conforme a LGPD." });
      logout();
    } catch (err) {
      toast({ title: "Erro ao excluir", description: err instanceof Error ? err.message : "Tente novamente.", variant: "destructive" });
    } finally {
      setDeletingAccount(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie suas informações e privacidade</p>
      </div>

      {user.role === "technician" && <AvatarSection userId={user.id} />}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-primary" />
            Informações da Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" /> Nome
            </div>
            <span className="text-sm font-medium">{user.name}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" /> E-mail
            </div>
            <span className="text-sm font-medium">{user.email}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building className="h-4 w-4" /> Perfil
            </div>
            <Badge variant={variant}>{label}</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" /> Membro desde
            </div>
            <span className="text-sm font-medium">
              {new Date(user.createdAt ?? Date.now()).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </span>
          </div>
          <Separator />
          <div className="pt-1">
            <Link href="/alterar-senha">
              <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
                <Lock className="h-4 w-4" /> Alterar Senha
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-primary" />
            Privacidade e Dados (LGPD)
          </CardTitle>
          <CardDescription className="text-xs">
            Em conformidade com a Lei Geral de Proteção de Dados — Lei nº 13.709/2018.{" "}
            <Link href="/privacidade" className="text-primary hover:underline">Ver Política de Privacidade</Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-muted/40 border border-border">
            <div>
              <p className="text-sm font-medium">Exportar meus dados</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Baixe todos os seus dados em formato JSON (Art. 18, II da LGPD — Portabilidade).
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={handleExportData} disabled={exportingData}>
              <Download className="h-4 w-4" />
              {exportingData ? "Exportando..." : "Exportar dados"}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <div>
              <p className="text-sm font-medium text-destructive">Excluir minha conta</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Remove permanentemente todos os seus dados (Art. 18, VI da LGPD — Direito ao apagamento).
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2 shrink-0">
                  <Trash2 className="h-4 w-4" /> Excluir conta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir conta permanentemente?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação é <strong>irreversível</strong>. Todos os seus dados serão removidos permanentemente.
                    <br /><br />
                    Digite sua senha para confirmar:
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-2">
                  <Label htmlFor="delete-password" className="text-sm">Senha atual</Label>
                  <Input
                    id="delete-password"
                    type="password"
                    placeholder="Sua senha"
                    className="mt-1.5"
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeletePassword("")}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deletingAccount || !deletePassword}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {deletingAccount ? "Excluindo..." : "Sim, excluir minha conta"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <p className="text-xs text-muted-foreground pt-1">
            Consulte também:{" "}
            <Link href="/termos" className="text-primary hover:underline">Termos de Uso</Link>
            {" · "}
            <Link href="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
