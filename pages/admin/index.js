import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

import AdminLayout from '../../components/Layout/AdminLayout';
import ContractsSectionPage from './contracts';
import SouscripteursSectionPage from './souscripteurs';
import ProductsSectionPage from './products';
import ConfigurationPage from './configuration';
import AddClientSPA from '../../components/AddClientSPA';
import EditClientSPA from '../../components/EditClientSPA';

// Main dashboard component that orchestrates everything
export default function AdminDashboard({ user, initialClients, initialContracts, initialDepartements, initialUsers, initialSection }) {
  const router = useRouter();
  const currentSection = router.query.section || initialSection || 'clients';

  // Centralized state management
  const [clients, setClients] = useState(initialClients || []);
  const [contracts, setContracts] = useState(initialContracts || []);
  const [departements, setDepartements] = useState(initialDepartements || []);
  const [users, setUsers] = useState(initialUsers || []);

  // State for SPA-like navigation within a section (e.g., list -> add -> edit)
  const [clientMode, setClientMode] = useState('list');
  const [editingClient, setEditingClient] = useState(null);

  // Refetch data if initial props are empty (e.g., client-side navigation)
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!initialClients) {
          const res = await fetch('/api/admin/clients');
          if (res.ok) setClients(await res.json());
        }
        // Fetch users if not provided
        if (!initialUsers) {
          const resU = await fetch('/api/admin/users');
          if (resU.ok) setUsers(await resU.json());
        }
        // Similar fetches for contracts, departements, etc., if needed
      } catch (error) {
        console.error("Error fetching data client-side:", error);
      }
    };
    fetchData();
  }, [initialClients]);

  const refreshClients = async () => {
    try {
      const res = await fetch('/api/admin/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Failed to refresh clients:", error);
    }
  };

  return (
    <AdminLayout user={user} currentSection={currentSection}>
      {currentSection === 'clients' && 
        <ClientsSection 
          clients={clients} 
          departements={departements}
          mode={clientMode}
          setMode={setClientMode}
          editingClient={editingClient}
          setEditingClient={setEditingClient}
          refreshClients={refreshClients}
        />
      }
      {currentSection === 'contracts' && (
        <ContractsSectionPage user={user} />
      )}
      {currentSection === 'souscripteurs' && (
        <SouscripteursSectionPage user={user} />
      )}
      {currentSection === 'products' && (
        <ProductsSectionPage user={user} />
      )}
      {currentSection === 'departements' && (
        <DepartementsSection departements={departements} />
      )}
      {currentSection === 'users' && (
        <UsersSection users={users} />
      )}
      {currentSection === 'configuration' && (
        <ConfigurationPage user={user} />
      )}
    </AdminLayout>
  );
}

