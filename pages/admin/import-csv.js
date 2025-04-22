import { useState } from 'react';

export default function ImportCSV() {
  const [entity, setEntity] = useState('users');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setError(null);
    setLoading(true);
    const formData = new FormData();
    formData.append('entity', entity);
    formData.append('file', file);
    try {
      const res = await fetch('/api/admin/import-csv', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`Import réussi : ${data.count || 0} lignes importées.`);
      } else {
        setError(data.error || 'Erreur inconnue');
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <section style={{ maxWidth: 520, margin: '70px auto', fontFamily: 'Montserrat, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 4px 18px #00b3e620', padding: '38px 32px', maxWidth: 520, margin: '0 auto' }}>
        <a href="/admin" style={{ display: 'inline-block', marginBottom: 22, color: '#00b3e6', textDecoration: 'none', fontWeight: 700, fontSize: 16, borderRadius: 8, padding: '6px 16px', background: '#e6f7fa', transition: 'background 0.15s' }} onMouseOver={e => e.currentTarget.style.background = '#cce8f6'} onMouseOut={e => e.currentTarget.style.background = '#e6f7fa'}>&larr; Retour Admin</a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <span style={{ fontSize: 28, color: '#00b3e6', background: '#e6f7fa', borderRadius: '50%', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⬆️</span>
          <h1 style={{ color: '#00b3e6', fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 26, margin: 0, letterSpacing: 1 }}>Import CSV</h1>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 18 }}>
          <label style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>
            Type de données à importer :
            <select value={entity} onChange={e => setEntity(e.target.value)} style={{ marginLeft: 10, padding: '9px 16px', border: '1.5px solid #cce8f6', borderRadius: 10, fontSize: 15, fontFamily: 'Montserrat, sans-serif', outline: 'none', marginTop: 6, transition: 'border 0.15s' }}>
              <option value="users">Utilisateurs</option>
              <option value="clients">Clients</option>
              <option value="products">Produits</option>
            </select>
          </label>
          <input type="file" accept=".csv" onChange={e => setFile(e.target.files[0])} required style={{ border: '1.5px solid #cce8f6', borderRadius: 10, padding: '9px 16px', fontSize: 15, fontFamily: 'Montserrat, sans-serif', marginTop: 2 }} />
          <button type="submit" disabled={loading} style={{ background: '#00b3e6', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 0', fontWeight: 700, fontSize: 16, fontFamily: 'Montserrat, sans-serif', boxShadow: '0 2px 8px #00b3e620', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s', width: '100%' }} onMouseOver={e => { if (!loading) e.currentTarget.style.background = '#0090b3'; }} onMouseOut={e => { if (!loading) e.currentTarget.style.background = '#00b3e6'; }}>Importer</button>
        </form>
        {loading && <div style={{ background: '#e6f7fa', color: '#0090b3', padding: '10px 0', borderRadius: 8, textAlign: 'center', fontWeight: 600, marginTop: 18 }}>Import en cours...</div>}
        {result && <div style={{ background: '#eaffea', color: '#00b36b', padding: '10px 0', borderRadius: 8, textAlign: 'center', fontWeight: 600, marginTop: 18 }}>{result}</div>}
        {error && <div style={{ background: '#ffeaea', color: '#d6002a', padding: '10px 0', borderRadius: 8, textAlign: 'center', fontWeight: 600, marginTop: 18 }}>{error}</div>}
      </div>
    </section>
  );
}
