import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
  console.log('[CLIENT][SESSION]', session, status);
    if (status === 'loading') return; // Attendre que la session soit chargée
    if (session && (session.role === 'ADMIN' || session.role === 'SUPERADMIN')) {
      router.replace('/admin');
    } else if (session && session.role === 'COMMERCIAL') {
      router.replace('/commercial');
    } else if (status === 'unauthenticated' || !session) {
      router.replace('/api/auth/signin');
    }
  }, [session, status, router]);

  return (
    <main style={{ textAlign: 'center', marginTop: 80 }}>
      <h1>Bienvenue sur Reminder-APP</h1>
      <p>Redirection en cours...</p>
    </main>
  );
}
