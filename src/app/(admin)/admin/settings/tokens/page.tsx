import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ApiTokenManager } from "./api-token-manager";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function TokensPage() {
  const session = await auth();
  if (!session || (session.user as any).role !== 'ROLE_ADMIN') {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link 
          href="/admin/settings" 
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-primary transition-colors"
        >
          <ChevronLeft size={16} />
          Ustawienia
        </Link>
      </div>

      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Tokeny API</h2>
        <p className="text-slate-500">Zarządzaj dostępem dla wtyczki Adobe Premiere Pro.</p>
      </div>

      <ApiTokenManager />
    </div>
  );
}
