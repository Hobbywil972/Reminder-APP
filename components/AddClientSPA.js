import { useState } from 'react';

export default function AddClientSPA({ onSuccess, onCancel }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      setName('');
      setTimeout(() => {
        setSuccess('');
        if (onSuccess) onSuccess();
      }, 1000);
    } else {
      const data = await res.json();
      setError(data.error || 'Erreur lors de l\'ajout');
    }
  };

  return (
    <section style={{ maxWidth: 420, margin: '60px auto', fontFamily: 'Montserrat, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 4px 18px #00b3e620', padding: '38px 32px', maxWidth: 420, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <span style={{ fontSize: 28, color: '#00b3e6', background: '#e6f7fa', borderRadius: '50%', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>➕</span>
          <h2 style={{ color: '#00b3e6', fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 24, margin: 0, letterSpacing: 1 }}>Ajouter un client</h2>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 18 }}>
          <label style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>
            Nom du client
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ marginLeft: 0, marginTop: 8, padding: '10px 16px', border: '1.5px solid #cce8f6', borderRadius: 10, fontSize: 15, fontFamily: 'Montserrat, sans-serif', outline: 'none', transition: 'border 0.15s', width: '100%' }}
              required
              placeholder="Nom du client..."
            />
          </label>
          <button type="submit" style={{ background: '#00b3e6', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0', fontWeight: 700, fontSize: 16, fontFamily: 'Montserrat, sans-serif', boxShadow: '0 2px 8px #00b3e620', cursor: 'pointer', transition: 'background 0.15s', width: '100%' }} onMouseOver={e => e.currentTarget.style.background = '#0090b3'} onMouseOut={e => e.currentTarget.style.background = '#00b3e6'}>
            Ajouter
          </button>
          {error && <div style={{ background: '#ffeaea', color: '#d6002a', padding: '10px 0', borderRadius: 8, textAlign: 'center', fontWeight: 600, marginTop: 8 }}>{error}</div>}
          {success && <div style={{ background: '#eaffea', color: '#00b36b', padding: '10px 0', borderRadius: 8, textAlign: 'center', fontWeight: 600, marginTop: 8 }}>{success}</div>}
        </form>
        <button
          onClick={onCancel}
          style={{ marginTop: 26, background: '#f6fcff', color: '#00b3e6', border: '1.5px solid #cce8f6', borderRadius: 10, padding: '11px 0', fontWeight: 600, fontSize: 16, cursor: 'pointer', width: '100%', fontFamily: 'Montserrat, sans-serif', boxShadow: '0 2px 8px #00b3e620', transition: 'background 0.12s' }}
          onMouseOver={e => (e.currentTarget.style.background = '#e6f7fa')}
          onMouseOut={e => (e.currentTarget.style.background = '#f6fcff')}
        >
          <span role="img" aria-label="retour">↩️</span> Retour à la liste
        </button>
      </div>
    </section>
  );
}
