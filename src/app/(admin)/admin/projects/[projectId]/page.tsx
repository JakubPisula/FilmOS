import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskStatus } from "@prisma/client";
import { KanbanBoard } from "./kanban-board";
import { AddTaskSheet } from "./add-task-sheet";

export default async function ProjectPage({
  params,
}: {
  params: { projectId: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      client: true,
      tasks: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">{project.name}</h2>
          <p className="text-slate-500">
            Klient: <span className="font-medium text-slate-700">{project.clientName || project.client?.name || "Brak"}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-xs uppercase px-3 py-1 border-primary/30 bg-primary/5 text-primary">
            {project.status}
          </Badge>
          <AddTaskSheet projectId={project.id} />
        </div>
      </div>

      <Tabs defaultValue="kanban" className="w-full">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="kanban" className="px-8">Tablica Kanban</TabsTrigger>
          <TabsTrigger value="list" className="px-8">Lista Zadań</TabsTrigger>
          <TabsTrigger value="time" className="px-8">Logi Czasu</TabsTrigger>
        </TabsList>
        
        <TabsContent value="kanban" className="mt-6">
          <KanbanBoard tasks={project.tasks} />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Wszystkie Zadania</CardTitle>
            </CardHeader>
            <CardContent>
              {project.tasks.length === 0 ? (
                <p className="text-slate-500 text-center py-8 italic">Brak zadań w tym projekcie.</p>
              ) : (
                <div className="space-y-2">
                  {project.tasks.map(task => (
                    <div key={task.id} className="p-3 border rounded-md hover:bg-slate-50 flex justify-between items-center group">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-[10px] w-20 justify-center">
                          {task.status}
                        </Badge>
                        <span className="font-medium text-slate-700">{task.title}</span>
                      </div>
                      <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        ID: {task.id.slice(-6)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="mt-6">
          <div className="bg-slate-50 border border-dashed rounded-lg p-12 text-center text-slate-500 italic">
            Sekcja logów czasu pracy jest dostępna na głównym pulpicie lub w raporcie projektu.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
