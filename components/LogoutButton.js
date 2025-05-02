import { signOut } from 'next-auth/react';

// Fonction utilitaire pour supprimer tous les cookies NextAuth côté client
function clearNextAuthCookies() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const cookieNames = [
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.callback-url'
  ];
  cookieNames.forEach(name => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
  });
}

export default function LogoutButton() {
  return (
    <button
      onClick={() => {
        signOut({ callbackUrl: '/auth/signin', redirect: true });
        setTimeout(() => {
          document.cookie = '__Secure-next-auth.session-token=; Path=/; Secure; SameSite=None; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }, 500);
      }}
      style={{
        background: '#fff',
        color: '#ff4957',
        border: 'none',
        borderRadius: 10,
        fontWeight: 600,
        fontSize: 16,
        padding: '11px 22px',
        fontFamily: 'Montserrat, sans-serif',
        boxShadow: '0 2px 8px #ff495720',
        cursor: 'pointer',
        marginTop: 20,
        display: 'block',
        width: '100%'
      }}
    >
      Déconnexion
    </button>
  );
}
