import { getConfig, getNotionMapping } from "@/services/config-service";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const notionApiKey = await getConfig("NOTION_API_KEY") || "";
  const clientsDbId = await getConfig("NOTION_CLIENTS_DATABASE_ID") || "";
  const projectsDbId = await getConfig("NOTION_PROJECTS_DATABASE_ID") || "";
  const notionMapping = await getNotionMapping();

  const initialData = {
    notionApiKey,
    clientsDbId,
    projectsDbId,
    notionMapping
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Ustawienia Systemu</h2>
        <p className="text-slate-500">Konfiguracja kluczy API, mapowań baz danych i automatyzacji.</p>
      </div>

      <SettingsForm initialData={initialData} />
    </div>
  );
}
