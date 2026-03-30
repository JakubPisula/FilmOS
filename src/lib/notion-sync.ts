import { Client } from '@notionhq/client'
import { TaskStatus } from '@prisma/client'

const notion = new Client({ auth: process.env.NOTION_TOKEN })

const STATUS_MAP: Record<TaskStatus, string> = {
  TODO: 'Do zrobienia',
  IN_PROGRESS: 'W trakcie',
  REVIEW: 'Recenzja',
  DONE: 'Gotowe',
  CANCELLED: 'Anulowane',
}

export async function syncNotionStatus(notionPageId: string | null, status: TaskStatus) {
  if (!notionPageId || !process.env.NOTION_TOKEN) return
  try {
    await notion.pages.update({
      page_id: notionPageId,
      properties: { 
        Status: { 
          status: { name: STATUS_MAP[status] } 
        } 
      },
    })
  } catch (err) {
    console.error('[notion-sync] Failed to sync status:', err)
    // NIE rzucaj wyjątku zgodnie z instrukcją
  }
}
