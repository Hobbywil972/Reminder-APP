import { useState, useEffect } from 'react';

export default function NotificationOptionsEditor() {
  const [enabled, setEnabled] = useState(true);
  const [daysBefore, setDaysBefore] = useState(7);
  const [loading, setLoading] = useState(true);
  const [saveResult, setSaveResult] = useState(null);

  useEffect(() => {
    fetch('/api/admin/notification-options')
      .then(res => res.json())
      .then(data => {
        setEnabled(data.enabled !== false);
        setDaysBefore(data.daysBefore || 7);
        setLoading(false);
      });
  }, []);

  const handleSave = async e => {
    e.preventDefault();
    setSaveResult(null);
    const res = await fetch('/api/admin/notification-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled, daysBefore: Number(daysBefore) }),
    });
    if (res.ok) setSaveResult('Options sauvegardées !');
    else setSaveResult('Erreur lors de la sauvegarde');
  };

  return (
    <form onSubmit={handleSave} style={{ marginBottom: 24 }}>
      <label>
        <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
        Activer les notifications email
      </label>
      <label style={{ marginLeft: 16 }}>
        Délai avant échéance (jours)
        <input type="number" min={1} max={365} value={daysBefore} onChange={e => setDaysBefore(e.target.value)} style={{ width: 60, marginLeft: 8 }} />
      </label>
      <button type="submit" style={{ marginLeft: 16 }}>Sauvegarder</button>
      {saveResult && <span style={{ marginLeft: 16, color: saveResult.includes('sauvegardées') ? 'green' : 'red' }}>{saveResult}</span>}
    </form>
  );
}
