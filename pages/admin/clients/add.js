import { useState } from 'react';
import { useRouter } from 'next/router';

export default function AddClient() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim()) {
      setError('Le nom du client est obligatoire');
      return;
    }
    const res = await fetch('/api/admin/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
      credentials: 'include',
    });
    if (res.ok) {
      setSuccess('Client ajouté avec succès');
      setTimeout(() => router.push('/admin?section=clients'), 1200);
    } else {
      const data = await res.json();
      setError(data.error || 'Erreur lors de l\'ajout');
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '48px auto', fontFamily: 'Montserrat, sans-serif', background: '#fff', borderRadius: 18, boxShadow: '0 8px 28px #00b3e620', padding: '36px 32px 32px 32px' }}>
      <h2 style={{ color: '#00b3e6', fontWeight: 700, fontSize: 26, marginBottom: 28 }}>Ajouter un client</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <input
          type="text"
          placeholder="Nom du client"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{
            padding: 13,
            border: '1.5px solid #cce8f6',
            borderRadius: 10,
            background: '#f6fcff',
            fontSize: 17,
            outline: 'none',
            transition: 'border 0.2s',
            fontFamily: 'inherit',
          }}
          onFocus={e => (e.target.style.border = '1.5px solid #00b3e6')}
          onBlur={e => (e.target.style.border = '1.5px solid #cce8f6')}
        />
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
          Ajouter
        </button>
        {error && <div style={{ background: '#ffeaea', color: '#b90000', borderRadius: 8, padding: '8px 12px', fontWeight: 600, fontSize: 15, marginTop: 2, border: '1px solid #ffb3b3', textAlign: 'center' }}>{error}</div>}
        {success && <div style={{ background: '#e6fff6', color: '#008e4b', borderRadius: 8, padding: '8px 12px', fontWeight: 600, fontSize: 15, marginTop: 2, border: '1px solid #8ef2c0', textAlign: 'center' }}>{success}</div>}
      </form>
      <button
        onClick={() => router.push('/admin?section=clients')}
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
        Retour à la liste
      </button>
    </div>
  );
}
