import { Client } from "@notionhq/client";

const notionApiKey = process.env.NOTION_API_KEY;

export const notion = notionApiKey ? new Client({
  auth: notionApiKey,
}) : null;
