import { NextResponse } from "next/server";
import { syncClientsFromNotion, syncProjectsFromNotion } from "@/services/notion-sync";

export async function POST(req: Request) {
  try {
    // In a real scenario, we would verify a secret token here
    // const authHeader = req.headers.get("authorization");
    // if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
    //   return new Response("Unauthorized", { status: 401 });
    // }

    const body = await req.json();
    console.log("Received Notion Webhook:", body);

    // Trigger sync based on payload or just sync everything for simplicity
    await syncClientsFromNotion();
    await syncProjectsFromNotion();

    return NextResponse.json({ success: true, message: "Sync triggered" });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ success: false, error: (error as any).message }, { status: 500 });
  }
}
