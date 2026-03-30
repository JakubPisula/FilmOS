import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LogOut, Film } from "lucide-react";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Client Header */}
      <header className="h-16 border-b bg-white px-8 flex items-center justify-between sticky top-0 z-10">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary">
          <Film className="text-primary" />
          <span>FilmOS</span>
        </Link>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm font-medium">{session.user?.name}</p>
            <p className="text-xs text-slate-400">{session.user?.email}</p>
          </div>
          
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="flex items-center gap-2 text-slate-500 hover:text-destructive transition-colors">
              <LogOut size={18} />
              <span className="text-sm font-medium">Wyloguj</span>
            </button>
          </form>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
