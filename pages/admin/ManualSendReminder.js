import { useState, useEffect } from 'react';

export default function ManualSendReminder() {
  const [contracts, setContracts] = useState([]);
  const [selected, setSelected] = useState('');
  const [template, setTemplate] = useState('reminder');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [simuResult, setSimuResult] = useState(null);
  const [simuError, setSimuError] = useState(null);
  const [cronResult, setCronResult] = useState(null);
  const [cronError, setCronError] = useState(null);

  useEffect(() => {
    fetch('/api/admin/contracts')
      .then(res => res.json())
      .then(data => setContracts(data));
  }, []);

  const handleSend = async e => {
    e.preventDefault();
    setSending(true);
    setResult(null);
    setError(null);
    const res = await fetch('/api/admin/send-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractId: Number(selected), templateName: template }),
    });
    let text = '';
    try {
      text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch {}
      setSending(false);
      if (res.ok) {
        setResult(
          <div>
            <div style={{color:'green'}}>Email envoyé !</div>
            <div style={{marginTop:8, fontSize:13}}>
              <b>Modèle utilisé :</b> {data.templateUsed || template}<br/>
              <b>Objet :</b> {data.subject}<br/>
              <b>Corps :</b><br/>
              <pre style={{background:'#f8f8f8', padding:8, borderRadius:4, maxWidth:400, whiteSpace:'pre-wrap'}}>{data.body}</pre>
            </div>
          </div>
        );
      } else setError((data.error ? data.error : text) || 'Erreur lors de l’envoi');
    } catch (e) {
      setSending(false);
      setError('Erreur réseau ou parsing: ' + e.message);
    }
  };

  const handleSimulateRenewal = async e => {
    e.preventDefault();
    setSimuResult(null);
    setSimuError(null);
    if (!selected) return;
    try {
      const res = await fetch('/api/admin/simulate-renewal-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId: Number(selected) })
      });
      const data = await res.json();
      if (res.ok) {
        setSimuResult('Reminder simulé pour aujourd’hui !');
      } else {
        setSimuError(data.error || 'Erreur lors de la simulation');
      }
    } catch (e) {
      setSimuError('Erreur réseau: ' + e.message);
    }
  };

  const handleRunCron = async e => {
    e.preventDefault();
    setCronResult(null);
    setCronError(null);
    try {
      const res = await fetch('/api/cron-send-notifications', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setCronResult(`Cron exécuté ! Relances envoyées : ${data.relances ?? 0}, Expirations : ${data.expirations ?? 0}`);
      } else {
        setCronError(data.error || 'Erreur lors de l’exécution du cron');
      }
    } catch (e) {
      setCronError('Erreur réseau: ' + e.message);
    }
  };

  return (
    <form onSubmit={handleSend} style={{ border: '1px solid #eee', padding: 16, marginTop: 24, maxWidth: 500 }}>
      <h3>Envoi manuel/test d’une notification</h3>
      <div style={{ marginBottom: 8 }}>
        <label>Contrat&nbsp;:
          <select value={selected} onChange={e => setSelected(e.target.value)} required style={{ marginLeft: 8 }}>
            <option value="">-- Choisir un contrat --</option>
            {contracts.map(c => (
              <option key={c.id} value={c.id}>
                {c.client?.name} | {c.startDate?.slice(0,10)} | {c.status} | {c.email}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <button type="button" onClick={handleSimulateRenewal} disabled={!selected} style={{ marginRight: 12 }}>
          Simuler alerte de renouvellement
        </button>
        {simuResult && <span style={{ color: 'green', marginLeft: 8 }}>{simuResult}</span>}
        {simuError && <span style={{ color: 'red', marginLeft: 8 }}>{simuError}</span>}
      </div>
      <div style={{ marginBottom: 8 }}>
        <button type="button" onClick={handleRunCron}>
          Déclencher le cron de notifications
        </button>
        {cronResult && <span style={{ color: 'green', marginLeft: 8 }}>{cronResult}</span>}
        {cronError && <span style={{ color: 'red', marginLeft: 8 }}>{cronError}</span>}
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Modèle&nbsp;:
          <select value={template} onChange={e => setTemplate(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="reminder">Relance</option>
            <option value="expiration">Expiration</option>
            <option value="confirmation">Confirmation</option>
          </select>
        </label>
      </div>
      <button type="submit" disabled={sending || !selected}>Envoyer</button>
      {sending && <span style={{ marginLeft: 16 }}>Envoi en cours...</span>}
      {result && <span style={{ marginLeft: 16, color: 'green' }}>{result}</span>}
      {error && <span style={{ marginLeft: 16, color: 'red' }}>{error}</span>}
    </form>
  );
}
