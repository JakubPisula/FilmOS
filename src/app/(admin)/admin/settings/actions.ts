"use server";

import { setConfig } from "@/services/config-service";
import { revalidatePath } from "next/cache";

export async function saveConfigAction(key: string, value: string) {
  await setConfig(key, value);
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function saveNotionMappingAction(mapping: any) {
  await setConfig("notion_mapping", mapping);
  revalidatePath("/admin/settings");
  return { success: true };
}
