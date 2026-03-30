import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Video, 
  Clock, 
  CheckCircle2, 
  Play, 
  Square,
  AlertCircle
} from "lucide-react";
import { startOfDay } from "date-fns";
import { formatDuration } from "date-fns"; // Note: customized helper is better for our case

export default async function AdminDashboard() {
  const session = await auth();
  const userId = session?.user?.id;

  // Pobieranie danych StatCard
  const [projectCount, todoTaskCount, todayWorkLogs] = await Promise.all([
    prisma.project.count(),
    prisma.task.count({ where: { status: 'TODO' } }),
    prisma.workLog.findMany({
      where: {
        startedAt: { gte: startOfDay(new Date()) },
        endedAt: { not: null }
      }
    })
  ]);

  const todayTotalSec = todayWorkLogs.reduce((acc, log) => acc + (log.durationSec || 0), 0);

  // Pobieranie aktywnego timera
  const activeTimer = userId ? await prisma.workLog.findFirst({
    where: { userId, endedAt: null },
    include: { task: true }
  }) : null;

  // Ostatnie 5 wpisów
  const recentWorkLogs = await prisma.workLog.findMany({
    take: 5,
    orderBy: { startedAt: 'desc' },
    include: { task: true, user: true }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Pulpit</h2>
      </div>

      {activeTimer && (
        <ActiveTimerBanner 
          taskId={activeTimer.taskId} 
          taskTitle={activeTimer.task.title} 
          startedAt={activeTimer.startedAt} 
        />
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard 
          title="Projekty" 
          value={projectCount.toString()} 
          icon={<Video className="text-blue-600" />} 
          description="Wszystkie projekty w bazie" 
        />
        <StatCard 
          title="Zadania TODO" 
          value={todoTaskCount.toString()} 
          icon={<AlertCircle className="text-orange-600" />} 
          description="Oczekujące na realizację" 
        />
        <StatCard 
          title="Czas dzisiaj" 
          value={formatSeconds(todayTotalSec)} 
          icon={<Clock className="text-green-600" />} 
          description="Suma zalogowanego czasu" 
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ostatnia aktywność (WorkLogs)</CardTitle>
          <CardDescription>Ostatnie wpisy czasu pracy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentWorkLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="text-sm font-medium">{log.task.title}</p>
                  <p className="text-xs text-slate-500">
                    {log.user.name} • {new Date(log.startedAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatSeconds(log.durationSec || 0)}</p>
                  <p className="text-[10px] text-slate-400 uppercase">{log.source}</p>
                </div>
              </div>
            ))}
            {recentWorkLogs.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">Brak ostatnich wpisów.</p>
            )}
          </div>
        </CardContent>
      </Card>
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

function ActiveTimerBanner({ taskId, taskTitle, startedAt }: { taskId: string, taskTitle: string, startedAt: Date }) {
  return (
    <div className="bg-primary text-primary-foreground p-4 rounded-lg flex items-center justify-between shadow-lg animate-pulse">
      <div className="flex items-center gap-4">
        <div className="bg-white/20 p-2 rounded-full">
          <Play size={20} fill="currentColor" />
        </div>
        <div>
          <p className="text-xs opacity-80 uppercase font-bold tracking-wider">Aktywny Timer</p>
          <p className="font-semibold">{taskTitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-xs opacity-80 uppercase">Rozpoczęto</p>
          <p className="font-mono font-bold">{startedAt.toLocaleTimeString()}</p>
        </div>
        <Button variant="secondary" size="sm" className="gap-2">
          <Square size={14} fill="currentColor" /> Zatrzymaj
        </Button>
      </div>
    </div>
  );
}

function formatSeconds(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [
    h > 0 ? `${h}h` : null,
    m > 0 ? `${m}m` : null,
    s > 0 || (h === 0 && m === 0) ? `${s}s` : null
  ].filter(Boolean).join(' ');
}
