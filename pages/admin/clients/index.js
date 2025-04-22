import { getSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }
  return { props: {} };
}

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientsPerPage, setClientsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [searchName, setSearchName] = useState('');
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });
  const router = useRouter();

  // Tri et filtrage clients
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

  useEffect(() => {
    fetch('/api/admin/clients', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setClients(data);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', background: '#fff', border: '1.5px solid #00b3e6', borderRadius: 12, boxShadow: '0 2px 12px #00b3e610', padding: '10px 26px', marginBottom: 18, marginTop: 0 }}>
        <label style={{ fontWeight: 700, color: '#00b3e6', marginRight: 8, fontFamily: 'Montserrat, sans-serif', fontSize: 16, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span role="img" aria-label="voir">👁️</span> Afficher&nbsp;
          <select
            value={clientsPerPage}
            onChange={e => { setClientsPerPage(Number(e.target.value)); setPage(1); }}
            style={{ padding: '6px 14px', border: '1.5px solid #cce8f6', borderRadius: 8, fontFamily: 'Montserrat, sans-serif', fontSize: 15, background: '#f6fcff', color: '#222', outline: 'none', marginLeft: 4, marginRight: 4 }}
          >
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          &nbsp;par page
        </label>
      </div>
      <h1>Clients</h1>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ background: '#e6f7fa', boxShadow: '0 2px 16px #00b3e610', borderRadius: 12, padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 18, maxWidth: 400 }}>
          <label style={{ fontWeight: 700, color: '#0090b3', fontSize: 15, marginRight: 8 }}>🔎 Nom&nbsp;</label>
          <input
            type="text"
            placeholder="Recherche par nom..."
            value={searchName}
            onChange={e => { setSearchName(e.target.value); setPage(1); }}
            style={{ padding: 10, borderRadius: 8, border: '1.5px solid #00b3e6', fontSize: 16, fontFamily: 'Montserrat, sans-serif', minWidth: 180, background: '#fff' }}
          />
        </div>
      </div>
      <button
        style={{ marginBottom: 24, padding: '8px 16px', background: '#222', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        onClick={() => router.push('/admin/clients/add')}
      >
        Ajouter un client
      </button>
      {/* Barre de recherche nom améliorée */}
      <div style={{ background: '#e6f7fa', boxShadow: '0 2px 16px #00b3e610', borderRadius: 12, padding: '10px 28px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 24, maxWidth: 500 }}>
        <label style={{ fontWeight: 700, color: '#0090b3', fontSize: 15, marginRight: 10 }}>🔎 Nom&nbsp;</label>
        <input
          type="text"
          placeholder="Recherche rapide par nom..."
          value={searchName}
          onChange={e => { setSearchName(e.target.value); setPage(1); }}
          style={{ padding: 10, borderRadius: 8, border: '1.5px solid #00b3e6', fontSize: 16, fontFamily: 'Montserrat, sans-serif', minWidth: 220, background: '#fff', marginRight: 10 }}
        />
      </div>
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 10 }}>
            <label style={{ fontWeight: 500, marginRight: 8, fontFamily: 'Montserrat, sans-serif', fontSize: 15 }}>Afficher&nbsp;
              <select
                value={clientsPerPage}
                onChange={e => { setClientsPerPage(Number(e.target.value)); setPage(1); }}
                style={{ padding: '6px 14px', border: '1.5px solid #cce8f6', borderRadius: 8, fontFamily: 'Montserrat, sans-serif', fontSize: 15, background: '#f6fcff', color: '#222', outline: 'none' }}
              >
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              &nbsp;par page
            </label>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#eee' }}>
                <th
                  style={{ padding: 8, border: '1px solid #ddd', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => setSort(s => ({ key: 'name', dir: s.key === 'name' && s.dir === 'asc' ? 'desc' : 'asc' }))}
                >
                  Nom {sort.key === 'name' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Contrats</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.slice((page-1)*clientsPerPage, page*clientsPerPage).map(client => (
                <tr key={client.id}>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{client.name}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{client.contracts.length}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>
                    <button
                      style={{ padding: '4px 12px', marginRight: 8, background: '#eee', border: '1px solid #888', borderRadius: 4, cursor: 'pointer' }}
                      onClick={() => router.push(`/admin/clients/${client.id}`)}
                    >
                      Modifier
                    </button>
                    <button
                      style={{ padding: '4px 12px', background: '#ffdddd', border: '1px solid #c00', borderRadius: 4, cursor: 'pointer', color: '#a00' }}
                      onClick={async () => {
                        if (!window.confirm(`Confirmer la suppression du client ${client.name} ?`)) return;
                        const res = await fetch('/api/admin/clients', {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: client.id }),
                          credentials: 'include',
                        });
                        if (res.ok) {
                          setClients(clients.filter(c => c.id !== client.id));
                        } else {
                          const data = await res.json();
                          alert(data.error || 'Erreur lors de la suppression');
                        }
                      }}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination controls */}
          {clients.length > clientsPerPage && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, marginTop: 16 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p-1))}
                style={{ padding: '7px 18px', background: '#f6fcff', color: '#00b3e6', border: '1.5px solid #cce8f6', borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: page === 1 ? 'not-allowed' : 'pointer', fontFamily: 'Montserrat, sans-serif', opacity: page === 1 ? 0.5 : 1 }}
                disabled={page === 1}
              >Précédent</button>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 15, color: '#222' }}>Page {page} / {Math.ceil(clients.length / clientsPerPage)}</span>
              <button
                onClick={() => setPage(p => Math.min(Math.ceil(clients.length / clientsPerPage), p+1))}
                style={{ padding: '7px 18px', background: '#f6fcff', color: '#00b3e6', border: '1.5px solid #cce8f6', borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: page === Math.ceil(clients.length / clientsPerPage) ? 'not-allowed' : 'pointer', fontFamily: 'Montserrat, sans-serif', opacity: page === Math.ceil(clients.length / clientsPerPage) ? 0.5 : 1 }}
                disabled={page === Math.ceil(clients.length / clientsPerPage)}
              >Suivant</button>
            </div>
          )}
        </>
      )}
      <button onClick={() => router.push('/admin')} style={{ marginTop: 32, background: '#222', color: '#fff', border: 'none', padding: 10, borderRadius: 4, cursor: 'pointer' }}>
        Retour au dashboard
      </button>
    </div>
  );
}
