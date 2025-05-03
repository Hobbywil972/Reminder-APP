import { getCsrfToken } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function Login() {
  const [csrfToken, setCsrfToken] = useState(null);
  const [error, setError] = useState(null);
  const [loadingToken, setLoadingToken] = useState(true);

  useEffect(() => {
    console.log('[SignIn] Attempting to get CSRF token...');
    setLoadingToken(true);
    setError(null);
    getCsrfToken()
      .then(token => {
        if (token) {
          console.log('[SignIn] CSRF token received:', token);
          setCsrfToken(token);
        } else {
          console.error('[SignIn] CSRF token received but is null or undefined.');
          setError('Erreur interne lors de la récupération du token.');
        }
      })
      .catch(err => {
        console.error('[SignIn] Error fetching CSRF token:', err);
        setError(`Erreur lors de la récupération du token: ${err.message || 'Inconnue'}`);
      })
      .finally(() => {
        setLoadingToken(false);
      });
  }, []);

  if (loadingToken) {
    return <div style={{ color: 'blue', textAlign: 'center', marginTop: 40 }}>Chargement du token de sécurité...</div>;
  }

  if (error) {
    return <div style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>{error}</div>;
  }

  if (!csrfToken) {
    return <div style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>Impossible de charger le token de sécurité.</div>;
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
          <input name="csrfToken" type="hidden" value={csrfToken} />
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
        {/* Afficher l'erreur de connexion ici si nécessaire, distincte de l'erreur de token */}
      </div>
      <footer style={{ marginTop: 32, color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 1.3 }}>
        <div style={{ fontWeight: 700, color: '#00b3e6', fontSize: 15, letterSpacing: 1 }}>ReminderAPP</div>
        <div style={{ color: '#888', opacity: 0.85 }}>&copy; Willy GROMAT</div>
        <div style={{ color: '#888', opacity: 0.7 }}>v1.0</div>
      </footer>
    </div>
  );
}
