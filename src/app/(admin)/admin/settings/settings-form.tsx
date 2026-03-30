"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Key, Database, LayoutGrid, CheckCircle2 } from "lucide-react";
import { saveConfigAction, saveNotionMappingAction } from "./actions";

export function SettingsForm({ 
  initialData 
}: { 
  initialData: {
    notionApiKey: string;
    clientsDbId: string;
    projectsDbId: string;
    notionMapping: any;
  }
}) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const handleSaveApi = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    await saveConfigAction("NOTION_API_KEY", formData.get("notionApiKey") as string);
    // Tutaj można dodać kolejne klucze (Google, Frame.io)
    
    setLoading(false);
    setSaved("api");
    setTimeout(() => setSaved(null), 3000);
  };

  const handleSaveNotion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    await saveConfigAction("NOTION_CLIENTS_DATABASE_ID", formData.get("clientsDbId") as string);
    await saveConfigAction("NOTION_PROJECTS_DATABASE_ID", formData.get("projectsDbId") as string);
    
    await saveNotionMappingAction({
      clientName: formData.get("clientName") as string,
      clientEmail: formData.get("clientEmail") as string,
      projectName: formData.get("projectName") as string,
      projectStatus: formData.get("projectStatus") as string,
    });
    
    setLoading(false);
    setSaved("notion");
    setTimeout(() => setSaved(null), 3000);
  };

  return (
    <Tabs defaultValue="api" className="space-y-4">
      <TabsList>
        <TabsTrigger value="api" className="gap-2"><Key size={16} /> Klucze API</TabsTrigger>
        <TabsTrigger value="notion" className="gap-2"><Database size={16} /> Mapowanie Notion</TabsTrigger>
        <TabsTrigger value="integrations" className="gap-2"><LayoutGrid size={16} /> Integracje</TabsTrigger>
      </TabsList>

      <TabsContent value="api">
        <form onSubmit={handleSaveApi}>
          <Card>
            <CardHeader>
              <CardTitle>Poświadczenia</CardTitle>
              <CardDescription>Wprowadź klucze dostępowe do zewnętrznych usług.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notionApiKey">Notion API Integration Token</Label>
                <Input name="notionApiKey" type="password" placeholder="secret_..." defaultValue={initialData.notionApiKey} />
              </div>
              <Button type="submit" disabled={loading} className="gap-2">
                {saved === "api" ? <CheckCircle2 size={16} className="text-green-400" /> : <Save size={16} />}
                {loading ? "Zapisywanie..." : saved === "api" ? "Zapisano!" : "Zapisz Klucze"}
              </Button>
            </CardContent>
          </Card>
        </form>
      </TabsContent>

      <TabsContent value="notion">
        <form onSubmit={handleSaveNotion}>
          <Card>
            <CardHeader>
              <CardTitle>Konfiguracja Baz i Kolumn</CardTitle>
              <CardDescription>Zdefiniuj identyfikatory baz i powiąż kolumny z polami systemu.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>ID Bazy Klientów</Label>
                  <Input name="clientsDbId" defaultValue={initialData.clientsDbId} placeholder="ID bazy danych Notion" />
                </div>
                <div className="space-y-2">
                  <Label>ID Bazy Projektów</Label>
                  <Input name="projectsDbId" defaultValue={initialData.projectsDbId} placeholder="ID bazy danych Notion" />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Mapowanie Kolumn (Baza Klientów)</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Pole: Nazwa Klienta</Label>
                    <Input name="clientName" defaultValue={initialData.notionMapping.clientName} placeholder="Nazwa kolumny" />
                  </div>
                  <div className="space-y-2">
                    <Label>Pole: Email Klienta</Label>
                    <Input name="clientEmail" defaultValue={initialData.notionMapping.clientEmail} placeholder="Nazwa kolumny" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Mapowanie Kolumn (Baza Projektów)</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Pole: Tytuł Projektu</Label>
                    <Input name="projectName" defaultValue={initialData.notionMapping.projectName} placeholder="Nazwa kolumny" />
                  </div>
                  <div className="space-y-2">
                    <Label>Pole: Status Projektu</Label>
                    <Input name="projectStatus" defaultValue={initialData.notionMapping.projectStatus} placeholder="Nazwa kolumny" />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="gap-2">
                {saved === "notion" ? <CheckCircle2 size={16} className="text-green-400" /> : <Save size={16} />}
                {loading ? "Zapisywanie..." : saved === "notion" ? "Zapisano!" : "Aktualizuj Mapowania"}
              </Button>
            </CardContent>
          </Card>
        </form>
      </TabsContent>
    </Tabs>
  );
}
