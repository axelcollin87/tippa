import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Konto",
      credentials: {
        email: { label: "E-postadress", type: "email", placeholder: "din@email.se" },
        password: { label: "Lösenord", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Alla fält måste fyllas i.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          throw new Error("Fel e-postadress eller lösenord.");
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);

        if (!isValidPassword) {
          throw new Error("Fel e-postadress eller lösenord.");
        }

        if (!user.isApproved) {
          throw new Error("Ditt konto väntar på att bli godkänt av en admin.");
        }

        return { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as any).isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string }
        });

        if (!dbUser || !dbUser.isApproved) {
          return { ...session, error: "UserNotFoundOrNotApproved" } as any;
        }

        session.user.id = token.id as string;
        session.user.isAdmin = dbUser.isAdmin;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login', 
  },
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
