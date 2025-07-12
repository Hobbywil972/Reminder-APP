import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session || !session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  const { id } = context.params;
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
    select: { id: true, name: true, email: true, role: true, departementId: true },
  });
  const departements = await prisma.departement.findMany({ orderBy: { name: 'asc' } });
  if (!user) {
    return { notFound: true };
  }
  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      departements: JSON.parse(JSON.stringify(departements)),
    },
  };
}

export default function EditUser({ user, departements }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    departementId: user.departementId || (departements[0]?.id || ''),
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // ensure departementId valid when switching role
    if (form.role === 'COMMERCIAL' && !form.departementId && departements.length > 0) {
      setForm(f => ({ ...f, departementId: departements[0].id }));
    }
  }, [form.role]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.name || !form.email || !form.role) {
      setError('Les champs nom, email et rôle sont obligatoires');
      return;
    }
    const res = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, ...form }),
    });
    if (res.ok) {
      setSuccess('Utilisateur mis à jour');
      setTimeout(() => router.push('/admin?section=users'), 1200);
    } else {
      const data = await res.json();
      setError(data.error || 'Erreur inattendue');
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: '60px auto', fontFamily: 'Montserrat, sans-serif', background: '#fff', borderRadius: 18, boxShadow: '0 8px 28px #00b3e620', padding: '36px 32px 32px 32px' }}>
      <h1 style={{ color: '#00b3e6', fontWeight: 700, fontSize: 26, marginBottom: 28 }}>Modifier l\'utilisateur</h1>
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
              marginTop: 4,
            }}
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
              marginTop: 4,
            }}
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
              marginTop: 4,
            }}
          >
            <option value="ADMIN">Administrateur</option>
            <option value="COMMERCIAL">Commercial</option>
          </select>
        </label>
        {form.role === 'COMMERCIAL' && (
          <label style={{ fontWeight: 600, color: '#222' }}>
            Département
            <select
              value={form.departementId}
              onChange={e => setForm({ ...form, departementId: e.target.value })}
              required
              style={{
                width: '100%',
                padding: 13,
                border: '1.5px solid #cce8f6',
                borderRadius: 10,
                background: '#f6fcff',
                fontSize: 17,
                outline: 'none',
                marginTop: 4,
              }}
            >
              {departements.map(dep => (
                <option key={dep.id} value={dep.id}>{dep.name}</option>
              ))}
            </select>
          </label>
        )}
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
          }}
        >
          Enregistrer
        </button>
        {error && <div style={{ background: '#ffeaea', color: '#b90000', borderRadius: 8, padding: '8px 12px', fontWeight: 600, fontSize: 15 }}>{error}</div>}
        {success && <div style={{ background: '#e6fff6', color: '#008e4b', borderRadius: 8, padding: '8px 12px', fontWeight: 600, fontSize: 15 }}>{success}</div>}
      </form>
      <button
        onClick={() => router.push('/admin?section=users')}
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
        }}
      >
        Retour
      </button>
    </main>
  );
}
