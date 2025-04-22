import { getSession } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/router';

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session || session.user.role !== 'ADMIN') {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const userToEdit = await prisma.user.findUnique({
    where: { id: parseInt(context.params.id, 10) },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!userToEdit) {
    return { notFound: true };
  }
  return { props: { userToEdit } };
}

export default function EditUser({ userToEdit }) {
  const [form, setForm] = useState({ ...userToEdit, password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.name || !form.email || !form.role) {
      setError('Nom, email et rôle sont obligatoires');
      return;
    }
    const res = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: userToEdit.id,
        name: form.name,
        email: form.email,
        password: form.password ? form.password : undefined,
        role: form.role,
      }),
    });
    if (res.ok) {
      setSuccess('Utilisateur modifié avec succès');
      setTimeout(() => router.push('/admin'), 1200);
    } else {
      const data = await res.json();
      setError(data.error || 'Erreur inconnue');
    }
  }

  return (
    <main style={{ maxWidth: 400, margin: '60px auto', fontFamily: 'sans-serif' }}>
      <h1>Modifier un utilisateur</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label>
          Nom
          <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={{ width: '100%', padding: 8 }} />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required style={{ width: '100%', padding: 8 }} />
        </label>
        <label>
          Nouveau mot de passe (laisser vide pour ne pas changer)
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={{ width: '100%', padding: 8 }} />
        </label>
        <label>
          Rôle
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{ width: '100%', padding: 8 }}>
            <option value="ADMIN">Administrateur</option>
            <option value="COMMERCIAL">Commercial</option>
          </select>
        </label>
        <button type="submit" style={{ padding: 10, background: '#222', color: '#fff', border: 'none', borderRadius: 4 }}>Enregistrer</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
      </form>
      <button onClick={() => router.push('/admin')} style={{ marginTop: 24, background: '#ffe066', color: '#222', border: '1px solid #bfa100', padding: 8, borderRadius: 4, fontWeight: 'bold' }}>Retour au dashboard</button>
    </main>
  );
}
