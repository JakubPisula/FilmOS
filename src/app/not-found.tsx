import Link from "next/link";
import { FileQuestion, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-6">
      <div className="bg-slate-100 p-8 rounded-full text-slate-400">
        <FileQuestion size={64} />
      </div>
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold text-slate-900">404</h1>
        <h2 className="text-xl font-semibold text-slate-600">Nie odnaleziono strony</h2>
        <p className="text-slate-500 max-w-sm">
          Przepraszamy, ale strona której szukasz nie istnieje lub została przeniesiona.
        </p>
      </div>
      <Button asChild className="gap-2">
        <Link href="/">
          <ChevronLeft size={18} /> Wróć do strony głównej
        </Link>
      </Button>
    </div>
  );
}
