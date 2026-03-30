"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Loader2,
  ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ApiToken {
  id: string;
  label: string;
  lastUsed: string | null;
  createdAt: string;
  token?: string; // Tylko przy utworzeniu
}

export function ApiTokenManager() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchTokens();
  }, []);

  async function fetchTokens() {
    const res = await fetch("/api/tokens");
    if (res.ok) {
      const data = await res.json();
      setTokens(data);
    }
  }

  async function createToken() {
    setLoading(true);
    setNewToken(null);
    try {
      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewToken(data.token);
        setLabel("");
        fetchTokens();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteToken(id: string) {
    if (!confirm("Czy na pewno chcesz usunąć ten token? Wtyczka Premiere przestanie działać.")) return;
    
    try {
      const res = await fetch(`/api/tokens/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchTokens();
      }
    } catch (err) {
      console.error(err);
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generuj Nowy Token</CardTitle>
          <CardDescription>
            Użyj tego tokenu, aby zalogować się do wtyczki FilmOS w Adobe Premiere Pro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input 
                placeholder="Etykieta (np. Laptop Biuro)" 
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <Button onClick={createToken} disabled={loading || !label} className="gap-2">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
              Generuj Token
            </Button>
          </div>

          {newToken && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-green-700 font-bold mb-2">
                <ShieldCheck size={18} />
                Twój Nowy Token
              </div>
              <p className="text-xs text-green-600 mb-4">
                Skopiuj go teraz. Nie będziesz mógł go zobaczyć ponownie!
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white p-2 rounded border font-mono text-sm break-all">
                  {newToken}
                </code>
                <Button size="icon" variant="outline" onClick={() => copyToClipboard(newToken, "new")}>
                  {copiedId === "new" ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aktywne Tokeny</CardTitle>
          <CardDescription>Lista Twoich kluczy API używanych w aplikacjach zewnętrznych.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Etykieta</TableHead>
                <TableHead>Utworzono</TableHead>
                <TableHead>Ostatnio użyto</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.map((token) => (
                <TableRow key={token.id}>
                  <TableCell className="font-medium">{token.label}</TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {new Date(token.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {token.lastUsed ? (
                      <Badge variant="secondary" className="text-[10px]">
                        {new Date(token.lastUsed).toLocaleDateString()}
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Nigdy</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-destructive"
                      onClick={() => deleteToken(token.id)}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {tokens.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-400 italic">
                    Brak aktywnych tokenów.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
