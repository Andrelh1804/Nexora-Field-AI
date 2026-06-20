import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const TYPE_ICONS: Record<string, string> = {
  novo_chamado:      "📋",
  chamado_aceito:    "✅",
  chamado_finalizado:"🎉",
  avaliacao_recebida:"⭐",
  pagamento_liberado:"💰",
  convite_despacho:  "🚀",
  assinatura_renovada:"🔄",
  saque_processado:  "💸",
};

export default function Notificacoes() {
  const { data: notifications = [], refetch } = useListNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();

  const unread = notifications.filter((n: any) => !n.read).length;

  const handleMarkRead = async (id: number) => {
    await markReadMutation.mutateAsync({ id });
    refetch();
  };

  const handleMarkAll = async () => {
    await markAllMutation.mutateAsync();
    refetch();
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Notificações</h1>
          {unread > 0 && <Badge className="bg-red-500 text-white">{unread} novas</Badge>}
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAll} disabled={markAllMutation.isPending}>
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-4xl mb-4">🔔</p>
            <p className="text-muted-foreground">Nenhuma notificação ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif: any) => (
            <Card
              key={notif.id}
              className={`cursor-pointer transition-all hover:border-primary/40 ${!notif.read ? "border-primary/20 bg-primary/5" : "border-border"}`}
              onClick={() => !notif.read && handleMarkRead(notif.id)}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-4">
                  <span className="text-2xl mt-0.5">{TYPE_ICONS[notif.type] || "🔔"}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`font-semibold ${!notif.read ? "text-foreground" : "text-muted-foreground"}`}>
                        {notif.title}
                      </p>
                      <div className="flex items-center gap-2">
                        {!notif.read && <span className="w-2 h-2 rounded-full bg-primary" />}
                        <span className="text-xs text-muted-foreground">
                          {new Date(notif.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
