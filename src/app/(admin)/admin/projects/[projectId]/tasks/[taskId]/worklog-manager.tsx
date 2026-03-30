"use client";

import { useState } from "react";
import { WorkLog } from "@prisma/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Play, Square, Loader2, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

interface WorklogManagerProps {
  taskId: string;
  workLogs: WorkLog[];
}

export function WorklogManager({ taskId, workLogs }: WorklogManagerProps) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const router = useRouter();

  const activeTimer = workLogs.find(log => !log.endedAt);

  async function startTimer() {
    setLoading(true);
    try {
      const response = await fetch("/api/worklogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          startedAt: new Date().toISOString(),
          note,
          source: "MANUAL"
        }),
      });

      if (response.ok) {
        setNote("");
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function stopTimer(logId: string) {
    setLoading(true);
    try {
      const response = await fetch(`/api/worklogs/${logId}/stop`, {
        method: "POST",
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Rejestracja Czasu</CardTitle>
          <CardDescription>Uruchom timer lub dodaj wpis manualny.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note">Notatka do sesji</Label>
            <Input 
              id="note" 
              placeholder="Co robisz?" 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={!!activeTimer}
            />
          </div>

          {activeTimer ? (
            <div className="space-y-4">
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                  Timer Aktywny
                </div>
                <div className="font-mono text-sm">
                  {new Date(activeTimer.startedAt).toLocaleTimeString()}
                </div>
              </div>
              <Button 
                variant="destructive" 
                className="w-full gap-2" 
                onClick={() => stopTimer(activeTimer.id)}
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Square size={18} fill="currentColor" />}
                Zatrzymaj
              </Button>
            </div>
          ) : (
            <Button className="w-full gap-2" onClick={startTimer} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
              Uruchom Timer
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Historia Logów</CardTitle>
            <Clock size={18} className="text-slate-400" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Notatka</TableHead>
                <TableHead className="text-right">Czas trwania</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workLogs.filter(log => log.endedAt).map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs">
                    {new Date(log.startedAt).toLocaleDateString()}
                    <br />
                    <span className="text-slate-400">
                      {new Date(log.startedAt).toLocaleTimeString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm italic">{log.note || "-"}</TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatSeconds(log.durationSec || 0)}
                  </TableCell>
                </TableRow>
              ))}
              {workLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-slate-400 italic">
                    Brak zarejestrowanego czasu.
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
  return [
    h > 0 ? `${h}h` : null,
    m > 0 ? `${m}m` : null,
    s > 0 ? `${s}s` : null
  ].filter(Boolean).join(' ') || "0s";
}
