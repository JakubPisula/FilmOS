import { prisma } from "@/lib/prisma";

export type NotionMapping = {
  clientName: string;
  clientEmail: string;
  projectName: string;
  projectStatus: string;
};

export async function setConfig(key: string, value: any) {
  const stringValue = typeof value === "string" ? value : JSON.stringify(value);
  return prisma.config.upsert({
    where: { key },
    update: { value: stringValue },
    create: { key, value: stringValue },
  });
}

export async function getConfig<T = any>(key: string): Promise<T | null> {
  const config = await prisma.config.findUnique({ where: { key } });
  if (!config) return null;
  
  try {
    return JSON.parse(config.value);
  } catch {
    return config.value as T;
  }
}

export async function getNotionMapping(): Promise<NotionMapping> {
  const mapping = await getConfig<NotionMapping>("notion_mapping");
  return mapping || {
    clientName: "Name",
    clientEmail: "Email",
    projectName: "Title",
    projectStatus: "Status",
  };
}
