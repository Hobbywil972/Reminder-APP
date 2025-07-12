// c:\Users\wg\CascadeProjects\Reminder-APP\pages\admin\souscripteurs.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getSession } from 'next-auth/react';

// Placeholder pour les futurs composants de formulaire SPA si besoin
// import AddSouscripteurSPA from '../../components/AddSouscripteurSPA';
// import EditSouscripteurSPA from '../../components/EditSouscripteurSPA';

export async function getServerSideProps(context) {
  try {
    const session = await getSession(context);

    if (!session || !session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
      return {
        redirect: {
          destination: '/auth/signin',
          permanent: false,
        },
      };
    }
    return { props: { user: { name: session.user.name, email: session.user.email, role: session.user.role } } }; // Passer le rôle comme prop 'user'
  } catch (error) {
    console.error('ERROR in getServerSideProps /admin/souscripteurs.js:', error);
    return {
      redirect: {
        destination: '/auth/signin?error=ServerError',
        permanent: false,
      },
    };
  }
}

export default function SouscripteursSection({ user }) {
  const [souscripteurs, setSouscripteurs] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [selectedDepartement, setSelectedDepartement] = useState('');
  const [loading, setLoading] = useState(true);
  // const [mode, setMode] = useState('list'); // "list", "add", "edit" - Si on opte pour une SPA
  // const [editSouscripteur, setEditSouscripteur] = useState(null); // Pour le mode édition SPA
  const router = useRouter();

  const fetchDepartements = async () => {
    try {
      const res = await fetch('/api/admin/departements', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setDepartements(data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des départements:', error);
    }
  };

  const fetchSouscripteurs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/list-souscripteurs', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSouscripteurs(data);
      } else {
        const errorData = await res.json();
        console.error("Erreur lors de la récupération des souscripteurs:", errorData);
        setSouscripteurs([]); // Réinitialiser en cas d'erreur
        // Idéalement, afficher un message d'erreur à l'utilisateur ici
      }
    } catch (error) {
      console.error("Erreur de connexion lors de la récupération des souscripteurs:", error);
      setSouscripteurs([]); // Réinitialiser en cas d'erreur
      // Idéalement, afficher un message d'erreur à l'utilisateur ici
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDepartements();
    fetchSouscripteurs();
  }, []);

  // Logique pour les modes 'add' et 'edit' si on utilise une approche SPA (Single Page Application)
  // Pour l'instant, nous allons utiliser des pages séparées pour la création/modification.
  // if (mode === 'add') { /* ... code pour AddSouscripteurSPA ... */ }
  // if (mode === 'edit' && editSouscripteur) { /* ... code pour EditSouscripteurSPA ... */ }

  return (
    <section style={{ marginTop: 40, fontFamily: 'Montserrat, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontWeight: 700, fontSize: 26, color: '#00b3e6', margin: 0 }}>
          Gestion des Souscripteurs
        </h2>
        <button
          style={{
            background: '#00b3e6', color: '#fff', border: 'none', borderRadius: 10,
            fontWeight: 600, fontSize: 16, padding: '11px 22px',
            fontFamily: 'Montserrat, sans-serif', boxShadow: '0 2px 8px #00b3e620',
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10,
            transition: 'background 0.15s',
          }}
                              onClick={() => router.push('/admin/souscripteurs/creer')}
        >
          <span role="img" aria-label="ajouter">➕</span> Ajouter un Souscripteur
        </button>
      </header>

      {/* Filtres */}
      <div style={{ background: '#fff', boxShadow: '0 2px 16px #00b3e610', borderRadius: 16, padding: '12px 24px', marginBottom: 18, display: 'flex', alignItems: 'flex-end', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontWeight: 600, color: '#0090b3', fontSize: 13, marginBottom: 2 }}>Département</label>
          <select
            value={selectedDepartement}
            onChange={e => setSelectedDepartement(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #cce8f6', fontSize: 15, background: '#f6fcff', minWidth: 180 }}
          >
            <option value="">Tous les départements</option>
            {departements.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p>Chargement des souscripteurs...</p>
      ) : (
        <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 4px 18px #00b3e620', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 700 }}>
            <thead>
              <tr style={{ background: '#00b3e6' }}>
                <th style={{ padding: 14, color: '#fff', fontWeight: 700, fontSize: 18, borderTopLeftRadius: 18, textAlign: 'left' }}>Nom Complet</th>
                <th style={{ padding: 14, color: '#fff', fontWeight: 700, fontSize: 18, textAlign: 'left' }}>Email</th>
                <th style={{ padding: 14, color: '#fff', fontWeight: 700, fontSize: 18, textAlign: 'left' }}>Client Associé</th>
                <th style={{ padding: 14, color: '#fff', fontWeight: 700, fontSize: 18, borderTopRightRadius: 18, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {souscripteurs
                .filter(s => selectedDepartement ? s.client?.departement?.id === parseInt(selectedDepartement) : true)
                .map((s, idx) => (
                  <tr key={s.id} style={{ background: idx % 2 === 0 ? '#f6fcff' : '#e6f7fa' }}>
                    <td style={{ padding: '12px 14px', fontSize: 17, borderBottom: '1px solid #e0e0e0' }}>{s.name}</td>
                    <td style={{ padding: '12px 14px', fontSize: 17, borderBottom: '1px solid #e0e0e0' }}>{s.email}</td>
                    <td style={{ padding: '12px 14px', fontSize: 17, borderBottom: '1px solid #e0e0e0' }}>{s.client?.name || 'N/A'}</td>
                    <td style={{ padding: '12px 8px', fontSize: 17, borderBottom: '1px solid #e0e0e0', textAlign: 'center' }}>
  {/* Bouton Modifier */}
  <button
    style={{
      background: '#00b3e6', color: '#fff', border: 'none', borderRadius: 8,
      padding: '8px 16px', fontWeight: 600, fontSize: 15,
      fontFamily: 'Montserrat, sans-serif', boxShadow: '0 2px 8px #00b3e620',
      marginRight: 8, cursor: 'pointer', display: 'inline-flex',
      alignItems: 'center', gap: 8, transition: 'background 0.15s',
    }}
            onClick={() => router.push(`/admin/souscripteurs/modifier/${s.id}`)}
    title="Modifier le souscripteur"
  >
    <span role="img" aria-label="crayon">✏️</span> Modifier
  </button>

  {/* Bouton Supprimer */}
  <button
    style={{
      background: '#ff4957', color: '#fff', border: 'none', borderRadius: 8,
      padding: '8px 16px', fontWeight: 600, fontSize: 15,
      fontFamily: 'Montserrat, sans-serif', boxShadow: '0 2px 8px #ff495720',
      cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
      gap: 8, transition: 'background 0.15s',
    }}
            onClick={async () => {
      if (window.confirm(`Êtes-vous sûr de vouloir supprimer le souscripteur ${s.name} ?`)) {
        try {
          const res = await fetch(`/api/admin/souscripteurs/${s.id}`, { method: 'DELETE', credentials: 'include' });
          if (res.ok) {
            alert('Souscripteur supprimé avec succès.');
            fetchSouscripteurs();
          } else {
            const { error } = await res.json();
            alert(`Erreur : ${error || 'inconnue'}`);
          }
        } catch (err) {
          console.error(err);
          alert('Erreur réseau lors de la suppression.');
        }
      }
    }}
    title="Supprimer le souscripteur"
  >
    <span role="img" aria-label="poubelle">🗑️</span> Supprimer
  </button>
</td>
</tr>

                ))}
              {souscripteurs.length === 0 && !loading && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '20px', fontSize: 17, color: '#555' }}>
                    Aucun souscripteur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
