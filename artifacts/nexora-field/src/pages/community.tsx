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

const CAT_COLORS: Record<string, string> = { duvida: "bg-blue-500/20 text-blue-400", tutorial: "bg-green-500/20 text-green-400", dica: "bg-yellow-500/20 text-yellow-400", anuncio: "bg-red-500/20 text-red-400", debate: "bg-purple-500/20 text-purple-400", showcase: "bg-orange-500/20 text-orange-400" };
const CAT_LABELS: Record<string, string> = { duvida: "❓ Dúvida", tutorial: "📖 Tutorial", dica: "💡 Dica", anuncio: "📢 Anúncio", debate: "💬 Debate", showcase: "🌟 Showcase" };

export default function Community() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("todos");
  const [showNew, setShowNew] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "duvida", specialty: "" });
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [comment, setComment] = useState("");

  const { data: posts = [], isLoading } = useQuery({ queryKey: ["community", q, category], queryFn: () => authFetch(`/api/community/posts?${new URLSearchParams({ q, ...(category !== "todos" ? { category } : {}), limit: "30" })}`) });
  const { data: postDetail, refetch: refetchPost } = useQuery({ queryKey: ["community-post", selectedPost?.post?.id], queryFn: () => authFetch(`/api/community/posts/${selectedPost?.post?.id}`), enabled: !!selectedPost?.post?.id });

  const createPost = useMutation({ mutationFn: (data: any) => authFetch("/api/community/posts", { method: "POST", body: JSON.stringify(data) }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["community"] }); setShowNew(false); setNewPost({ title: "", content: "", category: "duvida", specialty: "" }); toast({ title: "Post publicado!" }); } });
  const upvote = useMutation({ mutationFn: (id: number) => authFetch(`/api/community/posts/${id}/upvote`, { method: "POST" }), onSuccess: () => qc.invalidateQueries({ queryKey: ["community"] }) });
  const addComment = useMutation({ mutationFn: ({ id, content }: any) => authFetch(`/api/community/posts/${id}/comments`, { method: "POST", body: JSON.stringify({ content }) }), onSuccess: () => { refetchPost(); setComment(""); toast({ title: "Comentário publicado!" }); } });

  if (selectedPost) {
    const p = postDetail || selectedPost;
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => setSelectedPost(null)} className="text-muted-foreground">← Voltar</Button>
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="space-y-1">
                <Badge className={`text-xs ${CAT_COLORS[p.category]}`}>{CAT_LABELS[p.category]}</Badge>
                <CardTitle className="text-xl">{p.title}</CardTitle>
              </div>
              <div className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("pt-BR")}</div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{p.content}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border pt-4">
              <span>👁 {p.views || 0} visualizações</span>
              <span>▲ {p.upvotes || 0} votos</span>
              {user && <Button size="sm" variant="outline" onClick={() => upvote.mutate(p.id)}>▲ Votar</Button>}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h3 className="font-semibold">{postDetail?.comments?.length || 0} Respostas</h3>
          {postDetail?.comments?.map((c: any) => (
            <Card key={c.comment?.id} className={c.comment?.accepted ? "border-green-500/30 bg-green-500/5" : ""}>
              <CardContent className="pt-4 space-y-2">
                {c.comment?.accepted && <Badge className="bg-green-500/20 text-green-400 border-green-500/30">✅ Resposta Aceita</Badge>}
                <p className="text-sm">{c.comment?.content}</p>
                <p className="text-xs text-muted-foreground">{c.author?.name} · {new Date(c.comment?.createdAt).toLocaleDateString("pt-BR")}</p>
              </CardContent>
            </Card>
          ))}

          {user && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <Textarea placeholder="Escreva sua resposta..." value={comment} onChange={e => setComment(e.target.value)} rows={3} />
                <Button onClick={() => addComment.mutate({ id: p.id, content: comment })} disabled={!comment.trim() || addComment.isPending}>
                  {addComment.isPending ? "Publicando..." : "Responder"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">💬 Comunidade</h1>
          <p className="text-muted-foreground mt-1">Fórum técnico para troca de conhecimento</p>
        </div>
        {user && <Button onClick={() => setShowNew(!showNew)}>+ Novo Post</Button>}
      </div>

      {showNew && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader><CardTitle>Criar Novo Post</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Título do post..." value={newPost.title} onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))} />
            <Textarea placeholder="Conteúdo..." value={newPost.content} onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))} rows={4} />
            <div className="flex gap-2">
              <Select value={newPost.category} onValueChange={v => setNewPost(p => ({ ...p, category: v }))}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(CAT_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Especialidade (opcional)" value={newPost.specialty} onChange={e => setNewPost(p => ({ ...p, specialty: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => createPost.mutate(newPost)} disabled={!newPost.title || !newPost.content || createPost.isPending}>
                {createPost.isPending ? "Publicando..." : "Publicar"}
              </Button>
              <Button variant="ghost" onClick={() => setShowNew(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Buscar posts..." value={q} onChange={e => setQ(e.target.value)} className="sm:max-w-xs" />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as categorias</SelectItem>
            {Object.entries(CAT_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <div className="animate-pulse text-muted-foreground">Carregando posts...</div> : (
        <div className="space-y-3">
          {posts.map((item: any) => (
            <Card key={item.post?.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setSelectedPost(item)}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.post?.pinned && <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">📌 Fixado</Badge>}
                      {item.post?.solved && <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">✅ Resolvido</Badge>}
                      <Badge className={`text-xs ${CAT_COLORS[item.post?.category]}`}>{CAT_LABELS[item.post?.category]}</Badge>
                    </div>
                    <p className="font-semibold hover:text-primary transition-colors">{item.post?.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{item.post?.content}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                      <span>{item.author?.name}</span>
                      <span>👁 {item.post?.views}</span>
                      <span>▲ {item.post?.upvotes}</span>
                      <span>{new Date(item.post?.createdAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {posts.length === 0 && <p className="text-muted-foreground text-center py-8">Nenhum post encontrado. Seja o primeiro a publicar!</p>}
        </div>
      )}
    </div>
  );
}
