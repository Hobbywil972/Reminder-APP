import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  return (
    <button
      onClick={() => {
        // Call signOut and let it handle the redirection.
        signOut({ callbackUrl: '/auth/signin', redirect: true });
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
