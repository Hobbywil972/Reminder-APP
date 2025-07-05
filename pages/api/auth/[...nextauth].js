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
      // Rétablir la configuration originale
      name: process.env.NODE_ENV === "production"
        ? "next-auth.session-token" // NOTE: Vercel utilise souvent __Secure- préfixe par défaut
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      // Rétablir la configuration originale avec __Host-
      name: process.env.NODE_ENV === "production"
        ? "__Host-next-auth.csrf-token"
        : "next-auth.csrf-token",
      options: {
        // Correction : CSRF doit être accessible par le script client
        httpOnly: false,
        // Correction : Rétablir sameSite: 'none' pour la production comme initialement
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
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
        // Log d'entrée pour s'assurer que la fonction est appelée
        console.log(`[AUTH][AUTHORIZE ENTRY] Fonction authorize appelée avec email: ${credentials?.email}`);
        console.log('[NEXTAUTH][AUTHORIZE] Tentative avec credentials:', credentials);
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
          if (!user) {
              console.log('[AUTH] User not found in DB');
              return null;
          }
          const isValid = await bcrypt.compare(credentials.password, user.password);
          console.log('[AUTH] Password valide ?', isValid);
          if (!isValid) {
              console.log('[AUTH] Invalid password');
              return null;
          }
          console.log('[AUTH] Credentials valid, returning user object:', { id: user.id, name: user.name, email: user.email, role: user.role });
          return { id: user.id, name: user.name, email: user.email, role: user.role };
        } catch (err) {
          console.error('[AUTH] Erreur dans authorize:', err); // Log l'erreur
          // Retourner null pour indiquer un échec d'authentification à NextAuth
          return null;
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
      // Si 'user' existe (connexion ou refresh initial), on ajoute ses infos au token
      if (user) {
        console.log('[AUTH][JWT] Enriching token with user info:', user);
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        // Log explicite du rôle ajouté au token
        console.log(`[AUTH][JWT] Role added to token: ${token.role}`);
      }
      console.log('[AUTH][JWT] Returning token:', token);
      return token;
    },
    async session({ session, token }) {
      // Copier les infos pertinentes du token JWT vers l'objet session
      if (token && session.user) {
         console.log('[AUTH][SESSION] Enriching session with token info:', token);
        session.user.id = token.id; // Assurez-vous que l'ID est bien dans le token
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.role = token.role; // Assigner à session.user.role
        // Log explicite du rôle ajouté à la session
        console.log(`[AUTH][SESSION] Role added to session.user: ${session.user.role}`);
      } else {
          console.log('[AUTH][SESSION] No token or session.user found, returning original session.');
      }
        console.log('[AUTH][SESSION] Returning session:', session);
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
