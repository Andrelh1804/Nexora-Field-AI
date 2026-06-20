import { useState } from "react";
import { useGetWallet, useListTransactions, useRequestWithdrawal } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const TYPE_LABELS: Record<string, string> = {
  credito: "Crédito", debito: "Débito", comissao: "Comissão",
  saque: "Saque", assinatura: "Assinatura", reembolso: "Reembolso", bonus: "Bônus",
};
const STATUS_COLORS: Record<string, string> = {
  pendente: "bg-yellow-500/10 text-yellow-400",
  concluida: "bg-green-500/10 text-green-400",
  cancelada: "bg-red-500/10 text-red-400",
  falhou: "bg-red-500/10 text-red-400",
};

export default function Carteira() {
  const { data: wallet, refetch: refetchWallet } = useGetWallet();
  const { data: transactions = [], refetch: refetchTx } = useListTransactions();
  const withdrawMutation = useRequestWithdrawal();
  const { toast } = useToast();

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState("");
  const [pixKey, setPixKey] = useState("");

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await withdrawMutation.mutateAsync({ data: { amount: Number(amount), pixKey } });
      await Promise.all([refetchWallet(), refetchTx()]);
      toast({ title: "Saque solicitado!", description: `R$ ${amount} será processado em 1-2 dias úteis.` });
      setShowWithdraw(false);
      setAmount("");
      setPixKey("");
    } catch (err: any) {
      toast({ title: "Erro", description: err?.data?.error || "Não foi possível solicitar o saque.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Carteira Digital</h1>

      {/* Balance cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader><CardTitle className="text-sm text-green-400">Saldo Disponível</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-400">
              R$ {wallet ? wallet.balance.toFixed(2) : "0,00"}
            </p>
            <Button size="sm" className="mt-3 w-full bg-green-600 hover:bg-green-700" onClick={() => setShowWithdraw(!showWithdraw)}>
              💸 Sacar
            </Button>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader><CardTitle className="text-sm text-yellow-400">Saldo Pendente</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-400">
              R$ {wallet ? wallet.pendingBalance.toFixed(2) : "0,00"}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Liberado após confirmação do chamado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Total Recebido</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">R$ {wallet ? wallet.totalEarned.toFixed(2) : "0,00"}</p>
            <p className="text-xs text-muted-foreground mt-2">Saques: R$ {wallet ? wallet.totalWithdrawn.toFixed(2) : "0,00"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal form */}
      {showWithdraw && (
        <Card className="border-green-500/30">
          <CardHeader><CardTitle>Solicitar Saque</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor (mín. R$ 50)</Label>
                  <Input type="number" min="50" max={wallet?.balance || 0} step="0.01"
                    value={amount} onChange={e => setAmount(e.target.value)} placeholder="50.00" required />
                </div>
                <div className="space-y-2">
                  <Label>Chave PIX</Label>
                  <Input value={pixKey} onChange={e => setPixKey(e.target.value)} placeholder="CPF, email ou telefone" />
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
                ⚠️ Prazo de processamento: 1–2 dias úteis. Taxa administrativa: R$ 0,00
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={withdrawMutation.isPending}>
                  {withdrawMutation.isPending ? "Processando..." : "Confirmar Saque"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowWithdraw(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Transactions */}
      <Card>
        <CardHeader><CardTitle>Extrato</CardTitle></CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma transação ainda.</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-card transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${tx.amount > 0 ? "bg-green-500/20" : "bg-red-500/20"}`}>
                      {tx.amount > 0 ? "+" : "−"}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {TYPE_LABELS[tx.type] || tx.type} · {new Date(tx.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={STATUS_COLORS[tx.status] || ""}>{tx.status}</Badge>
                    <span className={`font-bold ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                      {tx.amount > 0 ? "+" : ""}R$ {Math.abs(tx.amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
