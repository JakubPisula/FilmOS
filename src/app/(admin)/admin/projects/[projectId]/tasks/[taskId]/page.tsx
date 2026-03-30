import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { TaskHeader } from "./task-header";
import { WorklogManager } from "./worklog-manager";

export default async function TaskPage({
  params,
}: {
  params: { projectId: string; taskId: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { projectId, taskId } = await params;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: true,
      workLogs: {
        orderBy: { startedAt: "desc" },
      },
    },
  });

  if (!task || task.projectId !== projectId) notFound();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Link 
          href={`/admin/projects/${projectId}`} 
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-primary transition-colors"
        >
          <ChevronLeft size={16} />
          Wróć do projektu: <span className="font-semibold">{task.project.name}</span>
        </Link>
      </div>

      <TaskHeader task={task} />

      <div className="border-t pt-8">
        <WorklogManager taskId={task.id} workLogs={task.workLogs} />
      </div>
    </div>
  );
}
