import { useState } from 'react';

export default function ExportCSV() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async (entity) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/export-csv');
      const data = await res.json();
      if (!data[entity]) throw new Error('Aucune donnée pour ' + entity);
      // Décoder le base64 et déclencher le téléchargement
      const blob = new Blob([Uint8Array.from(atob(data[entity]), c => c.charCodeAt(0))], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = entity + '.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
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
          <span style={{ fontSize: 28, color: '#00b3e6', background: '#e6f7fa', borderRadius: '50%', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⬇️</span>
          <h1 style={{ color: '#00b3e6', fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 26, margin: 0, letterSpacing: 1 }}>Export CSV</h1>
        </div>
        <p style={{ color: '#444', fontSize: 15, marginBottom: 20 }}>Cliquez pour télécharger les données au format CSV :</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          {['users','clients','products','contracts','contractProducts'].map(entity => (
            <button
              key={entity}
              onClick={() => handleDownload(entity)}
              style={{ padding: '12px 0', background: '#00b3e6', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', width: '100%', fontWeight: 700, fontSize: 16, fontFamily: 'Montserrat, sans-serif', boxShadow: '0 2px 8px #00b3e620', transition: 'background 0.15s' }}
              disabled={loading}
              onMouseOver={e => e.currentTarget.style.background = '#0090b3'}
              onMouseOut={e => e.currentTarget.style.background = '#00b3e6'}
            >
              Télécharger {entity}.csv
            </button>
          ))}
        </div>
        {loading && <div style={{ background: '#e6f7fa', color: '#0090b3', padding: '10px 0', borderRadius: 8, textAlign: 'center', fontWeight: 600, marginBottom: 8 }}>Téléchargement en cours...</div>}
        {error && <div style={{ background: '#ffeaea', color: '#d6002a', padding: '10px 0', borderRadius: 8, textAlign: 'center', fontWeight: 600, marginBottom: 8 }}>{error}</div>}
      </div>
    </section>
  );
}
