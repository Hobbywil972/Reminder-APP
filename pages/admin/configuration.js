import { useState, useEffect, useRef } from 'react';

import EmailTemplateEditor from './EmailTemplateEditor';
import NotificationOptionsEditor from './NotificationOptionsEditor';
import ManualSendReminder from './ManualSendReminder';

const EmailConfig = () => {
  return (
    <div>
      <h2>Modèle d’email de notification</h2>
      <EmailTemplateEditor />
    </div>
  );
};

const NotificationConfig = () => {
  return (
    <div>
      <h2>Options de notifications</h2>
      <NotificationOptionsEditor />
    </div>
  );
};

export default function Configuration({ user }) {
  // SMTP State
  const [smtp, setSmtp] = useState({
    host: '',
    port: '',
    user: '',
    pass: '',
    from: '',
  });
  const [smtpTestResult, setSmtpTestResult] = useState(null);
  const [smtpSaveResult, setSmtpSaveResult] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Branding
  const [branding, setBranding] = useState({ name: '', logoUrl: null });
  const [brandingSaveResult, setBrandingSaveResult] = useState(null);
  const logoInputRef = useRef();

  useEffect(() => {
    // Charger la config SMTP existante
    fetch('/api/admin/configuration')
      .then(res => res.json())
      .then(data => {
        setSmtp(s => ({ ...s, ...data }));
        setLoading(false);
      });
  }, []);

  // Handlers
  const handleSmtpChange = e => {
    setSmtp({ ...smtp, [e.target.name]: e.target.value });
  };

  const handleSmtpSave = async e => {
    e.preventDefault();
    setSmtpSaveResult(null);
    const res = await fetch('/api/admin/configuration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(smtp),
    });
    if (res.ok) {
      setSmtpSaveResult('Paramètres sauvegardés !');
    } else {
      const data = await res.json();
      setSmtpSaveResult(data.error || 'Erreur lors de la sauvegarde');
    }
  };

  const handleSmtpTest = async e => {
    e.preventDefault();
    setSmtpTestResult(null);
    const to = prompt("Entrez une adresse email de test (destinataire)");
    if (!to) return;
    const res = await fetch('/api/admin/configuration', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...smtp, to }),
    });
    const data = await res.json();
    if (res.ok) {
      setSmtpTestResult('Email de test envoyé avec succès !');
    } else {
      setSmtpTestResult(data.error || 'Erreur lors du test SMTP');
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/contracts/export');
      if (!res.ok) throw new Error('Erreur lors de la génération du CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contrats.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message);
    }
    setExporting(false);
  };

  // Branding handlers
  const handleBrandingNameChange = e => {
    setBranding({ ...branding, name: e.target.value });
  };
  const handleBrandingSave = async e => {
    e.preventDefault();
    setBrandingSaveResult(null);
    const res = await fetch('/api/admin/branding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: branding.name }),
    });
    if (res.ok) {
      setBrandingSaveResult('Nom sauvegardé !');
    } else {
      const data = await res.json();
      setBrandingSaveResult(data.error || 'Erreur lors de la sauvegarde');
    }
  };
  const handleLogoUpload = async e => {
    setBrandingSaveResult(null);
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/png')) {
      setBrandingSaveResult('Logo PNG requis');
      return;
    }
    if (file.size > 1024 * 1024) {
      setBrandingSaveResult('Logo trop volumineux (max 1Mo)');
      return;
    }
    const res = await fetch('/api/admin/branding', {
      method: 'PUT',
      headers: {},
      body: file,
    });
    if (res.ok) {
      setBranding(b => ({ ...b, logoUrl: '/logo.png?' + Date.now() })); // for cache busting
      setBrandingSaveResult('Logo mis à jour !');
      logoInputRef.current.value = '';
    } else {
      const data = await res.json();
      setBrandingSaveResult(data.error || 'Erreur upload logo');
    }
  };

  return (
    <section style={{ maxWidth: 700, margin: '40px auto', padding: 0, fontFamily: 'Montserrat, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 22, boxShadow: '0 6px 32px #00b3e626', padding: '40px 36px', maxWidth: 700, margin: '0 auto' }}>
        <h1 style={{ color: '#00b3e6', fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 32, marginBottom: 28, letterSpacing: 1 }}>Configuration</h1>

        {/* Branding */}
        <h2 style={{ color: '#00b3e6', fontSize: 22, fontWeight: 700, marginTop: 0, marginBottom: 10 }}>Nom de l'application / organisation</h2>
        <form onSubmit={handleBrandingSave} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <label style={{ fontWeight: 600, fontSize: 16, flex: 1 }}>
            Nom affiché
            <input type="text" value={branding.name} onChange={handleBrandingNameChange} required style={{ display: 'block', width: '100%', marginTop: 6, padding: '10px 14px', border: '1.5px solid #cce8f6', borderRadius: 10, fontSize: 16, fontFamily: 'Montserrat, sans-serif', outline: 'none', transition: 'border 0.15s' }} />
          </label>
          <button type="submit" style={{ background: '#00b3e6', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 26px', fontWeight: 700, fontSize: 16, fontFamily: 'Montserrat, sans-serif', boxShadow: '0 2px 8px #00b3e620', cursor: 'pointer', transition: 'background 0.15s' }} onMouseOver={e => e.currentTarget.style.background = '#0090b3'} onMouseOut={e => e.currentTarget.style.background = '#00b3e6'}>Sauvegarder</button>
          {brandingSaveResult && <span style={{ marginLeft: 12, color: brandingSaveResult.includes('sauvegardé') ? '#00b36b' : '#d6002a', fontWeight: 600 }}>{brandingSaveResult}</span>}
        </form>
        <div style={{ borderTop: '1.5px solid #e9f6fb', margin: '24px 0 30px 0' }} />
        <h2 style={{ color: '#00b3e6', fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Logo personnalisé</h2>
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 24 }}>
          {branding.logoUrl && (
            <div style={{ border: '1.5px solid #cce8f6', borderRadius: 12, background: '#f6fcff', padding: 10, display: 'flex', alignItems: 'center' }}>
              <img src={branding.logoUrl} alt="Logo" style={{ maxWidth: 160, maxHeight: 60, display: 'block' }} />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input type="file" accept="image/png" ref={logoInputRef} onChange={handleLogoUpload} style={{ fontFamily: 'Montserrat, sans-serif' }} />
            <div style={{ fontSize: 13, color: '#888' }}>PNG, max 1Mo</div>
          </div>
        </div>
        <div style={{ borderTop: '1.5px solid #e9f6fb', margin: '24px 0 30px 0' }} />

        {/* SMTP Settings */}
        <h2 style={{ color: '#00b3e6', fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Paramètres SMTP</h2>
        <form onSubmit={handleSmtpSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 24 }}>
          <label style={{ fontWeight: 600, fontSize: 16 }}>
            Hôte SMTP
            <input type="text" name="host" value={smtp.host} onChange={handleSmtpChange} required style={{ display: 'block', width: '100%', marginTop: 6, padding: '10px 14px', border: '1.5px solid #cce8f6', borderRadius: 10, fontSize: 16, fontFamily: 'Montserrat, sans-serif', outline: 'none', transition: 'border 0.15s' }} />
          </label>
          <label style={{ fontWeight: 600, fontSize: 16 }}>
            Port SMTP
            <input type="number" name="port" value={smtp.port} onChange={handleSmtpChange} required style={{ display: 'block', width: '100%', marginTop: 6, padding: '10px 14px', border: '1.5px solid #cce8f6', borderRadius: 10, fontSize: 16, fontFamily: 'Montserrat, sans-serif', outline: 'none', transition: 'border 0.15s' }} />
          </label>
          <label style={{ fontWeight: 600, fontSize: 16 }}>
            Utilisateur
            <input type="text" name="user" value={smtp.user} onChange={handleSmtpChange} required style={{ display: 'block', width: '100%', marginTop: 6, padding: '10px 14px', border: '1.5px solid #cce8f6', borderRadius: 10, fontSize: 16, fontFamily: 'Montserrat, sans-serif', outline: 'none', transition: 'border 0.15s' }} />
          </label>
          <label style={{ fontWeight: 600, fontSize: 16 }}>
            Mot de passe
            <input type="password" name="pass" value={smtp.pass} onChange={handleSmtpChange} required style={{ display: 'block', width: '100%', marginTop: 6, padding: '10px 14px', border: '1.5px solid #cce8f6', borderRadius: 10, fontSize: 16, fontFamily: 'Montserrat, sans-serif', outline: 'none', transition: 'border 0.15s' }} />
          </label>
          <label style={{ fontWeight: 600, fontSize: 16, gridColumn: '1 / span 2' }}>
            Expéditeur par défaut
            <input type="email" name="from" value={smtp.from} onChange={handleSmtpChange} required style={{ display: 'block', width: '100%', marginTop: 6, padding: '10px 14px', border: '1.5px solid #cce8f6', borderRadius: 10, fontSize: 16, fontFamily: 'Montserrat, sans-serif', outline: 'none', transition: 'border 0.15s' }} />
          </label>
          <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 16, marginTop: 6 }}>
            <button type="submit" style={{ background: '#00b3e6', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 26px', fontWeight: 700, fontSize: 16, fontFamily: 'Montserrat, sans-serif', boxShadow: '0 2px 8px #00b3e620', cursor: 'pointer', transition: 'background 0.15s' }} onMouseOver={e => e.currentTarget.style.background = '#0090b3'} onMouseOut={e => e.currentTarget.style.background = '#00b3e6'}>Sauvegarder</button>
            <button type="button" onClick={handleSmtpTest} style={{ background: '#e6f7fa', color: '#0090b3', border: 'none', borderRadius: 10, padding: '11px 26px', fontWeight: 700, fontSize: 16, fontFamily: 'Montserrat, sans-serif', boxShadow: '0 2px 8px #00b3e610', cursor: 'pointer', transition: 'background 0.15s' }} onMouseOver={e => e.currentTarget.style.background = '#cce8f6'} onMouseOut={e => e.currentTarget.style.background = '#e6f7fa'}>Tester l'envoi</button>
          </div>
          {smtpSaveResult && <p style={{ gridColumn: '1 / span 2', color: smtpSaveResult.includes('sauvegardés') ? '#00b36b' : '#d6002a', fontWeight: 600, margin: 0 }}>{smtpSaveResult}</p>}
          {smtpTestResult && <p style={{ gridColumn: '1 / span 2', color: smtpTestResult.includes('succès') ? '#00b36b' : '#d6002a', fontWeight: 600, margin: 0 }}>{smtpTestResult}</p>}
        </form>
        <div style={{ borderTop: '1.5px solid #e9f6fb', margin: '24px 0 30px 0' }} />

        {/* Export CSV */}
        <h2 style={{ color: '#00b3e6', fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Exporter les contrats</h2>
        <button onClick={handleExportCSV} disabled={exporting} style={{ background: '#00b3e6', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 26px', fontWeight: 700, fontSize: 16, fontFamily: 'Montserrat, sans-serif', boxShadow: '0 2px 8px #00b3e620', cursor: exporting ? 'not-allowed' : 'pointer', opacity: exporting ? 0.6 : 1, transition: 'background 0.15s' }} onMouseOver={e => { if (!exporting) e.currentTarget.style.background = '#0090b3'; }} onMouseOut={e => { if (!exporting) e.currentTarget.style.background = '#00b3e6'; }}>
          {exporting ? 'Export en cours…' : 'Exporter en CSV'}
        </button>
        <div style={{ borderTop: '1.5px solid #e9f6fb', margin: '24px 0 30px 0' }} />

        {/* Email personnalisé */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#e6f7fa', borderRadius: 12, padding: '14px 22px', marginBottom: 0, gap: 14 }}>
            <span style={{ fontSize: 28, color: '#00b3e6', background: '#fff', borderRadius: '50%', padding: 8, boxShadow: '0 2px 8px #00b3e610', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✉️</span>
            <h2 style={{ color: '#00b3e6', fontSize: 22, fontWeight: 700, margin: 0, fontFamily: 'Montserrat, sans-serif' }}>Modèle d’email de notification</h2>
          </div>
          <div style={{ fontSize: 15, color: '#555', margin: '10px 0 18px 0', paddingLeft: 4 }}>
            Personnalisez le contenu des emails envoyés automatiquement à vos clients lors des rappels.
          </div>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px #00b3e610', padding: 22 }}>
            <EmailTemplateEditor />
          </div>
        </div>
        <div style={{ borderTop: '1.5px solid #e9f6fb', margin: '24px 0 30px 0' }} />

        {/* Options de notifications */}
        <h2 style={{ color: '#00b3e6', fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Options de notifications</h2>
        <div style={{ background: '#f6fcff', borderRadius: 12, padding: 18, marginBottom: 24 }}>
          <NotificationOptionsEditor />
        </div>
        <div style={{ borderTop: '1.5px solid #e9f6fb', margin: '24px 0 30px 0' }} />

        {/* Envoi manuel de rappels */}
        <h2 style={{ color: '#00b3e6', fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Envoi manuel de rappels</h2>
        <div style={{ background: '#f6fcff', borderRadius: 12, padding: 18 }}>
          <ManualSendReminder />
        </div>
      </div>
    </section>
  );
}
