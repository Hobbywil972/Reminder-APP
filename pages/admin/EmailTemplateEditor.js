import { useState, useEffect } from 'react';
import EmailTemplatePreview from './EmailTemplatePreview';

const MODELS = [
  { value: 'reminder', label: 'Relance' },
  { value: 'expiration', label: 'Expiration' },
  { value: 'confirmation', label: 'Confirmation' },
];

export default function EmailTemplateEditor() {
  const [model, setModel] = useState('reminder');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveResult, setSaveResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/email-template?name=${model}`)
      .then(res => res.json())
      .then(data => {
        setSubject(data.subject || '');
        setBody(data.body || '');
        setLoading(false);
      });
  }, [model]);

  const handleSave = async e => {
    e.preventDefault();
    setSaveResult(null);
    const res = await fetch('/api/admin/email-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model, subject, body }),
    });
    if (res.ok) setSaveResult('Modèle sauvegardé !');
    else setSaveResult('Erreur lors de la sauvegarde');
  };

  return (
    <form onSubmit={handleSave} style={{ marginBottom: 24 }}>
      <label>Type de mail&nbsp;
        <select value={model} onChange={e => setModel(e.target.value)} style={{ marginLeft: 8, marginBottom: 8 }}>
          {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </label>
      <label>Objet de l’email
        <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required style={{ width: '100%' }} />
      </label>
      <label>Corps de l’email
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={6} required style={{ width: '100%' }} />
      </label>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
        Variables disponibles : {'{client}', '{produits}', '{date}', '{statut}', '{lien_renouvellement}'}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button type="submit">Sauvegarder</button>
        <button type="button" onClick={() => setShowPreview(p => !p)}>{showPreview ? 'Masquer' : 'Aperçu'}</button>
        {saveResult && <span style={{ marginLeft: 16, color: saveResult.includes('sauvegardé') ? 'green' : 'red' }}>{saveResult}</span>}
      </div>
      {showPreview && <EmailTemplatePreview subject={subject} body={body} />}
    </form>
  );
}
