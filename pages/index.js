import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Attendre que la session soit chargée
    if (session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERADMIN') {
      router.replace('/admin');
    } else if (session?.user?.role === 'COMMERCIAL') {
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
