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
  const [departements, setDepartements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('list');
  const [editContract, setEditContract] = useState(null);
  const [contractsPerPage, setContractsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [selectedDepartement, setSelectedDepartement] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [contractsRes, clientsRes, productsRes, departementsRes] = await Promise.all([
        fetch('/api/admin/contracts'),
        fetch('/api/admin/clients'),
        fetch('/api/admin/products'),
        fetch('/api/admin/departements'),
      ]);
      const contractsData = await contractsRes.json();
      const clientsData = await clientsRes.json();
      const productsData = await productsRes.json();
      const departementsData = await departementsRes.json();
      setContracts(contractsData);
      setClients(clientsData);
      setProducts(productsData);
      setDepartements(departementsData);
    } catch (error) {
      console.error("Erreur lors de la récupération des données", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

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
    const referenceMatch = !searchReference || (contract.contractProducts || []).some(cp => (cp.product?.reference || '').toLowerCase().includes(searchReference.toLowerCase()));
    const commentaireMatch = !searchCommentaire || (contract.commentaire || '').toLowerCase().includes(searchCommentaire.toLowerCase());
    const departementMatch = !selectedDepartement || contract.client?.departement?.id === parseInt(selectedDepartement);
    const commercialMatch = !searchCommercial || (contract.user?.name || '').toLowerCase().includes(searchCommercial.toLowerCase());
    const startDateMatch = !searchStartDate || (contract.startDate && new Date(contract.startDate) >= new Date(searchStartDate));
    const endDateMatch = !searchEndDate || (contract.endDate && new Date(contract.endDate) <= new Date(searchEndDate));
    return clientMatch && referenceMatch && commentaireMatch && commercialMatch && startDateMatch && endDateMatch && departementMatch;
  });

  const totalPages = Math.ceil(filteredContracts.length / contractsPerPage);
  const paginatedContracts = filteredContracts.slice((page - 1) * contractsPerPage, page * contractsPerPage);

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) {
      try {
        const res = await fetch(`/api/admin/contracts`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Erreur lors de la suppression');
        }
        fetchAll(); // Refresh list after delete
      } catch (error) {
        console.error('Erreur de suppression:', error);
        alert(`Erreur: ${error.message}`);
      }
    }
  };

  if (mode === 'add' || (mode === 'edit' && editContract)) {
    return (
      <AddContractSPA userEmail={user?.email} clients={clients} products={products} initialContract={editContract} onSuccess={() => { window.location.reload(); }} onCancel={() => { setMode('list'); setEditContract(null); }} />
    );
  }

  return (
    <section style={{ marginTop: 40, fontFamily: 'Montserrat, sans-serif' }}>
      {/* Zone de filtres améliorée */}
      <div style={{ background: '#fff', boxShadow: '0 2px 16px #00b3e610', borderRadius: 16, padding: '18px 28px', marginBottom: 24, display: 'flex', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontWeight: 600, color: '#0090b3', fontSize: 13, marginBottom: 4 }}>Client</label>
          <input type="text" value={searchClient} onChange={e => setSearchClient(e.target.value)} placeholder="Rechercher..." style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #cce8f6', fontSize: 15, width: 200 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontWeight: 600, color: '#0090b3', fontSize: 13, marginBottom: 4 }}>Département</label>
          <select value={selectedDepartement} onChange={e => setSelectedDepartement(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #cce8f6', fontSize: 15, width: 220, background: '#fff' }}>
            <option value="">Tous</option>
            {departements.map(dep => (
              <option key={dep.id} value={dep.id}>{dep.name}</option>
            ))}
          </select>
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
          onClick={() => { setSearchClient(''); setSearchReference(''); setSearchCommentaire(''); setSearchCommercial(''); setSearchStartDate(''); setSearchEndDate(''); setSelectedDepartement(''); setPage(1); }}
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
        <p>Chargement...</p>
      ) : paginatedContracts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f6fcff', borderRadius: 16 }}>
          <p style={{ fontSize: 18, color: '#007c9b' }}>Aucun contrat ne correspond à votre recherche.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', boxShadow: '0 2px 16px #00b3e610', borderRadius: 16, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#00b3e6', color: '#fff', borderRadius: '10px 10px 0 0' }}>
              <tr>
                <SortableTh label="Client (Département)" sortKey="client" sort={sort} setSort={setSort} style={{ borderTopLeftRadius: '10px' }} />
                <SortableTh label="Commercial" sortKey="user" sort={sort} setSort={setSort} />
                <SortableTh label="Produit(s)" sortKey="produit" sort={sort} setSort={setSort} />
                <SortableTh label="Début" sortKey="startDate" sort={sort} setSort={setSort} />
                <SortableTh label="Fin" sortKey="endDate" sort={sort} setSort={setSort} />
                <SortableTh label="Statut" sortKey="status" sort={sort} setSort={setSort} />
                <SortableTh label="Commentaire" sortKey="commentaire" sort={sort} setSort={setSort} />
                <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 700, letterSpacing: 0.5, borderTopRightRadius: '10px' }}>Actions</th>
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
                  case 'EN_COURS': statusText = 'En cours'; statusColor = '#007bff'; statusBg = '#e6f2ff'; break;
                  case 'TERMINE': statusText = 'Terminé'; statusColor = '#6c757d'; statusBg = '#f0f2f5'; break;
                  case 'ANNULE': statusText = 'Annulé'; statusColor = '#dc3545'; statusBg = '#fde8ea'; break;
                  default: statusText = contract.status; statusColor = '#333'; statusBg = '#eee'; break;
                }

                return (
                  <tr key={contract.id} style={{ borderBottom: '1px solid #eef9fe' }}>
                    <td style={{ padding: '14px 18px', fontSize: 15, color: '#333' }}>
                      {contract.client?.name || 'N/A'}
                      {contract.client?.departement?.name && <span style={{ color: '#777', fontSize: '0.9em' }}> ({contract.client.departement.name})</span>}
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: 15, color: '#333' }}>{contract.user?.name || 'N/A'}</td>
                    <td style={{ padding: '14px 18px', fontSize: 15, color: '#333' }}>
                      {(contract.contractProducts || []).map(cp => cp.product?.reference).join(', ')}
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: 15, color: '#333' }}>{formatDateFr(contract.startDate)}</td>
                    <td style={{ padding: '14px 18px', fontSize: 15, color: '#333' }}>{formatDateFr(endDate)}</td>
                    <td style={{ padding: '14px 18px', fontSize: 15, color: '#333' }}>
                      <span style={{ ...statusStyle, color: statusColor, background: statusBg }}>
                        {statusText}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: 15, color: '#333' }}>{contract.commentaire || ''}</td>
                    <td style={{ padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center' }}>
                      <button
                        style={{
                          background: 'linear-gradient(90deg, #00b3e6 60%, #00e0c6 100%)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 0',
                          fontWeight: 800, fontSize: 15, fontFamily: 'Montserrat, sans-serif', boxShadow: '0 2px 8px #00b3e660', cursor: 'pointer',
                          transition: 'background 0.18s, box-shadow 0.18s', width: 120, letterSpacing: 1, display: 'inline-flex', alignItems: 'center',
                          justifyContent: 'center', gap: 8, textTransform: 'uppercase',
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = 'linear-gradient(90deg, #0090b3 60%, #00b39e 100%)'; e.currentTarget.style.boxShadow = '0 6px 18px #00b3e680'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'linear-gradient(90deg, #00b3e6 60%, #00e0c6 100%)'; e.currentTarget.style.boxShadow = '0 2px 8px #00b3e660'; }}
                        onClick={() => { setEditContract(contract); setMode('edit'); }}
                      >
                        <span role="img" aria-label="crayon">✏️</span> MODIFIER
                      </button>
                      {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
                        <button
                          style={{
                            background: 'linear-gradient(90deg, #ff6b6b 60%, #ff8e8e 100%)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 0',
                            fontWeight: 800, fontSize: 15, fontFamily: 'Montserrat, sans-serif', boxShadow: '0 2px 8px #ff6b6b60', cursor: 'pointer',
                            transition: 'background 0.18s, box-shadow 0.18s', width: 120, letterSpacing: 1, display: 'inline-flex', alignItems: 'center',
                            justifyContent: 'center', gap: 8, textTransform: 'uppercase',
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = 'linear-gradient(90deg, #e04f4f 60%, #ff8e8e 100%)'; e.currentTarget.style.boxShadow = '0 6px 18px #ff6b6b80'; }}
                          onMouseOut={e => { e.currentTarget.style.background = 'linear-gradient(90deg, #ff6b6b 60%, #ff8e8e 100%)'; e.currentTarget.style.boxShadow = '0 2px 8px #ff6b6b60'; }}
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

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 24, gap: 12 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #00b3e6', background: page === 1 ? '#f0f2f5' : '#fff', cursor: 'pointer', color: page === 1 ? '#9aa0a6' : '#00b3e6', fontWeight: 600 }}>Précédent</button>
          <span style={{ color: '#005f73', fontWeight: 600 }}>Page {page} sur {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #00b3e6', background: page === totalPages ? '#f0f2f5' : '#fff', cursor: 'pointer', color: page === totalPages ? '#9aa0a6' : '#00b3e6', fontWeight: 600 }}>Suivant</button>
        </div>
      )}
    </section>
  );
}
