import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateServiceOrder, ServiceOrderInputCategory } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function ChamadoNovo() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ServiceOrderInputCategory>("redes");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [address, setAddress] = useState("");
  const [value, setValue] = useState("");
  const [sla, setSla] = useState("");
  
  const createMutation = useCreateServiceOrder();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        data: {
          title,
          description,
          category,
          city,
          state,
          address,
          value: value ? Number(value) : undefined,
          sla,
        }
      });
      queryClient.invalidateQueries({ queryKey: ["/api/service-orders"] });
      toast({ title: "Sucesso", description: "Chamado criado com sucesso." });
      setLocation("/chamados");
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível criar o chamado.", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Novo Chamado</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-card p-6 rounded-lg border shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ServiceOrderInputCategory)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ServiceOrderInputCategory).map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="value">Valor (R$)</Label>
            <Input id="value" type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">Estado (UF)</Label>
            <Input id="state" value={state} onChange={(e) => setState(e.target.value)} required maxLength={2} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Endereço Completo</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sla">SLA (Prazo de Atendimento)</Label>
          <Input id="sla" value={sla} onChange={(e) => setSla(e.target.value)} placeholder="ex: 24 horas" />
        </div>
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Criando..." : "Criar Chamado"}
          </Button>
        </div>
      </form>
    </div>
  );
}
