import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
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
  FileVideo, 
  ExternalLink, 
  CheckCircle, 
  Clock,
  LayoutDashboard
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function ClientDashboard() {
  const session = await auth();
  if (!session || !session.user?.id) redirect("/login");

  // Znalezienie profilu klienta dla zalogowanego użytkownika
  const clientProfile = await prisma.client.findUnique({
    where: { userId: session.user.id },
    include: {
      projects: {
        orderBy: { updatedAt: 'desc' },
        include: {
          tasks: true
        }
      }
    }
  });

  if (!clientProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="bg-slate-100 p-6 rounded-full">
          <LayoutDashboard size={48} className="text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Brak profilu klienta</h2>
        <p className="text-slate-500 max-w-md">
          Twoje konto nie jest jeszcze powiązane z żadnym profilem klienta. 
          Skontaktuj się z administratorem FilmOS.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">Witaj, {clientProfile.name}!</h2>
          <p className="text-slate-500">Oto podsumowanie Twoich projektów i ich statusów.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <FileVideo size={18} /> Prześlij materiały
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <h3 className="text-xl font-semibold text-slate-700 flex items-center gap-2">
            <Video size={20} className="text-primary" /> Twoje Projekty
          </h3>
          
          <div className="grid gap-4">
            {clientProfile.projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
            {clientProfile.projects.length === 0 && (
              <Card className="border-dashed bg-slate-50">
                <CardContent className="py-12 text-center text-slate-400 italic">
                  Obecnie nie masz żadnych aktywnych projektów.
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-slate-700 flex items-center gap-2">
            <ExternalLink size={20} className="text-primary" /> Szybkie Linki
          </h3>
          <Card>
            <CardContent className="p-4 space-y-3">
              <QuickLink 
                icon={<FileVideo className="text-blue-500" />} 
                label="Dysk Google" 
                description="Miejsce na Twoje surowe materiały"
                href="#"
              />
              <QuickLink 
                icon={<Video className="text-purple-500" />} 
                label="Frame.io V4" 
                description="Przeglądaj wersje i dodawaj uwagi"
                href="#"
              />
              <QuickLink 
                icon={<ExternalLink className="text-orange-500" />} 
                label="Notion" 
                description="Harmonogram i dokumentacja"
                href="#"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: any }) {
  const totalTasks = project.tasks.length;
  const doneTasks = project.tasks.filter((t: any) => t.status === 'DONE').length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="text-lg font-bold text-slate-800">{project.name || project.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-tight">
                {project.status}
              </Badge>
              {project.frameIoProjectId && (
                <Badge variant="outline" className="text-[10px] uppercase text-purple-600 border-purple-200 bg-purple-50">
                  Frame.io gotowe
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/5">
            Szczegóły
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Postęp prac: {progress}%</span>
            <span>{doneTasks} / {totalTasks} zadań ukończonych</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickLink({ icon, label, description, href }: { icon: React.ReactNode, label: string, description: string, href: string }) {
  return (
    <a 
      href={href} 
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
    >
      <div className="mt-1 bg-white p-2 rounded-md shadow-sm border group-hover:shadow-md transition-all">
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-700">{label}</p>
        <p className="text-[11px] text-slate-400 leading-tight">{description}</p>
      </div>
    </a>
  );
}
