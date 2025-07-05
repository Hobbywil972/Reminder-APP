import { getSession } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/router';

export async function getServerSideProps(context) {
  try {
    const session = await getSession(context);

    if (!session || !session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }
  return { props: {} };
  } catch (error) {
    console.error('ERROR in getServerSideProps /admin/users/add.js:', error);
    // En cas d'erreur inattendue, rediriger vers la page de connexion
    // Vous pourriez vouloir une page d'erreur plus spécifique ici
    return {
      redirect: {
        destination: '/auth/signin?error=ServerError',
        permanent: false,
      },
    };
  }
}

export default function AddUser() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'COMMERCIAL' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.name || !form.email || !form.password || !form.role) {
      setError('Tous les champs sont obligatoires');
      return;
    }
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
      credentials: 'include',
    });
    if (res.ok) {
      setSuccess('Utilisateur créé avec succès');
      setTimeout(() => router.push('/admin'), 1200);
    } else {
      const data = await res.json();
      setError(data.error || 'Erreur inconnue');
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: '60px auto', fontFamily: 'Montserrat, sans-serif', background: '#fff', borderRadius: 18, boxShadow: '0 8px 28px #00b3e620', padding: '36px 32px 32px 32px' }}>
      <h1 style={{ color: '#00b3e6', fontWeight: 700, fontSize: 26, marginBottom: 28 }}>Ajouter un utilisateur</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <label style={{ fontWeight: 600, color: '#222' }}>
          Nom
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
            style={{
              width: '100%',
              padding: 13,
              border: '1.5px solid #cce8f6',
              borderRadius: 10,
              background: '#f6fcff',
              fontSize: 17,
              outline: 'none',
              transition: 'border 0.2s',
              fontFamily: 'inherit',
              marginTop: 4
            }}
            onFocus={e => (e.target.style.border = '1.5px solid #00b3e6')}
            onBlur={e => (e.target.style.border = '1.5px solid #cce8f6')}
          />
        </label>
        <label style={{ fontWeight: 600, color: '#222' }}>
          Email
          <input
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
            style={{
              width: '100%',
              padding: 13,
              border: '1.5px solid #cce8f6',
              borderRadius: 10,
              background: '#f6fcff',
              fontSize: 17,
              outline: 'none',
              transition: 'border 0.2s',
              fontFamily: 'inherit',
              marginTop: 4
            }}
            onFocus={e => (e.target.style.border = '1.5px solid #00b3e6')}
            onBlur={e => (e.target.style.border = '1.5px solid #cce8f6')}
          />
        </label>
        <label style={{ fontWeight: 600, color: '#222' }}>
          Mot de passe
          <input
            type="password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
            style={{
              width: '100%',
              padding: 13,
              border: '1.5px solid #cce8f6',
              borderRadius: 10,
              background: '#f6fcff',
              fontSize: 17,
              outline: 'none',
              transition: 'border 0.2s',
              fontFamily: 'inherit',
              marginTop: 4
            }}
            onFocus={e => (e.target.style.border = '1.5px solid #00b3e6')}
            onBlur={e => (e.target.style.border = '1.5px solid #cce8f6')}
          />
        </label>
        <label style={{ fontWeight: 600, color: '#222' }}>
          Rôle
          <select
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
            style={{
              width: '100%',
              padding: 13,
              border: '1.5px solid #cce8f6',
              borderRadius: 10,
              background: '#f6fcff',
              fontSize: 17,
              outline: 'none',
              transition: 'border 0.2s',
              fontFamily: 'inherit',
              marginTop: 4
            }}
            onFocus={e => (e.target.style.border = '1.5px solid #00b3e6')}
            onBlur={e => (e.target.style.border = '1.5px solid #cce8f6')}
          >
            <option value="ADMIN">Administrateur</option>
            <option value="COMMERCIAL">Commercial</option>
          </select>
        </label>
        <button
          type="submit"
          style={{
            background: '#00b3e6',
            color: '#fff',
            border: 'none',
            padding: '12px 0',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 18,
            cursor: 'pointer',
            marginTop: 6,
            boxShadow: '0 2px 8px #00b3e620',
            transition: 'background 0.15s',
          }}
          onMouseOver={e => (e.currentTarget.style.background = '#0090b3')}
          onMouseOut={e => (e.currentTarget.style.background = '#00b3e6')}
        >
          Créer
        </button>
        {error && <div style={{ background: '#ffeaea', color: '#b90000', borderRadius: 8, padding: '8px 12px', fontWeight: 600, fontSize: 15, marginTop: 2, border: '1px solid #ffb3b3', textAlign: 'center' }}>{error}</div>}
        {success && <div style={{ background: '#e6fff6', color: '#008e4b', borderRadius: 8, padding: '8px 12px', fontWeight: 600, fontSize: 15, marginTop: 2, border: '1px solid #8ef2c0', textAlign: 'center' }}>{success}</div>}
      </form>
      <button
        onClick={() => router.push('/admin')}
        style={{
          marginTop: 28,
          background: '#f6fcff',
          color: '#00b3e6',
          border: '1.5px solid #cce8f6',
          padding: '11px 0',
          borderRadius: 10,
          fontWeight: 600,
          fontSize: 16,
          cursor: 'pointer',
          width: '100%',
          transition: 'background 0.12s',
        }}
        onMouseOver={e => (e.currentTarget.style.background = '#e6f7fa')}
        onMouseOut={e => (e.currentTarget.style.background = '#f6fcff')}
      >
        Retour au dashboard
      </button>
    </main>
  );
}
