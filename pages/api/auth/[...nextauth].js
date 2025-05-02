import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Chargement du superadmin hors base
const SUPERADMIN_CONFIG_PATH = path.join(process.cwd(), 'config.superadmin.json');
let superadmin = null;
if (fs.existsSync(SUPERADMIN_CONFIG_PATH)) {
  const { email, passwordHash } = JSON.parse(fs.readFileSync(SUPERADMIN_CONFIG_PATH, 'utf-8'));
  superadmin = { email, passwordHash };
}

export const authOptions = {
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "none", // Important pour Vercel/HTTPS
        path: "/",
        secure: true, // Toujours true sur Vercel
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: 'Identifiants',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'votre@infodom.com' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
  try {
    console.log('[AUTH] Tentative connexion', credentials);

    if (!credentials?.email || !credentials?.password) {
      console.log('[AUTH] Credentials manquants');
      return null;
    }
    // Vérification superadmin hors base
    if (superadmin && credentials.email === superadmin.email) {
      const isSuperValid = await bcrypt.compare(credentials.password, superadmin.passwordHash);
      console.log('[AUTH] Superadmin?', isSuperValid);
      if (isSuperValid) {
        return { id: 'superadmin', name: 'Superadmin', email: superadmin.email, role: 'SUPERADMIN' };
      }
    }
    // Authentification classique via Prisma
    const user = await prisma.user.findUnique({ where: { email: credentials.email } });
    console.log('[AUTH] User trouvé ?', !!user);
    if (!user) return null;
    const isValid = await bcrypt.compare(credentials.password, user.password);
    console.log('[AUTH] Password valide ?', isValid);
    if (!isValid) return null;
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  } catch (err) {
    console.error('[AUTH] Erreur authorize:', err);
    throw err;
  }
},
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.name = user.name;
        console.log('[AUTH] JWT callback user:', user);
      } else {
        console.log('[AUTH] JWT callback token:', token);
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
        session.user.name = token.name;
        console.log('[AUTH] SESSION callback session:', session, 'token:', token);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
