"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera } from "lucide-react";

export default function LoginPage() {
  const handleTestLogin = () => {
    signIn("credentials", { 
      email: "admin@filmos.pro", 
      password: "password123",
      callbackUrl: "/admin/admin/dashboard" 
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="p-3 bg-primary/10 rounded-full mb-2">
            <Camera className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Witaj w FilmOS</CardTitle>
          <CardDescription className="text-slate-500">
            Zaloguj się, aby zarządzać swoimi zleceniami
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <Button 
            onClick={handleTestLogin} 
            className="w-full py-6 text-lg font-semibold bg-slate-900 hover:bg-slate-800 transition-all shadow-md"
          >
            Testowe Logowanie Admina
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">Lub użyj Google</span>
            </div>
          </div>
          <Button 
            onClick={() => signIn("google", { callbackUrl: "/admin/admin/dashboard" })} 
            variant="outline" 
            className="w-full py-6 text-slate-600 border-slate-200"
          >
            Kontynuuj z Google
          </Button>
          <p className="text-center text-xs text-slate-400 mt-4 px-4">
            Dla testów użyj przycisku powyżej. Nie wymaga on konfiguracji kluczy API.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
