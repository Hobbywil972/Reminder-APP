import { getCsrfToken } from 'next-auth/react';
import { useState } from 'react';

export default function Login({ csrfToken }) {
  const [error, setError] = useState(null);

  if (!csrfToken) {
    return <div style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>Erreur de sécurité : CSRF Token manquant. Veuillez réessayer plus tard.</div>;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #f6fcff 0%, #e6f7fa 100%)',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <img src="/logo-infodom.png" alt="Infodom Logo" style={{ height: 64, marginBottom: 10 }} />
        <div style={{ color: '#00b3e6', fontSize: 18, fontWeight: 500, marginBottom: 8 }}>your cloud partner</div>
      </div>
      <div style={{
        background: '#fff',
        padding: 40,
        borderRadius: 18,
        boxShadow: '0 4px 32px #00b3e620',
        minWidth: 340,
        textAlign: 'center',
      }}>
        <h2 style={{ color: '#444', fontWeight: 700, marginBottom: 24 }}>Connexion</h2>
        <form method="post" action="/api/auth/callback/credentials" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            style={{
              padding: 12,
              borderRadius: 8,
              border: '1px solid #e0e0e0',
              fontSize: 16,
              marginBottom: 8,
            }}
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Mot de passe"
            style={{
              padding: 12,
              borderRadius: 8,
              border: '1px solid #e0e0e0',
              fontSize: 16,
              marginBottom: 8,
            }}
          />
          <button
            type="submit"
            style={{
              background: 'linear-gradient(90deg, #00b3e6 0%, #00e6d1 100%)',
              color: '#fff',
              fontWeight: 700,
              border: 'none',
              borderRadius: 8,
              padding: 14,
              fontSize: 18,
              cursor: 'pointer',
              marginTop: 10,
              transition: 'background 0.2s',
            }}
          >
            Se connecter
          </button>
        </form>
        {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
      </div>
      <footer style={{ marginTop: 32, color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 1.3 }}>
        <div style={{ fontWeight: 700, color: '#00b3e6', fontSize: 15, letterSpacing: 1 }}>ReminderAPP</div>
        <div style={{ color: '#888', opacity: 0.85 }}>&copy; Willy GROMAT</div>
        <div style={{ color: '#888', opacity: 0.7 }}>v1.0</div>
      </footer>
    </div>
  );
}


export async function getServerSideProps(context) {
  const csrfToken = await getCsrfToken({
    req: {
      headers: context.req.headers,
      cookies: context.req.cookies,
    }
  });
  return {
    props: {
      csrfToken: csrfToken ?? null,
    },
  };
}
