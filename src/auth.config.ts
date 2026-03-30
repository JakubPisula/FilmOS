import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

// Konfiguracja bez adaptera bazy danych (bezpieczna dla Middleware/Edge)
export const authConfig = {
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: "Test Login",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Hasło", type: "password" },
      },
      async authorize(credentials) {
        console.log("Próba logowania z:", credentials);
        if (credentials?.email === "admin@filmos.pro") {
          console.log("Sukces autoryzacji admina");
          return {
            id: "1",
            email: "admin@filmos.pro",
            name: "Administrator",
            role: "ROLE_ADMIN",
          };
        }
        console.log("Błąd autoryzacji: email nie pasuje");
        return null;
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtectedRoute = nextUrl.pathname.startsWith("/admin") || nextUrl.pathname.startsWith("/dashboard");

      if (isProtectedRoute) {
        if (isLoggedIn) return true;
        return false;
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
