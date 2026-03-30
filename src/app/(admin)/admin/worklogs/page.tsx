import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { pl } from "date-fns/locale";
import { Clock, Calendar } from "lucide-react";

export default async function WorkLogsPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; userId?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { from, to, userId } = await searchParams;

  const startDate = from ? new Date(from) : startOfMonth(new Date());
  const endDate = to ? new Date(to) : endOfMonth(new Date());

  const workLogs = await prisma.workLog.findMany({
    where: {
      startedAt: { gte: startDate, lte: endDate },
      userId: userId || undefined,
      endedAt: { not: null }
    },
    include: {
      task: { include: { project: true } },
      user: true
    },
    orderBy: { startedAt: "desc" }
  });

  const totalSec = workLogs.reduce((acc, log) => acc + (log.durationSec || 0), 0);

  // Agregacja do wykresu (7 ostatnich dni)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return format(d, 'yyyy-MM-dd');
  });

  const chartData = last7Days.map(date => {
    const dayLogs = workLogs.filter(log => format(new Date(log.startedAt), 'yyyy-MM-dd') === date);
    const daySec = dayLogs.reduce((acc, log) => acc + (log.durationSec || 0), 0);
    return { date, hours: daySec / 3600 };
  });

  const maxHours = Math.max(...chartData.map(d => d.hours), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Raporty Czasu</h2>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-md border shadow-sm">
          <Calendar size={16} />
          <span>{format(startDate, 'd LLL', { locale: pl })} - {format(endDate, 'd LLL yyyy', { locale: pl })}</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Suma godzin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(totalSec / 3600).toFixed(1)}h</div>
            <p className="text-xs text-slate-400 mt-1">W wybranym okresie</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium text-slate-500 uppercase">Aktywność (ostatnie 7 dni)</CardTitle>
            </div>
            <Clock size={16} className="text-slate-300" />
          </CardHeader>
          <CardContent>
            <div className="h-24 flex items-end gap-2 px-2">
              {chartData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div 
                    className="w-full bg-primary/20 hover:bg-primary/40 transition-all rounded-t-sm"
                    style={{ height: `${(d.hours / maxHours) * 100}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {d.hours.toFixed(1)}h
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400 uppercase">{format(new Date(d.date), 'EEE', { locale: pl })}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wszystkie wpisy</CardTitle>
          <CardDescription>Szczegółowa lista zarejestrowanego czasu.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Użytkownik</TableHead>
                <TableHead>Projekt / Zadanie</TableHead>
                <TableHead>Źródło</TableHead>
                <TableHead className="text-right">Czas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs font-medium">
                    {format(new Date(log.startedAt), 'dd.MM.yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="text-sm">{log.user.name}</TableCell>
                  <TableCell>
                    <p className="text-sm font-semibold">{log.task.project.name}</p>
                    <p className="text-xs text-slate-500">{log.task.title}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase">
                      {log.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    {formatSeconds(log.durationSec || 0)}
                  </TableCell>
                </TableRow>
              ))}
              {workLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-400 italic">
                    Brak danych dla wybranego okresu.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function formatSeconds(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}
