import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, FileVideo, ExternalLink, CheckCircle, Clock } from "lucide-react";

export default function ClientDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Twoje Aktywne Zlecenia</CardTitle>
            <CardDescription>Aktualny status prac nad Twoimi projektami</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ProjectCard
                title="Promo Video - Edycja Letnia"
                status="W trakcie montażu"
                progress={65}
                deadline="15 Kwietnia 2026"
                notionUrl="#"
              />
              <ProjectCard
                title="Wywiad Biznesowy - Seria 1"
                status="Czeka na recenzję"
                progress={90}
                deadline="02 Kwietnia 2026"
                notionUrl="#"
                needsReview
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Szybkie Akcje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start gap-2" variant="outline">
              <FileVideo size={18} />
              Prześlij materiały (Drive)
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline">
              <Video size={18} />
              Otwórz Frame.io V4
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline">
              <ExternalLink size={18} />
              Harmonogram (Calendar)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProjectCard({
  title,
  status,
  progress,
  deadline,
  notionUrl,
  needsReview = false,
}: {
  title: string;
  status: string;
  progress: number;
  deadline: string;
  notionUrl: string;
  needsReview?: boolean;
}) {
  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <div className="flex items-center gap-2 mt-1">
            {needsReview ? (
              <span className="flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 uppercase tracking-tight">
                <Clock size={12} /> Czeka na recenzję
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-tight">
                <CheckCircle size={12} /> {status}
              </span>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-slate-400">
          Szczegóły
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Postęp: {progress}%</span>
          <span>Termin: {deadline}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {needsReview && (
        <div className="pt-2">
          <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2">
            <Video size={18} />
            Przejdź do Recenzji (Frame.io)
          </Button>
        </div>
      )}
    </div>
  );
}
