import { useState, useEffect, useMemo } from 'react';
import AddContractSPA from './AddContractSPA';
import { SortableTh, useSortableData } from './SortableTh';

function formatDateFr(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('fr-FR');
}

export default function CommercialContractsSection({ user, departementId }) {
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('list');
  const [editContract, setEditContract] = useState(null);
  const [contractsPerPage, setContractsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // Filtres
  const [searchClient, setSearchClient] = useState('');
  const [searchReference, setSearchReference] = useState('');
  const [searchCommercial, setSearchCommercial] = useState('');
  const [searchComment, setSearchComment] = useState('');
  const [searchStartDate, setSearchStartDate] = useState('');
  const [searchEndDate, setSearchEndDate] = useState('');

      const [sortConfig, setSortConfig] = useState({ key: 'client', dir: 'asc' });

    const sortedContracts = useMemo(() => {
    let sortableItems = [...contracts];

    const getSortableValue = (item, key) => {
        switch (key) {
            case 'client': return item.client?.name?.toLowerCase() || '';
            case 'user': return item.user?.name?.toLowerCase() || '';
            case 'startDate': return item.startDate || '';
            case 'endDate': return item.endDate || '';
            default: return '';
        }
    };

    if (sortConfig) {
      sortableItems.sort((a, b) => {
        const valA = getSortableValue(a, sortConfig.key);
        const valB = getSortableValue(b, sortConfig.key);
        if (valA < valB) return sortConfig.dir === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.dir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [contracts, sortConfig]);

  const filteredContracts = useMemo(() => {
    return (sortedContracts || []).filter(contract => {
      // Client
      if (searchClient && !contract.client?.name) return false;
      const clientMatch = !searchClient || (contract.client?.name || '').toLowerCase().includes(searchClient.toLowerCase());

      // Référence produit
      if (searchReference && (!contract.contractProducts || contract.contractProducts.length === 0)) return false;
      const refMatch = !searchReference || (contract.contractProducts || []).some(cp => (cp.product?.reference || '').toLowerCase().includes(searchReference.toLowerCase()));

      // Commercial
      const commercialMatch = !searchCommercial || (contract.user?.name || '').toLowerCase().includes(searchCommercial.toLowerCase());

      // Commentaire
      const commentMatch = !searchComment || (contract.commentaire || '').toLowerCase().includes(searchComment.toLowerCase());

      // Dates
      let dateMatch = true;
      if (searchStartDate) {
        dateMatch = dateMatch && contract.startDate && contract.startDate.slice(0, 10) >= searchStartDate;
      }
      if (searchEndDate) {
        let fin = contract.endDate;
        if (!fin && contract.startDate && contract.duration) {
          const d = new Date(contract.startDate);
          d.setMonth(d.getMonth() + Number(contract.duration));
          if (d.getDate() !== new Date(contract.startDate).getDate()) d.setDate(0);
          fin = d.toISOString();
        }
        dateMatch = dateMatch && fin && fin.slice(0, 10) <= searchEndDate;
      }

      return clientMatch && refMatch && commercialMatch && commentMatch && dateMatch;
    });
  }, [sortedContracts, searchClient, searchReference, searchCommercial, searchComment, searchStartDate, searchEndDate]);

  const paginatedContracts = filteredContracts.slice((page - 1) * contractsPerPage, page * contractsPerPage);

  const fetchAll = async () => {
    if (!departementId) return;
    setLoading(true);
    try {
      const [contractsRes, clientsRes, productsRes] = await Promise.all([
        fetch(`/api/commercial/contracts?departementId=${departementId}`),
        fetch(`/api/commercial/clients?departementId=${departementId}`),
        fetch('/api/admin/products')
      ]);
      const contractsData = await contractsRes.json();
      const clientsData = await clientsRes.json();
      const productsData = await productsRes.json();
      setContracts(Array.isArray(contractsData) ? contractsData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error("Erreur chargement données commercial", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [departementId]);

  // Bouton de suppression retiré pour le rôle COMMERCIAL (22/10/2025) – la fonction handleDelete a été supprimée.

  const getEndDate = (contract) => {
    if (contract.endDate) return new Date(contract.endDate);
    if (contract.startDate && contract.duration) {
      const d = new Date(contract.startDate);
      d.setMonth(d.getMonth() + Number(contract.duration));
      if (d.getDate() !== new Date(contract.startDate).getDate()) d.setDate(0);
      return d;
    }
    return null;
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR');
  };

  if (mode === 'add' || (mode === 'edit' && editContract)) {
    return (
      <AddContractSPA 
        userEmail={user?.email}
        clients={clients} 
        products={products} 
        onSuccess={() => { setMode('list'); setEditContract(null); fetchAll(); }} 
        onCancel={() => { setMode('list'); setEditContract(null); }} 
        initialContract={editContract}
      />
    );
  }

  return (
    <section style={{ marginTop: 40, fontFamily: 'Montserrat, sans-serif' }}>
            <div style={{ background: '#fff', boxShadow: '0 2px 16px #00b3e610', borderRadius: 16, padding: '18px 28px', marginBottom: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
        <label>
          Client
          <input type="text" value={searchClient} onChange={e => setSearchClient(e.target.value)} placeholder="Rechercher..." style={{ width: '100%', marginTop: '4px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
        </label>
        <label>
          Référence produit
          <input type="text" value={searchReference} onChange={e => setSearchReference(e.target.value)} placeholder="Rechercher..." style={{ width: '100%', marginTop: '4px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
        </label>
         <label>
           Commentaire
           <input type="text" value={searchComment} onChange={e => setSearchComment(e.target.value)} placeholder="Rechercher..." style={{ width: '100%', marginTop: '4px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
         </label>
         <label>
           Commercial
           <input type="text" value={searchCommercial} onChange={e => setSearchCommercial(e.target.value)} placeholder="Rechercher..." style={{ width: '100%', marginTop: '4px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
         </label>
         <label>
           Début contrat (après le)
          <input type="date" value={searchStartDate} onChange={e => setSearchStartDate(e.target.value)} style={{ width: '100%', marginTop: '4px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
        </label>
        <label>
          Fin contrat (avant le)
          <input type="date" value={searchEndDate} onChange={e => setSearchEndDate(e.target.value)} style={{ width: '100%', marginTop: '4px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
        </label>
        <button onClick={() => { setSearchClient(''); setSearchReference(''); setSearchCommercial(''); setSearchComment(''); setSearchStartDate(''); setSearchEndDate(''); }} style={{ padding: '8px 16px', background: '#e2eff4', color: '#005f73', border: '1px solid #00b3e6', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Réinitialiser</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: '#005f73', fontSize: 28, fontWeight: 800 }}>Liste des contrats</h2>
        <button onClick={() => setMode('add')} style={{ background: '#00b3e6', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
          + AJOUTER
        </button>
      </div>

      {loading ? <p>Chargement...</p> : (
        <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 4px 18px #00b3e620', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(to right, #00b3e6, #0090b3)' }}>
                                <th onClick={() => setSortConfig({ key: 'client', dir: sortConfig.key === 'client' && sortConfig.dir === 'asc' ? 'desc' : 'asc' })}>Client {sortConfig.key === 'client' ? (sortConfig.dir === 'asc' ? '▲' : '▼') : ''}</th>
                <th onClick={() => setSortConfig({ key: 'user', dir: sortConfig.key === 'user' && sortConfig.dir === 'asc' ? 'desc' : 'asc' })}>Commercial {sortConfig.key === 'user' ? (sortConfig.dir === 'asc' ? '▲' : '▼') : ''}</th>
                <th style={{ padding: '16px', color: '#fff', fontWeight: 700, textAlign: 'left' }}>Produit(s)</th>
                                <th onClick={() => setSortConfig({ key: 'startDate', dir: sortConfig.key === 'startDate' && sortConfig.dir === 'asc' ? 'desc' : 'asc' })}>Début {sortConfig.key === 'startDate' ? (sortConfig.dir === 'asc' ? '▲' : '▼') : ''}</th>
                <th onClick={() => setSortConfig({ key: 'endDate', dir: sortConfig.key === 'endDate' && sortConfig.dir === 'asc' ? 'desc' : 'asc' })}>Fin {sortConfig.key === 'endDate' ? (sortConfig.dir === 'asc' ? '▲' : '▼') : ''}</th>
                <th style={{ padding: '16px', color: '#fff', fontWeight: 700, textAlign: 'left' }}>Email Notification</th>
                <th style={{ padding: '16px', color: '#fff', fontWeight: 700, textAlign: 'left' }}>Statut</th>
                <th style={{ padding: '16px', color: '#fff', fontWeight: 700, textAlign: 'left' }}>Commentaire</th>
                <th style={{ padding: '16px', color: '#fff', fontWeight: 700, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedContracts.map((contract, index) => (
                <tr key={contract.id} style={{ background: index % 2 === 0 ? '#f6fcff' : '#e6f7fa', borderBottom: '1px solid #d0eefc' }}>
                                        <td style={{ padding: '14px 16px' }}>{contract.client?.name || 'N/A'}</td>
                      <td style={{ padding: '14px 16px' }}>{contract.user?.name || 'N/A'}</td>
                      <td style={{ padding: '14px 16px' }}>{(contract.contractProducts || []).map(cp => cp.product?.reference).join(', ') || 'N/A'}</td>
                      <td style={{ padding: '14px 16px' }}>{formatDate(contract.startDate)}</td>
                      <td style={{ padding: '14px 16px' }}>{formatDate(getEndDate(contract))}</td>
                      <td style={{ padding: '14px 16px' }}>{contract.email || 'N/A'}</td>
                      <td style={{ padding: '14px 16px' }}>{contract.status || 'N/A'}</td>
                      <td style={{ padding: '14px 16px' }}>{contract.commentaire || 'N/A'}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                        <button onClick={() => { setMode('edit'); setEditContract(contract); }} style={{ background: 'linear-gradient(90deg, #34d399, #2bb889)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>MODIFIER</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
            {filteredContracts.length > contractsPerPage && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, marginTop: 24 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '8px 16px', cursor: 'pointer', opacity: page === 1 ? 0.5 : 1 }}>Précédent</button>
          <span>Page {page} / {Math.ceil(filteredContracts.length / contractsPerPage)}</span>
          <button onClick={() => setPage(p => Math.min(Math.ceil(filteredContracts.length / contractsPerPage), p + 1))} disabled={page === Math.ceil(filteredContracts.length / contractsPerPage)} style={{ padding: '8px 16px', cursor: 'pointer', opacity: page === Math.ceil(filteredContracts.length / contractsPerPage) ? 0.5 : 1 }}>Suivant</button>
        </div>
      )}
    </section>
  );
}
