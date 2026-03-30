import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Users, Video, Clock, CheckCircle2 } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Przegląd Systemu</h2>
        <Button className="gap-2 bg-slate-800 hover:bg-slate-700">
          <RefreshCcw size={16} /> Synchronizuj z Notion
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Aktywni Klienci" value="12" icon={<Users className="text-blue-600" />} description="+2 w tym miesiącu" />
        <StatCard title="Projekty w Toku" value="8" icon={<Video className="text-orange-600" />} description="3 wymagają uwagi" />
        <StatCard title="Oczekujące Recenzje" value="5" icon={<Clock className="text-purple-600" />} description="Frame.io V4" />
        <StatCard title="Zakończone (30 dni)" value="24" icon={<CheckCircle2 className="text-green-600" />} description="Zsynchronizowane z Notion" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ostatnia Aktywność</CardTitle>
            <CardDescription>Powiadomienia z Notion i Frame.io</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ActivityItem
                title="Nowy Klient: Acme Corp"
                description="Folder Google Drive został utworzony automatycznie."
                time="2 min temu"
              />
              <ActivityItem
                title="Komentarz we Frame.io"
                description="Klient dodał uwagi do klatki 00:12:04 w projekcie 'Promo V2'."
                time="15 min temu"
              />
              <ActivityItem
                title="Synchronizacja Notion"
                description="Zmieniono status zadania 'Montaż końcowy' na Zakończone."
                time="1 godz. temu"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Systemu</CardTitle>
            <CardDescription>Monitoring integracji w czasie rzeczywistym</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <StatusItem label="Notion API" status="online" />
              <StatusItem label="PostgreSQL Replica" status="online" />
              <StatusItem label="Google Drive API" status="online" />
              <StatusItem label="Frame.io V4 API" status="online" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, description }: { title: string; value: string; icon: React.ReactNode; description: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-slate-500 uppercase">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-slate-400 mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function ActivityItem({ title, description, time }: { title: string; description: string; time: string }) {
  return (
    <div className="flex flex-col border-l-2 border-slate-100 pl-4 py-1">
      <h4 className="text-sm font-semibold">{title}</h4>
      <p className="text-xs text-slate-500">{description}</p>
      <span className="text-[10px] text-slate-400 mt-1 uppercase">{time}</span>
    </div>
  );
}

function StatusItem({ label, status }: { label: string; status: "online" | "offline" | "error" }) {
  const statusColors = {
    online: "bg-green-500",
    offline: "bg-slate-300",
    error: "bg-red-500",
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 capitalize">{status}</span>
        <div className={`h-2.5 w-2.5 rounded-full ${statusColors[status]}`} />
      </div>
    </div>
  );
}
