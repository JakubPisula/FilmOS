import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Camera, ShieldCheck, UserCircle2, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center gap-2" href="#">
          <Camera className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl tracking-tighter">FilmOS</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="container px-4 md:px-6 py-12">
          <div className="flex flex-col items-center space-y-4 text-center mb-12">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              Zautomatyzuj swój workflow wideo
            </h1>
            <p className="mx-auto max-w-[700px] text-slate-500 md:text-xl">
              Zintegruj Notion, PostgreSQL, Google Drive i Frame.io w jednym, potężnym systemie FilmOS.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            <Card
              title="Panel Administracyjny"
              description="Zarządzaj zleceniami, klientami i automatyzacją z poziomu freelancera."
              icon={<ShieldCheck className="h-10 w-10 text-primary" />}
              href="/admin/dashboard"
              buttonText="Wejdź jako Admin"
            />
            <Card
              title="Panel Klienta"
              description="Monitoruj postępy, przesyłaj materiały i akceptuj wersje wideo."
              icon={<UserCircle2 className="h-10 w-10 text-primary" />}
              href="/dashboard"
              buttonText="Wejdź jako Klient"
              variant="outline"
            />
          </div>
        </div>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-slate-500">© 2026 FilmOS. Wszystkie prawa zastrzeżone.</p>
      </footer>
    </div>
  );
}

function Card({
  title,
  description,
  icon,
  href,
  buttonText,
  variant = "default",
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  buttonText: string;
  variant?: "default" | "outline";
}) {
  return (
    <div className="flex flex-col items-center space-y-4 p-8 bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
      <div className="p-3 bg-slate-50 rounded-full">{icon}</div>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="text-slate-500 text-center">{description}</p>
      <Link href={href} className="w-full">
        <Button variant={variant} className="w-full gap-2 group">
          {buttonText}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </Link>
    </div>
  );
}
