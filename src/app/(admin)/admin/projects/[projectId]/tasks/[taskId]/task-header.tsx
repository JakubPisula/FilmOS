"use client";

import { useState } from "react";
import { Task, TaskStatus } from "@prisma/client";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Edit2, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface TaskHeaderProps {
  task: Task;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "TODO", label: "Do zrobienia" },
  { value: "IN_PROGRESS", label: "W trakcie" },
  { value: "REVIEW", label: "Recenzja" },
  { value: "DONE", label: "Gotowe" },
  { value: "CANCELLED", label: "Anulowane" },
];

export function TaskHeader({ task }: TaskHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function updateTask(data: Partial<Task>) {
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        router.refresh();
        setIsEditing(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl font-bold h-12"
              />
              <Button size="icon" onClick={() => updateTask({ title })} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)}>
                <X size={18} />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h2 className="text-3xl font-bold tracking-tight text-slate-800">{task.title}</h2>
              <button 
                onClick={() => setIsEditing(true)}
                className="text-slate-300 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 size={18} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="h-10 px-4 text-xs font-mono">
            ID: {task.id}
          </Badge>
          <Select 
            defaultValue={task.status} 
            onValueChange={(value) => updateTask({ status: value as TaskStatus })}
            disabled={loading}
          >
            <SelectTrigger className="w-[180px] h-10 font-medium">
              <SelectValue placeholder="Zmień status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {task.description && !isEditing && (
        <p className="text-slate-500 max-w-3xl">{task.description}</p>
      )}
    </div>
  );
}
