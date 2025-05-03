import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function DashboardDispatcher() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Attendre que la session soit chargée
    if (status === 'loading') {
      return; // Ne rien faire pendant le chargement
    }

    // Si pas authentifié, renvoyer vers la page de connexion
    if (status === 'unauthenticated' || !session) {
      console.log('[DashboardDispatcher] User not authenticated, redirecting to signin.');
      router.replace('/auth/signin');
      return;
    }

    // Redirection basée sur le rôle
    const userRole = session.role;
    console.log(`[DashboardDispatcher] User authenticated with role: ${userRole}. Redirecting...`);

    if (userRole === 'ADMIN') {
      router.replace('/admin');
    } else if (userRole === 'COMMERCIAL') {
      // Rediriger directement vers la page finale du dashboard commercial
      router.replace('/commercial/dashboard');
    } else {
      // Fallback pour d'autres rôles ou si le rôle est manquant
      console.warn(`[DashboardDispatcher] Rôle utilisateur inconnu ou manquant: ${userRole}. Redirection vers la page d'accueil.`);
      router.replace('/'); // Ou une page d'erreur/défaut
    }

  }, [status, session, router]);

  // Afficher un message pendant le chargement/redirection
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      Chargement de votre interface...
    </div>
  );
}
