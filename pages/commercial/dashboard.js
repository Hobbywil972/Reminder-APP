import { getToken } from 'next-auth/jwt';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProductsSection from '../admin/products';
import ContractsSection from '../admin/contracts';
import { SortableTh, useSortableData } from '../../components/SortableTh';
import CommercialDashboardWidgets from './CommercialDashboardWidgets';
import AddClientSPA from '../../components/AddClientSPA';
import AddProductSPA from '../../components/AddProductSPA';
import { useSession } from 'next-auth/react';

function ClientsSection({ user }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('list'); // "list", "add", "edit"
  const [editClient, setEditClient] = useState(null);
  const [searchName, setSearchName] = useState('');
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });

  useEffect(() => {
    fetch('/api/admin/clients', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setClients(data);
        setLoading(false);
      });
  }, []);

  // Tri et filtrage
  const sortedClients = [...clients].sort((a, b) => {
    let aVal = a[sort.key];
    let bVal = b[sort.key];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sort.dir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sort.dir === 'asc' ? 1 : -1;
    return 0;
  });
  const filteredClients = sortedClients.filter(c => !searchName || (c.name || '').toLowerCase().includes(searchName.toLowerCase()));

  if (loading) return <p>Chargement...</p>;

  if (mode === 'add') {
    return <AddClientSPA onSuccess={() => { setMode('list'); window.location.reload(); }} onCancel={() => setMode('list')} />;
  }

  return (
    <section style={{ marginTop: 40 }}>
      {/* Barre de recherche nom */}
      <div style={{ background: '#fff', boxShadow: '0 2px 16px #00b3e610', borderRadius: 16, padding: '12px 24px', marginBottom: 18, display: 'flex', alignItems: 'flex-end', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontWeight: 600, color: '#0090b3', fontSize: 13, marginBottom: 2 }}>Nom</label>
          <input
            type="text"
            placeholder="Rechercher par nom..."
            value={searchName}
            onChange={e => { setSearchName(e.target.value); }}
            style={{ padding: 8, borderRadius: 8, border: '1.5px solid #cce8f6', fontSize: 15, fontFamily: 'Montserrat, sans-serif', minWidth: 180, background: '#f6fcff' }}
          />
        </div>
        <button
          style={{ background: '#00b3e6', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 700, fontSize: 16, fontFamily: 'Montserrat, sans-serif', boxShadow: '0 2px 8px #00b3e620', cursor: 'pointer', transition: 'background 0.15s', marginLeft: 'auto' }}
          onClick={() => setMode('add')}
          onMouseOver={e => (e.currentTarget.style.background = '#0090b3')}
          onMouseOut={e => (e.currentTarget.style.background = '#00b3e6')}
        >
          <span role="img" aria-label="plus">➕</span> Ajouter un client
        </button>
      </div>
      <div style={{
        background: '#fff',
        borderRadius: 18,
        boxShadow: '0 4px 18px #00b3e620',
        padding: 0,
        overflowX: 'auto',
        marginBottom: 24,
      }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 380 }}>
          <thead>
            <tr style={{ background: '#00b3e6' }}>
              <SortableTh label="Nom" sortKey="name" sort={sort} setSort={setSort} />
              <SortableTh label="Contrats" sortKey="contracts" />
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client, idx) => (
              <tr key={client.id} style={{ background: idx % 2 === 0 ? '#f6fcff' : '#e6f7fa' }}>
                <td style={{ padding: 12, border: 'none', fontSize: 17, borderBottom: '1px solid #e0e0e0', borderTopLeftRadius: idx === 0 ? 18 : 0 }}>{client.name}</td>
                <td style={{ padding: 12, border: 'none', fontSize: 17, borderBottom: '1px solid #e0e0e0', borderTopRightRadius: idx === 0 ? 18 : 0 }}>{client.contracts?.length || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ProductsSectionWrapper({ user }) {
  const [mode, setMode] = useState('list');
  const [refreshKey, setRefreshKey] = useState(0);

  if (mode === 'add') {
    return <AddProductSPA onSuccess={() => { setMode('list'); setRefreshKey(k => k + 1); }} onCancel={() => setMode('list')} />;
  }

  return <ProductsSection key={refreshKey} user={user} onAddProduct={() => setMode('add')} />;
}

export default function CommercialDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [section, setSection] = useState('dashboard'); // 'dashboard', 'clients', 'products', 'contracts'

  useEffect(() => {
    // Si non authentifié après chargement, rediriger vers signin
    if (status === 'unauthenticated') {
       console.log('[CommercialDashboard][Client] User unauthenticated, redirecting to signin.');
      router.replace('/auth/signin');
    }
    // Si authentifié mais pas le bon rôle (sécurité supplémentaire), rediriger
    // Note : Ceci ne devrait pas arriver grâce à /dashboard.js, mais c'est une bonne pratique
    if (status === 'authenticated' && session?.user?.role !== 'COMMERCIAL') {
        console.log(`[CommercialDashboard][Client] User authenticated but incorrect role (${session.user?.role}), redirecting.`);
        // Rediriger vers une page d'erreur ou /dashboard ?
        router.replace('/dashboard'); // Ou une page '/unauthorized'
    }
  }, [status, session, router]);

  // Afficher un chargement pendant que la session est vérifiée
  if (status === 'loading') {
    return <p>Chargement de la session...</p>;
  }

  // Ne pas rendre le contenu si non authentifié ou mauvais rôle (redirection en cours)
  if (status !== 'authenticated' || session?.user?.role !== 'COMMERCIAL') {
      // Afficher null ou un message pendant que la redirection via useEffect se fait
      return null; 
  }

  // Si authentifié et bon rôle, afficher le dashboard
  // Utiliser session.user pour les infos utilisateur
  const user = session.user;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Montserrat, Segoe UI, Arial, sans-serif', background: '#f6fcff' }}>
      {/* Sidebar modernisée */}
      <aside style={{ width: 240, background: '#00b3e6', color: '#fff', padding: '32px 0 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '2px 0 16px #00b3e610' }}>
        <img src="/logo-infodom.png" alt="Infodom Logo" style={{ height: 54, marginBottom: 8 }} />
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 28, letterSpacing: 1 }}>Infodom</div>
        <nav style={{ width: '100%' }}>
          <ul style={{ listStyle: 'none', padding: 0, width: '100%' }}>
            <li>
              <button onClick={() => setSection('dashboard')} style={{
                background: section === 'dashboard' ? 'linear-gradient(90deg, #00b3e6 60%, #00e6d1 100%)' : 'none',
                color: '#fff',
                border: 'none',
                padding: '12px 32px',
                textAlign: 'left',
                width: '100%',
                cursor: 'pointer',
                fontWeight: section === 'dashboard' ? 700 : 500,
                borderRadius: 8,
                marginBottom: 6,
                transition: 'background 0.2s',
              }}>
                Dashboard
              </button>
            </li>
            <li>
              <button onClick={() => setSection('clients')} style={{
                background: section === 'clients' ? 'linear-gradient(90deg, #00b3e6 60%, #00e6d1 100%)' : 'none',
                color: '#fff',
                border: 'none',
                padding: '12px 32px',
                textAlign: 'left',
                width: '100%',
                cursor: 'pointer',
                fontWeight: section === 'clients' ? 700 : 500,
                borderRadius: 8,
                marginBottom: 6,
                transition: 'background 0.2s',
              }}>
                Clients
              </button>
            </li>
            <li>
              <button onClick={() => setSection('products')} style={{
                background: section === 'products' ? 'linear-gradient(90deg, #00b3e6 60%, #00e6d1 100%)' : 'none',
                color: '#fff',
                border: 'none',
                padding: '12px 32px',
                textAlign: 'left',
                width: '100%',
                cursor: 'pointer',
                fontWeight: section === 'products' ? 700 : 500,
                borderRadius: 8,
                marginBottom: 6,
                transition: 'background 0.2s',
              }}>
                Produits
              </button>
            </li>
            <li>
              <button onClick={() => setSection('contracts')} style={{
                background: section === 'contracts' ? 'linear-gradient(90deg, #00b3e6 60%, #00e6d1 100%)' : 'none',
                color: '#fff',
                border: 'none',
                padding: '12px 32px',
                textAlign: 'left',
                width: '100%',
                cursor: 'pointer',
                fontWeight: section === 'contracts' ? 700 : 500,
                borderRadius: 8,
                marginBottom: 6,
                transition: 'background 0.2s',
              }}>
                Contrats
              </button>
            </li>
            <li>
              <button onClick={() => router.push('/auth/signin')} style={{
                background: '#fff',
                color: '#00b3e6',
                border: '1px solid #00b3e6',
                padding: '12px 32px',
                textAlign: 'left',
                width: '100%',
                cursor: 'pointer',
                borderRadius: 8,
                marginTop: 32,
                fontWeight: 700,
                transition: 'background 0.2s',
              }}>
                Déconnexion
              </button>
            </li>
          </ul>
        </nav>
        <div style={{ marginTop: 'auto', width: '100%', padding: '0 0 18px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', opacity: 0.95, marginBottom: 2, letterSpacing: 1 }}>ReminderAPP</div>
          <div style={{ fontSize: 13, color: '#fff', opacity: 0.7, marginBottom: 1 }}>&copy; Willy GROMAT</div>
        </div>
      </aside>
      {/* Main content modernisé */}
      <main style={{ flex: 1, padding: 0, background: '#f6fcff', minHeight: '100vh' }}>
        {/* Header modernisé */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fff',
          padding: '24px 40px 24px 40px',
          boxShadow: '0 2px 12px #00b3e610',
          marginBottom: 36,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src="/logo-infodom.png" alt="Infodom Logo" style={{ height: 36 }} />
            <span style={{ fontWeight: 700, fontSize: 22, color: '#00b3e6', letterSpacing: 1 }}>Infodom</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, fontSize: 18, color: '#222' }}>Bienvenue, {user.name}</div>
            <span style={{ color: '#888', fontSize: 15 }}>{user.email}</span>
          </div>
        </header>
        <div style={{ padding: '0 40px 40px 40px' }}>
          {section === 'dashboard' && <CommercialDashboardWidgets setSection={setSection} />}
          {section === 'clients' && <ClientsSection user={user} />}
          {section === 'products' && <ProductsSectionWrapper user={user} />}
          {section === 'contracts' && <ContractsSection />}
        </div>
      </main>
    </div>
  );
}
