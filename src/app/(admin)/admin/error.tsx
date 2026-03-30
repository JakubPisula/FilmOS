"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 p-4">
      <div className="bg-red-50 p-6 rounded-full text-red-500 border border-red-100 shadow-sm">
        <AlertTriangle size={48} />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-800">Coś poszło nie tak</h2>
        <p className="text-slate-500 max-w-md">
          Wystąpił nieoczekiwany błąd aplikacji. Spróbuj odświeżyć stronę lub wróć później.
        </p>
        {error.digest && (
          <p className="text-[10px] font-mono text-slate-400 mt-2 uppercase tracking-widest">
            ID: {error.digest}
          </p>
        )}
      </div>
      <Button onClick={() => reset()} className="gap-2">
        <RotateCcw size={18} /> Spróbuj ponownie
      </Button>
    </div>
  );
}
