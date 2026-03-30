import { prisma } from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default async function TasksPage() {
  const projects = await prisma.project.findMany({
    include: { client: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Zlecenia</h2>
        <p className="text-slate-500">Monitoruj status wszystkich projektów wideo.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wszystkie Projekty</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tytuł Projektu</TableHead>
                <TableHead>Klient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ostatnia Aktualizacja</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    Brak aktywnych zleceń.
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.title}</TableCell>
                    <TableCell>{project.client.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={project.status} />
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Szczegóły</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Zakończone") {
    return (
      <Badge className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
        <CheckCircle2 size={12} className="mr-1" /> {status}
      </Badge>
    );
  }
  if (status === "W trakcie") {
    return (
      <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
        <Clock size={12} className="mr-1" /> {status}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-slate-500 border-slate-200">
      <AlertCircle size={12} className="mr-1" /> {status}
    </Badge>
  );
}
