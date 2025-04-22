import { getToken } from 'next-auth/jwt';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProductsSection from '../admin/products';
import ContractsSection from '../admin/contracts';
import { SortableTh, useSortableData } from '../../components/SortableTh';
import CommercialDashboardWidgets from './CommercialDashboardWidgets';

function ClientsSection() {
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


export async function getServerSideProps(context) {
  const token = await getToken({ req: context.req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'COMMERCIAL') {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }
  return { props: { user: { name: token.name, email: token.email, role: token.role } } };
}

export default function CommercialDashboard({ user }) {
  const [section, setSection] = useState('dashboard');
  const router = useRouter();

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
          <div style={{ fontSize: 13, color: '#fff', opacity: 0.7 }}>v1.0</div>
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
          {section === 'dashboard' && <CommercialDashboardWidgets />}
          {section === 'clients' && <ClientsSection user={user} />}
          {section === 'products' && <ProductsSection user={user} />}
          {section === 'contracts' && <ContractsSection />}
        </div>
      </main>
    </div>
  );
}
