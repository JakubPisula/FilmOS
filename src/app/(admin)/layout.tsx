import Link from "next/link";
import { LayoutDashboard, Users, CheckSquare, Settings, LogOut } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 border-r bg-white shadow-sm transition-all duration-300">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-xl text-primary">
            <span className="bg-primary text-primary-foreground p-1.5 rounded-md">F</span>
            <span>FilmOS Admin</span>
          </Link>
        </div>
        <nav className="p-4 space-y-1">
          <SidebarItem href="/admin/dashboard" icon={<LayoutDashboard size={20} />} label="Pulpit" />
          <SidebarItem href="/admin/clients" icon={<Users size={20} />} label="Klienci" />
          <SidebarItem href="/admin/tasks" icon={<CheckSquare size={20} />} label="Zlecenia" />
          <div className="pt-4 mt-4 border-t border-slate-100">
            <SidebarItem href="/admin/settings" icon={<Settings size={20} />} label="Ustawienia" />
            <button className="flex items-center w-full gap-3 rounded-lg px-3 py-2 text-slate-500 transition-all hover:bg-slate-100 hover:text-primary">
              <LogOut size={20} />
              <span>Wyloguj</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pl-64 transition-all duration-300">
        <header className="sticky top-0 z-10 h-16 border-b bg-white/80 px-8 backdrop-blur-sm flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-700 uppercase tracking-wider">Panel Administracyjny</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">Administrator</p>
              <p className="text-xs text-slate-400">admin@filmos.pro</p>
            </div>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-500 transition-all hover:bg-slate-100 hover:text-primary"
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}