// Clients Section Component
function ClientsSection({ clients, departements, mode, setMode, editingClient, setEditingClient, refreshClients }) {
  const [searchName, setSearchName] = useState('');
  const [selectedDepartement, setSelectedDepartement] = useState('');
  const [page, setPage] = useState(1);
  const clientsPerPage = 10;

  const filteredClients = (Array.isArray(clients) ? clients : []).filter(client => {
    const nameMatch = client.name?.toLowerCase().includes(searchName.toLowerCase());
    const departementMatch = selectedDepartement ? client.departement?.id === parseInt(selectedDepartement) : true;
    return nameMatch && departementMatch;
  });

  const totalPages = Math.ceil(filteredClients.length / clientsPerPage);
  const paginatedClients = filteredClients.slice((page - 1) * clientsPerPage, page * clientsPerPage);

  const handleDelete = async (clientId) => {
    if (!window.confirm('Confirmer la suppression de ce client ?')) return;
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: clientId }),
      });
      if (res.ok) {
        refreshClients();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert('Une erreur est survenue.');
    }
  };

  if (mode === 'add') {
    return <AddClientSPA onSuccess={() => { setMode('list'); refreshClients(); }} onCancel={() => setMode('list')} />;
  }

  if (mode === 'edit' && editingClient) {
    return <EditClientSPA client={editingClient} onSuccess={() => { setMode('list'); setEditingClient(null); refreshClients(); }} onCancel={() => { setMode('list'); setEditingClient(null); }} />;
  }

  return (
    <section style={{ marginTop: 40 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 26, color: '#00b3e6', margin: 0 }}>Clients</h2>
        <div style={{ display: 'flex', gap: '1rem', flex: '1 1 400px' }}>
          <input
            type="text"
            placeholder="Rechercher par nom..."
            value={searchName}
            onChange={(e) => { setSearchName(e.target.value); setPage(1); }}
            style={{ padding: '10px 15px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 16, flex: 1 }}
          />
          <select
            value={selectedDepartement}
            onChange={(e) => { setSelectedDepartement(e.target.value); setPage(1); }}
            style={{ padding: '10px 15px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 16, background: '#fff', flex: 1 }}
          >
            <option value="">Tous les départements</option>
            {departements.map(dep => <option key={dep.id} value={dep.id}>{dep.name}</option>)}
          </select>
        </div>
        <button onClick={() => setMode('add')} style={{ background: '#00b3e6', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 16, padding: '11px 22px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span role="img" aria-label="ajouter">➕</span> Ajouter un client
        </button>
      </header>
      <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 4px 18px #00b3e620', overflow: 'hidden', marginTop: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 480, fontFamily: 'Montserrat, sans-serif' }}>
          <thead>
            <tr style={{ background: '#00b3e6' }}>
              <th style={{ padding: 14, color: '#fff', fontWeight: 700, fontSize: 18, borderTopLeftRadius: 18 }}>Nom</th>
              <th style={{ padding: 14, color: '#fff', fontWeight: 700, fontSize: 18 }}>Contrats</th>
              <th style={{ padding: 14, color: '#fff', fontWeight: 700, fontSize: 18, borderTopRightRadius: 18 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedClients.map((client) => (
              <tr key={client.id}>
                <td style={{ padding: 12, border: 'none', fontSize: 17, borderBottom: '1px solid #e0e0e0' }}>{client.name}</td>
                <td style={{ padding: 12, border: 'none', fontSize: 17, borderBottom: '1px solid #e0e0e0' }}>{client.contracts?.length || 0}</td>
                <td style={{ padding: 12, border: 'none', fontSize: 17, borderBottom: '1px solid #e0e0e0' }}>
                  <button onClick={() => { setEditingClient(client); setMode('edit'); }} style={{ background: '#00b3e6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 600, fontSize: 15, marginRight: 8, cursor: 'pointer' }}>Modifier</button>
                  <button onClick={() => handleDelete(client.id)} style={{ background: '#ff4957', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} setPage={setPage} />}
      </div>
    </section>
  );
}

// Departements Section Component
function DepartementsSection({ departements: initialDepartements }) {
  const [departements, setDepartements] = useState(initialDepartements || []);
  const [mode, setMode] = useState('list'); // 'list', 'add', 'edit'
  const [selectedDep, setSelectedDep] = useState(null); // dep object for edit
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const refreshDepartements = async () => {
    try {
      const res = await fetch('/api/admin/departements');
      if (res.ok) {
        setDepartements(await res.json());
      }
    } catch (e) {
      console.error('Refresh departements failed', e);
    }
  };

  const resetForm = () => {
    setName('');
    setSelectedDep(null);
    setError('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Le nom est requis');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/departements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });
      if (res.ok) {
        await refreshDepartements();
        setMode('list');
        resetForm();
      } else {
        const data = await res.json();
        setError(data.message || 'Erreur lors de la création');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Le nom est requis');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/departements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedDep.id, name: name.trim() })
      });
      if (res.ok) {
        await refreshDepartements();
        setMode('list');
        resetForm();
      } else {
        const data = await res.json();
        setError(data.message || 'Erreur lors de la mise à jour');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce département ?')) return;
    try {
      const res = await fetch(`/api/admin/departements?id=${id}`, { method: 'DELETE' });
      if (res.status === 204) {
        await refreshDepartements();
      } else {
        const data = await res.json();
        alert(data.message || 'Erreur lors de la suppression');
      }
    } catch (e) {
      console.error('Delete dep error', e);
      alert('Une erreur est survenue');
    }
  };

  // Form UI for add / edit
  if (mode !== 'list') {
    const isEdit = mode === 'edit';
    return (
      <section style={{ marginTop: 40, maxWidth: 420 }}>
        <h2 style={{ fontSize: 24, color: '#00b3e6', marginBottom: 24 }}>{isEdit ? 'Modifier' : 'Ajouter'} un département</h2>
        <form onSubmit={isEdit ? handleUpdate : handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 18, background: '#fff', padding: 32, borderRadius: 18, boxShadow: '0 4px 18px #00b3e620' }}>
          <input
            type="text"
            placeholder="Nom du département"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: 12, borderRadius: 10, border: '1.5px solid #cce8f6', background: '#f6fcff', fontSize: 16 }}
          />
          {error && <div style={{ color: '#ff4957', fontSize: 14 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" disabled={loading} style={{ background: '#00b3e6', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 600, cursor: 'pointer' }}>{loading ? '...' : 'Enregistrer'}</button>
            <button type="button" onClick={() => { setMode('list'); resetForm(); }} style={{ background: '#ccc', color: '#333', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
          </div>
        </form>
      </section>
    );
  }

  // List UI
  return (
    <section style={{ marginTop: 40 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, color: '#00b3e6', margin: 0 }}>Liste des départements</h2>
        <button onClick={() => setMode('add')} style={{ background: '#00b3e6', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 600, cursor: 'pointer' }}>Ajouter</button>
      </header>
      <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 4px 18px #00b3e620', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 280 }}>
          <thead>
            <tr style={{ background: '#00b3e6' }}>
              <th style={{ padding: 12, color: '#fff', fontWeight: 600, fontSize: 15, textAlign: 'left' }}>ID</th>
              <th style={{ padding: 12, color: '#fff', fontWeight: 600, fontSize: 15, textAlign: 'left' }}>Nom</th>
              <th style={{ padding: 12, color: '#fff', fontWeight: 600, fontSize: 15, textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departements && departements.length > 0 ? (
              departements.map(dep => (
                <tr key={dep.id}>
                  <td style={{ padding: 12, fontSize: 16, borderBottom: '1px solid #e0e0e0' }}>{dep.id}</td>
                  <td style={{ padding: 12, fontSize: 16, borderBottom: '1px solid #e0e0e0' }}>{dep.name}</td>
                  <td style={{ padding: 12, fontSize: 16, borderBottom: '1px solid #e0e0e0' }}>
                    <button onClick={() => { setSelectedDep(dep); setName(dep.name); setMode('edit'); }} style={{ background: '#00b3e6', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 600, fontSize: 14, marginRight: 8, cursor: 'pointer' }}>Modifier</button>
                    <button onClick={() => handleDelete(dep.id)} style={{ background: '#ff4957', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Supprimer</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={{ padding: 20, textAlign: 'center', color: '#888' }}>Aucun département trouvé.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// Users Section Component
function UsersSection({ users: initialUsers }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers || []);
  const [search, setSearch] = useState('');

  const filteredUsers = (Array.isArray(users) ? users : []).filter(u => {
    const term = search.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.role || '').toLowerCase().includes(term)
    );
  });

  async function handleDelete(id) {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
        credentials: 'include',
      });
      if (res.status === 204) {
        setUsers(prev => prev.filter(u => u.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (e) {
      console.error('User delete error', e);
      alert('Une erreur est survenue');
    }
  }

  return (
    <section style={{ marginTop: 40, fontFamily: 'Montserrat, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <button onClick={() => window.location.href='/admin/users/add'} style={{ background:'#00b3e6', color:'#fff', border:'none', borderRadius:10, padding:'10px 24px', fontWeight:600, cursor:'pointer' }}>Ajouter</button>
        <h2 style={{ fontWeight: 700, fontSize: 26, color: '#00b3e6', margin: 0 }}>Gestion des Utilisateurs</h2>
      </header>
      <div style={{ marginBottom: 18 }}>
        <input
          type="text"
          placeholder="Rechercher par nom, email ou rôle..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #cce8f6', fontSize: 15, background: '#f6fcff', minWidth: 240 }}
        />
      </div>
      <div style={{ background: '#fff', boxShadow: '0 2px 16px #00b3e610', borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#00b3e6', color: '#fff', textAlign: 'left' }}>
              <th style={{ padding: 12, fontSize: 15, fontWeight: 600 }}>ID</th>
              <th style={{ padding: 12, fontSize: 15, fontWeight: 600 }}>Nom</th>
              <th style={{ padding: 12, fontSize: 15, fontWeight: 600 }}>Email</th>
              <th style={{ padding: 12, fontSize: 15, fontWeight: 600 }}>Rôle</th>
              <th style={{ padding: 12, fontSize: 15, fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: 12, fontSize: 15 }}>{u.id}</td>
                <td style={{ padding: 12, fontSize: 15 }}>{u.name}</td>
                <td style={{ padding: 12, fontSize: 15 }}>{u.email}</td>
                <td style={{ padding: 12, fontSize: 15 }}>{u.role}</td>
                <td style={{ padding: 12 }}>
                  <button onClick={() => router.push(`/admin/users/modifier/${u.id}`)} style={{ background:'#00b3e6', color:'#fff', border:'none', borderRadius:8, padding:'6px 16px', fontWeight:600, cursor:'pointer', marginRight:8 }}>Modifier</button>
                  <button onClick={() => handleDelete(u.id)} style={{ background:'#ff4957', color:'#fff', border:'none', borderRadius:8, padding:'6px 16px', fontWeight:600, cursor:'pointer' }}>Supprimer</button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="4" style={{ padding: 24, textAlign: 'center', fontSize: 16, color: '#555' }}>Aucun utilisateur trouvé.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ----- Ancien composant ContractsSection remplacé par ContractsSectionPage (importé depuis ./contracts) -----
/* function ContractsSection({ contracts, setContracts, departements }) {
  const router = useRouter();
  const [searchId, setSearchId] = useState('');
  const [searchClient, setSearchClient] = useState('');
  const [selectedDepartement, setSelectedDepartement] = useState('');
  const [page, setPage] = useState(1);
  const contractsPerPage = 10;

  const handleEdit = (id) => {
    router.push(`/admin/contracts/modifier/${id}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Confirmer la suppression du contrat ${id} ?`)) return;
    const res = await fetch('/api/admin/contracts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
      credentials: 'include',
    });
    if (res.ok) {
      setContracts(prev => prev.filter(c => c.id !== id));
    } else {
      const data = await res.json();
      alert(data.error || 'Erreur lors de la suppression');
    }
  };


  const filteredContracts = (Array.isArray(contracts) ? contracts : []).filter(contract => {
    const idMatch = searchId ? contract.id.toString().includes(searchId) : true;
    const clientMatch = searchClient ? contract.client?.name.toLowerCase().includes(searchClient.toLowerCase()) : true;
    const departementMatch = selectedDepartement ? contract.client?.departement?.id === parseInt(selectedDepartement) : true;
    return idMatch && clientMatch && departementMatch;
  });

  const totalPages = Math.ceil(filteredContracts.length / contractsPerPage);
  const paginatedContracts = filteredContracts.slice((page - 1) * contractsPerPage, page * contractsPerPage);

  return (
    <section style={{ marginTop: 40 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 26, color: '#00b3e6', margin: 0 }}>Contrats</h2>
        <div style={{ display: 'flex', gap: '1rem', flex: '1 1 500px' }}>
          <input type="text" placeholder="Rechercher par ID..." value={searchId} onChange={(e) => { setSearchId(e.target.value); setPage(1); }} style={{ padding: '10px 15px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 16, flex: 1 }} />
          <input type="text" placeholder="Rechercher par client..." value={searchClient} onChange={(e) => { setSearchClient(e.target.value); setPage(1); }} style={{ padding: '10px 15px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 16, flex: 1 }} />
          <select value={selectedDepartement} onChange={(e) => { setSelectedDepartement(e.target.value); setPage(1); }} style={{ padding: '10px 15px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 16, background: '#fff', flex: 1 }}>
            <option value="">Tous les départements</option>
            {departements.map(dep => <option key={dep.id} value={dep.id}>{dep.name}</option>)}
          </select>
        </div>
      </header>
      <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 4px 18px #00b3e620', overflow: 'hidden', marginTop: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 480, fontFamily: 'Montserrat, sans-serif' }}>
          <thead>
            <tr style={{ background: '#00b3e6' }}>
              <th style={{ padding: 14, color: '#fff', fontWeight: 700, fontSize: 18, borderTopLeftRadius: 18 }}>ID</th>
              <th style={{ padding: 14, color: '#fff', fontWeight: 700, fontSize: 18 }}>Client</th>
              <th style={{ padding: 14, color: '#fff', fontWeight: 700, fontSize: 18 }}>Commercial</th>
              <th style={{ padding: 14, color: '#fff', fontWeight: 700, fontSize: 18, borderTopRightRadius: 18 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedContracts.map((contract) => (
              <tr key={contract.id}>
                <td style={{ padding: 12, border: 'none', fontSize: 17, borderBottom: '1px solid #e0e0e0' }}>{contract.id}</td>
                <td style={{ padding: 12, border: 'none', fontSize: 17, borderBottom: '1px solid #e0e0e0' }}>{contract.client?.name || 'N/A'}</td>
                <td style={{ padding: 12, border: 'none', fontSize: 17, borderBottom: '1px solid #e0e0e0' }}>{contract.user?.name || 'N/A'}</td>
                <td style={{ padding: 12, border: 'none', fontSize: 17, borderBottom: '1px solid #e0e0e0' }}>
                  <button onClick={() => handleEdit(contract.id)} style={{ background: '#00b3e6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 600, fontSize: 15, marginRight: 8, cursor: 'pointer' }}>Modifier</button>
                  <button onClick={() => handleDelete(contract.id)} style={{ background: '#ff4957', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} setPage={setPage} />}
      </div>
    </section>
  );
}

*/
// Reusable Pagination Component
function Pagination({ page, totalPages, setPage }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, padding: '16px 0' }}>
      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '7px 18px', background: '#f6fcff', color: '#00b3e6', border: '1.5px solid #cce8f6', borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>
        Précédent
      </button>
      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 15, color: '#222' }}>
        Page {page} / {totalPages}
      </span>
      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '7px 18px', background: '#f6fcff', color: '#00b3e6', border: '1.5px solid #cce8f6', borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>
        Suivant
      </button>
    </div>
  );
}


// getServerSideProps for initial data fetching
export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session || !session.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  const prisma = new PrismaClient();

  try {
    const [users, clients, contracts, departements] = await prisma.$transaction([
      prisma.user.findMany({ orderBy: { name: 'asc' } }),
      prisma.client.findMany({ include: { contracts: true, departement: true }, orderBy: { name: 'asc' } }),
      prisma.contract.findMany({ include: { client: { include: { departement: true } }, user: true }, orderBy: { id: 'asc' } }),
      prisma.departement.findMany({ orderBy: { name: 'asc' } })
    ]);

    // Convert Date objects to plain strings for Next.js serialization
    const safeUsers = JSON.parse(JSON.stringify(users));
    const safeClients = JSON.parse(JSON.stringify(clients));
    const safeContracts = JSON.parse(JSON.stringify(contracts));
    const safeDepartements = JSON.parse(JSON.stringify(departements));

    return {
      props: {
        user: session.user,
        initialUsers: safeUsers,
        initialClients: safeClients,
        initialContracts: safeContracts,
        initialDepartements: safeDepartements,
        initialSection: context.query.section || 'clients',
      },
    };
  } catch (error) {
    return { notFound: true };
  }
}

