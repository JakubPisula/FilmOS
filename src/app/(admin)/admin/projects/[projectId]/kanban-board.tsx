"use client";

import { Task, TaskStatus } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Clock, CheckCircle2, Circle } from "lucide-react";

interface KanbanBoardProps {
  tasks: Task[];
}

const COLUMNS: { status: TaskStatus; label: string; icon: any; color: string }[] = [
  { status: "TODO", label: "Do zrobienia", icon: Circle, color: "border-t-slate-300" },
  { status: "IN_PROGRESS", label: "W trakcie", icon: Clock, color: "border-t-blue-500" },
  { status: "REVIEW", label: "Recenzja", icon: AlertCircleIcon, color: "border-t-orange-500" },
  { status: "DONE", label: "Gotowe", icon: CheckCircle2, color: "border-t-green-500" },
];

function AlertCircleIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
  );
}

export function KanbanBoard({ tasks: initialTasks }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const getTasksByStatus = (status: TaskStatus) => tasks.filter(t => t.status === status);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {COLUMNS.map(col => {
        const columnTasks = getTasksByStatus(col.status);
        const Icon = col.icon;

        return (
          <div key={col.status} className="flex flex-col gap-4">
            <div className={`flex items-center justify-between border-t-4 ${col.color} bg-white p-3 rounded-b-lg shadow-sm`}>
              <div className="flex items-center gap-2">
                <Icon size={16} className="text-slate-400" />
                <h3 className="font-bold text-sm uppercase text-slate-700">{col.label}</h3>
              </div>
              <Badge variant="secondary" className="text-[10px]">{columnTasks.length}</Badge>
            </div>

            <div className="flex flex-col gap-3 min-h-[400px] bg-slate-100/50 p-2 rounded-lg border-2 border-dashed border-slate-200">
              {columnTasks.map(task => (
                <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold text-slate-700">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[9px] text-slate-300 font-mono">ID: {task.id.slice(-6)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {columnTasks.length === 0 && (
                <p className="text-[10px] text-slate-400 text-center py-8">Brak zadań</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
