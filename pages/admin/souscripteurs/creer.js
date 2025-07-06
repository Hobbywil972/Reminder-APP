import { getSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/Layout/AdminLayout'; // Importer AdminLayout

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session || !session.user || !['ADMIN', 'SUPERADMIN', 'COMMERCIAL'].includes(session.user.role)) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  // S'assurer que session.user (ou session) contient les infos nécessaires pour AdminLayout
  const userForLayout = session.user || session; // Adaptez si la structure de votre session est différente

  return {
    props: {
      user: {
        name: userForLayout.name,
        email: userForLayout.email,
        role: userForLayout.role,
      },
    },
  };
}

export default function AddSouscripteurPage({ user }) { // Accepter 'user' comme prop
  const [form, setForm] = useState({ name: '', email: '', password: '', clientId: '' });
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [errorClients, setErrorClients] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function fetchClients() {
      setLoadingClients(true);
      setErrorClients('');
      try {
        const res = await fetch('/api/admin/clients-for-select', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setClients(data);
        } else {
          const errorData = await res.json();
          console.error('Failed to fetch clients:', errorData);
          setErrorClients(`Impossible de charger la liste des clients (HTTP ${res.status}).`);
        }
      } catch (e) {
        console.error('Network error fetching clients:', e);
        setErrorClients('Erreur de connexion lors du chargement des clients.');
      }
      setLoadingClients(false);
    }
    fetchClients();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.name || !form.email || !form.password || !form.clientId) {
      setError('Tous les champs sont obligatoires.');
      return;
    }
    try {
      const res = await fetch('/api/admin/souscripteurs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'SOUSCRIPTEUR' }), // Role is fixed
        credentials: 'include',
      });
      if (res.ok) {
        setSuccess('Souscripteur créé avec succès ! Redirection...');
        setTimeout(() => router.push('/admin?section=souscripteurs'), 1500); // Rediriger vers la section souscripteurs
      } else {
        const data = await res.json();
        setError(data.error || 'Erreur lors de la création du souscripteur.');
      }
    } catch (err) {
      setError('Erreur de connexion. Veuillez réessayer.');
    }
  }

  const commonInputStyle = {
    width: '100%',
    padding: 13,
    border: '1.5px solid #cce8f6',
    borderRadius: 10,
    background: '#f6fcff',
    fontSize: 17,
    outline: 'none',
    transition: 'border 0.2s',
    fontFamily: 'inherit',
    marginTop: 4
  };

  const handleFocus = e => (e.target.style.border = '1.5px solid #00b3e6');
  const handleBlur = e => (e.target.style.border = '1.5px solid #cce8f6');

  return (
    <AdminLayout user={user} currentSection="souscripteurs">
      {/* Le style du conteneur principal du formulaire peut être ajusté ici si nécessaire */}
      {/* Par exemple, pour centrer le formulaire dans la zone de contenu de AdminLayout */}
      <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', background: '#fff', borderRadius: 18, boxShadow: '0 8px 28px #00b3e620', padding: '36px 32px 32px 32px', fontFamily: 'Montserrat, sans-serif' }}>
        <h1 style={{ color: '#00b3e6', fontWeight: 700, fontSize: 26, marginBottom: 28, textAlign: 'center' }}>
          Ajouter un Souscripteur
        </h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <label style={{ fontWeight: 600, color: '#222' }}>
            Nom Complet
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              style={commonInputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </label>
          <label style={{ fontWeight: 600, color: '#222' }}>
            Email
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              style={commonInputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </label>
          <label style={{ fontWeight: 600, color: '#222' }}>
            Mot de passe
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              style={commonInputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </label>
          <label style={{ fontWeight: 600, color: '#222' }}>
            Client Associé
            <select
              value={form.clientId}
              onChange={e => setForm({ ...form, clientId: e.target.value })}
              required
              style={commonInputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={loadingClients || !!errorClients}
            >
              <option value="" disabled>{loadingClients ? 'Chargement...' : (errorClients || 'Sélectionner un client')}</option>
              {!loadingClients && !errorClients && clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
            {errorClients && <div style={{ color: '#b90000', fontSize: 14, marginTop: 4 }}>{errorClients}</div>}
          </label>
          <button
            type="submit"
            style={{
              background: '#00b3e6', color: '#fff', border: 'none', padding: '12px 0',
              borderRadius: 10, fontWeight: 700, fontSize: 18, cursor: 'pointer',
              marginTop: 6, boxShadow: '0 2px 8px #00b3e620', transition: 'background 0.15s',
            }}
            onMouseOver={e => (e.currentTarget.style.background = '#0090b3')}
            onMouseOut={e => (e.currentTarget.style.background = '#00b3e6')}
            disabled={loadingClients}
          >
            Créer le Souscripteur
          </button>
          {error && <div style={{ background: '#ffeaea', color: '#b90000', borderRadius: 8, padding: '8px 12px', fontWeight: 600, fontSize: 15, marginTop: 2, border: '1px solid #ffb3b3', textAlign: 'center' }}>{error}</div>}
          {success && <div style={{ background: '#e6fff6', color: '#008e4b', borderRadius: 8, padding: '8px 12px', fontWeight: 600, fontSize: 15, marginTop: 2, border: '1px solid #8ef2c0', textAlign: 'center' }}>{success}</div>}
        </form>
        {/* Le bouton de retour global est maintenant géré par AdminLayout via la sidebar */}
        {/* On peut ajouter un bouton Annuler spécifique au formulaire si besoin */}
        <button
          type="button" // Important pour ne pas soumettre le formulaire
          onClick={() => router.push('/admin?section=souscripteurs')}
          style={{
            marginTop: 20, background: 'transparent', color: '#555',
            border: '1.5px solid #ddd', padding: '11px 0', borderRadius: 10,
            fontWeight: 600, fontSize: 16, cursor: 'pointer', width: '100%',
            transition: 'background 0.12s, border-color 0.12s, color 0.12s',
          }}
          onMouseOver={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.borderColor = '#bbb'; e.currentTarget.style.color = '#333';}}
          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.color = '#555';}}
        >
          Annuler et retourner à la liste
        </button>
      </div>
    </AdminLayout>
  );
}
