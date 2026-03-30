import { notion } from "@/lib/notion";
import { prisma } from "@/lib/prisma";
import { getNotionMapping, getConfig } from "./config-service";

export async function syncClientsFromNotion() {
  const databaseId = await getConfig("NOTION_CLIENTS_DATABASE_ID") || process.env.NOTION_CLIENTS_DATABASE_ID;
  if (!databaseId) throw new Error("Missing Notion Clients Database ID in config or env");

  const mapping = await getNotionMapping();
  const response = await notion.databases.query({
    database_id: databaseId,
  });

  for (const page of response.results) {
    if (!("properties" in page)) continue;

    const name = (page.properties[mapping.clientName] as any)?.title[0]?.plain_text;
    const email = (page.properties[mapping.clientEmail] as any)?.email;

    if (name && email) {
      await prisma.client.upsert({
        where: { email },
        update: {
          name,
          notionPageId: page.id,
        },
        create: {
          name,
          email,
          notionPageId: page.id,
        },
      });
    }
  }
}

export async function syncProjectsFromNotion() {
  const databaseId = await getConfig("NOTION_PROJECTS_DATABASE_ID") || process.env.NOTION_PROJECTS_DATABASE_ID;
  if (!databaseId) throw new Error("Missing Notion Projects Database ID in config or env");

  const mapping = await getNotionMapping();
  const response = await notion.databases.query({
    database_id: databaseId,
  });

  for (const page of response.results) {
    if (!("properties" in page)) continue;

    const title = (page.properties[mapping.projectName] as any)?.title[0]?.plain_text;
    const status = (page.properties[mapping.projectStatus] as any)?.select?.name || "W kolejce";
    const notionClientId = (page.properties.Client as any)?.relation[0]?.id; // Still assume Client relation is fixed

    if (title && notionClientId) {
      const client = await prisma.client.findUnique({
        where: { notionPageId: notionClientId },
      });

      if (client) {
        await prisma.project.upsert({
          where: { notionPageId: page.id },
          update: {
            title,
            status,
            clientId: client.id,
          },
          create: {
            title,
            status,
            clientId: client.id,
            notionPageId: page.id,
          },
        });
      }
    }
  }
}
