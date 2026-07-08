import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const adminUser = await prisma.adminUser.findUnique({
          where: { email: credentials.email },
        });
        if (!adminUser) return null;

        const valid = await bcrypt.compare(credentials.password, adminUser.passwordHash);
        if (!valid) return null;

        return { id: adminUser.id, email: adminUser.email, tenantId: adminUser.tenantId };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.tenantId = user.tenantId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.tenantId = token.tenantId;
      return session;
    },
  },
};
