import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AddContractSPA from '../../components/AddContractSPA';
import { SortableTh, useSortableData } from '../../components/SortableTh';

function formatDateFr(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('fr-FR');
}

export default function ContractsSection({ user: userProp }) {
    const { data: session } = useSession();
  const user = userProp || session?.user;

  const [sort, setSort] = useState({ key: 'client', dir: 'asc' });
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('list');
  const [editContract, setEditContract] = useState(null);
  const [contractsPerPage, setContractsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // Filtres recherche
  const [searchClient, setSearchClient] = useState('');
  const [searchReference, setSearchReference] = useState('');
  const [searchStartDate, setSearchStartDate] = useState('');
  const [searchEndDate, setSearchEndDate] = useState('');
  const [searchCommentaire, setSearchCommentaire] = useState('');
  const [searchCommercial, setSearchCommercial] = useState('');

  // Hook trié
  const sortedContracts = useSortableData(contracts, sort);

  // Filtrage combiné
  const filteredContracts = sortedContracts.filter(contract => {
    // Filtre client
    const clientMatch = !searchClient || (contract.client?.name || '').toLowerCase().includes(searchClient.toLowerCase());
    // Filtre référence
    const refMatch = !searchReference || (contract.contractProducts || []).some(cp => (cp.product?.reference || '').toLowerCase().includes(searchReference.toLowerCase()));
    // Filtre date de fin
    let dateMatch = true;
    if (searchStartDate) {
      dateMatch = dateMatch && contract.startDate && contract.startDate.slice(0, 10) >= searchStartDate;
    }

    let fin = contract.endDate;
    if (!fin && contract.startDate && contract.duration) {
      const d = new Date(contract.startDate);
      d.setMonth(d.getMonth() + Number(contract.duration));
      if (d.getDate() !== new Date(contract.startDate).getDate()) d.setDate(0);
      fin = d.toISOString();
    }
    if (searchEndDate) {
      dateMatch = dateMatch && fin && fin.slice(0, 10) <= searchEndDate;
    }

    const commentaireMatch = !searchCommentaire || (contract.commentaire || '').toLowerCase().includes(searchCommentaire.toLowerCase());
    const commercialMatch = !searchCommercial || (contract.user?.name || '').toLowerCase().includes(searchCommercial.toLowerCase());

    return clientMatch && refMatch && dateMatch && commentaireMatch && commercialMatch;
  });

  const paginatedContracts = filteredContracts.slice((page - 1) * contractsPerPage, page * contractsPerPage);

  // Fonction utilitaire pour parser le JSON et afficher les erreurs API
  async function safeJson(res) {
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) {
      let message = 'Erreur API';
      try {
        const data = contentType.includes('application/json') ? await res.json() : null;
        if (data && data.error) message = data.error;
      } catch (e) {}
      throw new Error(message);
    }
    if (!contentType.includes('application/json')) throw new Error('Session expirée ou accès refusé');
    return res.json();
  }

  const handleDelete = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce contrat ? Cette action est irréversible.')) {
      try {
                const res = await fetch(`/api/admin/contracts/${id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin' // Important pour l'authentification sur Vercel
        });
        const data = await safeJson(res);
        if (res.ok) {
          alert(data.message || 'Contrat supprimé avec succès');
          setContracts(prev => prev.filter(c => c.id !== id));
        } else {
          throw new Error(data.error || 'Erreur lors de la suppression');
        }
      } catch (error) {
        console.error('Erreur de suppression:', error);
        alert(`Erreur: ${error.message}`);
      }
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    const [contractsRes, clientsRes, productsRes] = await Promise.all([
      fetch('/api/admin/contracts', { credentials: 'include' }),
      fetch('/api/admin/clients', { credentials: 'include' }),
      fetch('/api/admin/products', { credentials: 'include' })
    ]);
    let contractsData = [], clientsData = [], productsData = [];
    let errorContracts = '', errorClients = '', errorProducts = '';
    try {
      contractsData = await safeJson(contractsRes);
    } catch (e) {
      errorContracts = e.message || 'Erreur lors du chargement des contrats';
    }
    try {
      clientsData = await safeJson(clientsRes);
    } catch (e) {
      errorClients = e.message || 'Erreur lors du chargement des clients';
    }
    try {
      productsData = await safeJson(productsRes);
    } catch (e) {
      errorProducts = e.message || 'Erreur lors du chargement des produits';
    }
    setContracts(Array.isArray(contractsData) ? contractsData : []);
    setClients(Array.isArray(clientsData) ? clientsData : []);
    setProducts(Array.isArray(productsData) ? productsData : []);
    setLoading(false);
    // Affichage d’erreur dans l’UI (stockage dans le state si besoin)
    if (errorContracts || errorClients || errorProducts) {
      setTimeout(() => {
        alert([
          errorContracts && `Contrats: ${errorContracts}`,
          errorClients && `Clients: ${errorClients}`,
          errorProducts && `Produits: ${errorProducts}`
        ].filter(Boolean).join('\n'));
      }, 200);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  if (mode === 'add' || (mode === 'edit' && editContract)) {
    return (
      <AddContractSPA userEmail={user?.email} clients={clients} products={products} initialContract={editContract} onSuccess={() => { setMode('list'); setEditContract(null); fetchAll(); }} onCancel={() => { setMode('list'); setEditContract(null); }} />
    );
  }

  return (
    <section style={{ marginTop: 40, fontFamily: 'Montserrat, sans-serif' }}>
      {/* Zone de filtres améliorée */}
      <div style={{ background: '#fff', boxShadow: '0 2px 16px #00b3e610', borderRadius: 16, padding: '18px 28px', marginBottom: 24, display: 'flex', alignItems: 'flex-end', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontWeight: 600, color: '#0090b3', fontSize: 13, marginBottom: 4 }}>Client</label>
          <input type="text" value={searchClient} onChange={e => setSearchClient(e.target.value)} placeholder="Rechercher..." style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #cce8f6', fontSize: 15, width: 200 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontWeight: 600, color: '#0090b3', fontSize: 13, marginBottom: 4 }}>Référence produit</label>
          <input type="text" value={searchReference} onChange={e => setSearchReference(e.target.value)} placeholder="Rechercher..." style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #cce8f6', fontSize: 15, width: 200 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontWeight: 600, color: '#0090b3', fontSize: 13, marginBottom: 4 }}>Commentaire</label>
          <input type="text" value={searchCommentaire} onChange={e => setSearchCommentaire(e.target.value)} placeholder="Rechercher..." style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #cce8f6', fontSize: 15, width: 200 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontWeight: 600, color: '#0090b3', fontSize: 13, marginBottom: 4 }}>Commercial</label>
          <input type="text" value={searchCommercial} onChange={e => setSearchCommercial(e.target.value)} placeholder="Rechercher..." style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #cce8f6', fontSize: 15, width: 200 }} />
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontWeight: 600, color: '#0090b3', fontSize: 13, marginBottom: 4 }}>Début contrat (après le)</label>
            <input type="date" value={searchStartDate} onChange={e => setSearchStartDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #cce8f6', fontSize: 15, width: 180 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontWeight: 600, color: '#0090b3', fontSize: 13, marginBottom: 4 }}>Fin contrat (avant le)</label>
            <input type="date" value={searchEndDate} onChange={e => setSearchEndDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #cce8f6', fontSize: 15, width: 180 }} />
          </div>
        </div>
        <button
          onClick={() => { setSearchClient(''); setSearchReference(''); setSearchCommentaire(''); setSearchCommercial(''); setSearchStartDate(''); setSearchEndDate(''); }}
          style={{
            padding: '9px 24px', background: '#f6fcff', color: '#00b3e6', border: '1.5px solid #cce8f6',
            borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif',
            transition: 'background 0.12s', alignSelf: 'flex-end'
          }}
        >
          Réinitialiser
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: '#005f73', fontSize: 28, fontWeight: 800 }}>Liste des contrats</h2>
        <button
          onClick={() => setMode('add')}
          style={{
            background: 'linear-gradient(90deg, #00b3e6 60%, #00e0c6 100%)', color: '#fff', border: 'none', borderRadius: 10,
            padding: '12px 28px', fontWeight: 800, fontSize: 16, fontFamily: 'Montserrat, sans-serif',
            boxShadow: '0 4px 14px #00b3e660', cursor: 'pointer', transition: 'background 0.18s, box-shadow 0.18s'
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = 'linear-gradient(90deg, #0090b3 60%, #00b39e 100%)';
            e.currentTarget.style.boxShadow = '0 6px 20px #00b3e680';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = 'linear-gradient(90deg, #00b3e6 60%, #00e0c6 100%)';
            e.currentTarget.style.boxShadow = '0 4px 14px #00b3e660';
          }}
        >
          + AJOUTER CONTRAT
        </button>
      </div>

      {loading ? (
        <p>Chargement des contrats...</p>
      ) : (
        <div style={{ background: '#fff', boxShadow: '0 2px 16px #00b3e610', borderRadius: 16, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#00b3e6', color: '#fff', borderRadius: '10px 10px 0 0' }}>
              <tr>
                <SortableTh label="Client" sortKey="client" sort={sort} setSort={setSort} style={{ borderTopLeftRadius: '10px' }} />
                <SortableTh label="Commercial" sort={sort} setSort={setSort} sortKey="user" />
                <SortableTh label="Produit(s)" sort={sort} setSort={setSort} sortKey="produit" />
                <SortableTh label="Début" sort={sort} setSort={setSort} sortKey="startDate" />
                <SortableTh label="Fin" sort={sort} setSort={setSort} sortKey="endDate" />
                <SortableTh label="Email Notification" sort={sort} setSort={setSort} sortKey="email" />
                <SortableTh label="Statut" sort={sort} setSort={setSort} sortKey="status" />
                <SortableTh label="Commentaire" sort={sort} setSort={setSort} sortKey="commentaire" />
                <th style={{ padding: '14px 18px', color: '#fff', fontWeight: 'bold', fontSize: '18px', textAlign: 'right', borderTopRightRadius: '10px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedContracts.map(contract => {
                let endDate = contract.endDate;
                if (!endDate && contract.startDate && contract.duration) {
                  const d = new Date(contract.startDate);
                  d.setMonth(d.getMonth() + Number(contract.duration));
                  if (d.getDate() !== new Date(contract.startDate).getDate()) d.setDate(0);
                  endDate = d.toISOString();
                }

                const statusStyle = {
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 14,
                  display: 'inline-block',
                  textAlign: 'center',
                };

                let statusText, statusColor, statusBg;

                switch (contract.status) {
                  case 'EN_COURS':
                    statusText = 'En cours';
                    statusColor = '#007bff';
                    statusBg = '#e6f2ff';
                    break;
                  case 'TERMINE':
                    statusText = 'Terminé';
                    statusColor = '#6c757d';
                    statusBg = '#f0f2f5';
                    break;
                  case 'ANNULE':
                    statusText = 'Annulé';
                    statusColor = '#dc3545';
                    statusBg = '#fde8ea';
                    break;
                }

                return (
                  <tr key={contract.id} style={{ borderBottom: '1px solid #eef9fe' }}>
                    <td style={{ padding: '14px 18px', fontSize: 15, color: '#333' }}>{contract.client?.name || 'N/A'}</td>
                    <td style={{ padding: '14px 18px', fontSize: 15, color: '#333' }}>{contract.user ? contract.user.name : 'N/A'}</td>
                    <td style={{ padding: '14px 18px', fontSize: 15, color: '#333' }}>
                      {(contract.contractProducts || []).map(cp => cp.product?.reference).join(', ')}
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: 15, color: '#333' }}>{formatDateFr(contract.startDate)}</td>
                    <td style={{ padding: '14px 18px', fontSize: 15, color: '#333' }}>{formatDateFr(endDate)}</td>
                    <td style={{ padding: '14px 18px', fontSize: 15, color: '#333' }}>{contract.email}</td>
                    <td style={{ padding: '14px 18px', fontSize: 15, color: '#333' }}>
                      <span style={{ ...statusStyle, color: statusColor, background: statusBg }}>
                        {statusText}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: 15, color: '#333' }}>{contract.commentaire || ''}</td>
                    <td style={{ padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center' }}>
                      <button
                        style={{
                          background: 'linear-gradient(90deg, #00b3e6 60%, #00e0c6 100%)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 10,
                          padding: '9px 0',
                          fontWeight: 800,
                          fontSize: 15,
                          fontFamily: 'Montserrat, sans-serif',
                          boxShadow: '0 2px 8px #00b3e660',
                          cursor: 'pointer',
                          transition: 'background 0.18s, box-shadow 0.18s',
                          width: 120,
                          letterSpacing: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          textTransform: 'uppercase',
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.background = 'linear-gradient(90deg, #0090b3 60%, #00b39e 100%)';
                          e.currentTarget.style.boxShadow = '0 6px 18px #00b3e680';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.background = 'linear-gradient(90deg, #00b3e6 60%, #00e0c6 100%)';
                          e.currentTarget.style.boxShadow = '0 2px 8px #00b3e660';
                        }}
                        onClick={() => { setEditContract(contract); setMode('edit'); }}
                      >
                        <span role="img" aria-label="crayon">✏️</span> MODIFIER
                      </button>
                      {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
                        <button
                          style={{
                            background: 'linear-gradient(90deg, #ff6b6b 60%, #ff8e8e 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 10,
                            padding: '9px 0',
                            fontWeight: 800,
                            fontSize: 15,
                            fontFamily: 'Montserrat, sans-serif',
                            boxShadow: '0 2px 8px #ff6b6b60',
                            cursor: 'pointer',
                            transition: 'background 0.18s, box-shadow 0.18s',
                            width: 120,
                            letterSpacing: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            textTransform: 'uppercase',
                          }}
                          onMouseOver={e => {
                            e.currentTarget.style.background = 'linear-gradient(90deg, #e04f4f 60%, #ff8e8e 100%)';
                            e.currentTarget.style.boxShadow = '0 6px 18px #ff6b6b80';
                          }}
                          onMouseOut={e => {
                            e.currentTarget.style.background = 'linear-gradient(90deg, #ff6b6b 60%, #ff8e8e 100%)';
                            e.currentTarget.style.boxShadow = '0 2px 8px #ff6b6b60';
                          }}
                          onClick={() => handleDelete(contract.id)}
                        >
                          <span role="img" aria-label="poubelle">🗑️</span> SUPPRIMER
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {filteredContracts.length > contractsPerPage && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, marginTop: 24 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '7px 18px',
              background: '#f6fcff',
              color: '#00b3e6',
              border: '1.5px solid #cce8f6',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 15,
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              fontFamily: 'Montserrat, sans-serif',
              opacity: page === 1 ? 0.5 : 1,
              transition: 'background 0.12s',
            }}
          >
            Précédent
          </button>
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 15, color: '#222' }}>
            Page {page} / {Math.ceil(filteredContracts.length / contractsPerPage)}
          </span>
          <button
            onClick={() => setPage(p => Math.min(Math.ceil(filteredContracts.length / contractsPerPage), p + 1))}
            disabled={page === Math.ceil(filteredContracts.length / contractsPerPage)}
            style={{
              padding: '7px 18px',
              background: '#f6fcff',
              color: '#00b3e6',
              border: '1.5px solid #cce8f6',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 15,
              cursor: page === Math.ceil(filteredContracts.length / contractsPerPage) ? 'not-allowed' : 'pointer',
              fontFamily: 'Montserrat, sans-serif',
              opacity: page === Math.ceil(filteredContracts.length / contractsPerPage) ? 0.5 : 1,
              transition: 'background 0.12s',
            }}
          >
            Suivant
          </button>
        </div>
      )}
    </section>
  );
}
