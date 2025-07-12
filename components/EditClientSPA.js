import { useState, useEffect } from 'react';

export default function EditClientSPA({ client, onSuccess, onCancel, departementFixed = false }) {
  const [departements, setDepartements] = useState([]);
  const [departementId, setDepartementId] = useState(client?.departementId || '');
  const [name, setName] = useState(client?.name || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchDepartements = async () => {
      try {
        const res = await fetch('/api/admin/departements');
        if (res.ok) {
          setDepartements(await res.json());
        } else {
          console.error('Failed to fetch departements');
        }
      } catch (error) {
        console.error('Error fetching departements:', error);
      }
    };
    fetchDepartements();
  }, []);

  useEffect(() => {
    setName(client?.name || '');
    setDepartementId(client?.departementId || '');
  }, [client]);
    
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim()) {
      setError('Le nom du client est obligatoire');
      return;
    }
    const res = await fetch('/api/admin/clients', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: client.id, name, departementId }),
      credentials: 'include',
    });
    if (res.ok) {
      setSuccess('Client modifié avec succès');
      setTimeout(() => {
        setSuccess('');
        if (onSuccess) onSuccess();
      }, 1000);
    } else {
      const data = await res.json();
      setError(data.error || 'Erreur lors de la modification');
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '48px auto', fontFamily: 'Montserrat, sans-serif', background: '#fff', borderRadius: 18, boxShadow: '0 8px 28px #00b3e620', padding: '36px 32px 32px 32px' }}>
      <h2 style={{ color: '#00b3e6', fontWeight: 700, fontSize: 26, marginBottom: 28 }}>Modifier le client</h2>
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
        {!departementFixed && (
        <select
          value={departementId}
          onChange={e => setDepartementId(e.target.value)}
          style={{
            padding: 13,
            border: '1.5px solid #cce8f6',
            borderRadius: 10,
            background: '#f6fcff',
            fontSize: 17,
            outline: 'none',
            transition: 'border 0.2s',
            fontFamily: 'inherit',
            appearance: 'none'
          }}
        >
          {departements.map(dep => (
            <option key={dep.id} value={dep.id}>{dep.name}</option>
          ))}
        </select>
        )}
        <button
          type="submit"
          style={{
            background: '#00b3e6',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 16,
            padding: '12px 0',
            marginBottom: 10,
            cursor: 'pointer',
            width: '100%',
            fontFamily: 'Montserrat, sans-serif',
            boxShadow: '0 2px 8px #00b3e620',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            transition: 'background 0.12s',
          }}
          onMouseOver={e => (e.currentTarget.style.background = '#0090b3')}
          onMouseOut={e => (e.currentTarget.style.background = '#00b3e6')}
        >
          <span role="img" aria-label="crayon">✏️</span> Sauvegarder
        </button>
        {error && <div style={{ background: '#ffeaea', color: '#b90000', borderRadius: 8, padding: '8px 12px', fontWeight: 600, fontSize: 15, marginTop: 2, border: '1px solid #ffb3b3', textAlign: 'center' }}>{error}</div>}
        {success && <div style={{ background: '#e6fff6', color: '#008e4b', borderRadius: 8, padding: '8px 12px', fontWeight: 600, fontSize: 15, marginTop: 2, border: '1px solid #8ef2c0', textAlign: 'center' }}>{success}</div>}
      </form>
      <button
        onClick={onCancel}
        style={{
          background: '#f6fcff',
          color: '#00b3e6',
          border: '1.5px solid #cce8f6',
          padding: '11px 0',
          borderRadius: 10,
          fontWeight: 600,
          fontSize: 16,
          cursor: 'pointer',
          width: '100%',
          fontFamily: 'Montserrat, sans-serif',
          boxShadow: '0 2px 8px #00b3e620',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          transition: 'background 0.12s',
        }}
        onMouseOver={e => (e.currentTarget.style.background = '#e6f7fa')}
        onMouseOut={e => (e.currentTarget.style.background = '#f6fcff')}
      >
        <span role="img" aria-label="retour">↩️</span> Retour à la liste
      </button>
    </div>
  );
}
