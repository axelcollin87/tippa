import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
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

        if (!user || !user.password) {
          throw new Error("Fel e-postadress eller lösenord.");
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);

        if (!isValidPassword) {
          throw new Error("Fel e-postadress eller lösenord.");
        }

        return { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email }
        });

        if (!existingUser) {
          let desiredName = user.name || "Namnlös";
          let finalName = desiredName;
          let counter = 1;

          // Se till att namnet är unikt
          while (true) {
            const nameExists = await prisma.user.findFirst({
              where: { name: { equals: finalName, mode: 'insensitive' } }
            });
            if (!nameExists) break;
            
            // Om "Namnlös" finns, testa "Namnlös 2", "Namnlös 3" osv.
            counter++;
            finalName = `${desiredName} ${counter}`;
          }

          const newUser = await prisma.user.create({
            data: {
              email: user.email,
              name: finalName,
              isApproved: true,
              isAdmin: false,
            }
          });
          
          user.id = newUser.id;
          (user as any).isAdmin = newUser.isAdmin;
          return true;
        }

        // Koppla Google-ID:t till NextAuth-token genom att sätta ID:t
        user.id = existingUser.id;
        (user as any).isAdmin = existingUser.isAdmin;
        return true;
      }
      return true;
    },
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

        if (!dbUser) {
          return { ...session, error: "UserNotFound" } as any;
        }

        session.user.id = token.id as string;
        session.user.isAdmin = dbUser.isAdmin;
        // Alltid hämta det absolut senaste namnet från databasen till sessionen
        session.user.name = dbUser.name;
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
