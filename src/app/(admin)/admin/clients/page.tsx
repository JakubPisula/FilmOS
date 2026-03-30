import { prisma } from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Search, Mail, Folder } from "lucide-react";
import { Input } from "@/components/ui/input";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Klienci</h2>
          <p className="text-slate-500">Zarządzaj swoją bazą klientów zsynchronizowaną z Notion.</p>
        </div>
        <Button className="gap-2">
          <Plus size={18} /> Dodaj Klienta
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="search"
                placeholder="Szukaj klientów..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nazwa</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Dysk Google</TableHead>
                <TableHead>Status Notion</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    Brak klientów w bazie. Uruchom synchronizację z Notion.
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-slate-400" />
                        {client.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.driveFolderId ? (
                        <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
                          <Folder size={12} className="mr-1" /> Aktywny
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-400 border-slate-200">Brak folderu</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.notionPageId ? (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">Zsynchronizowano</Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-400 border-slate-200">Lokalny</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edytuj</Button>
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
