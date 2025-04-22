import { useState, useEffect } from 'react';
import AddContractSPA from '../../components/AddContractSPA';
import { SortableTh, useSortableData } from '../../components/SortableTh';

function formatDateFr(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('fr-FR');
}

export default function ContractsSection() {
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
  const [dateFinStart, setDateFinStart] = useState('');
  const [dateFinEnd, setDateFinEnd] = useState('');

  // Hook trié
  const sortedContracts = useSortableData(contracts, sort);

  // Filtrage combiné
  const filteredContracts = sortedContracts.filter(contract => {
    // Filtre client
    const clientMatch = !searchClient || (contract.client?.name || '').toLowerCase().includes(searchClient.toLowerCase());
    // Filtre référence
    const refMatch = !searchReference || (contract.contractProducts || []).some(cp => (cp.product?.reference || '').toLowerCase().includes(searchReference.toLowerCase()));
    // Filtre date de fin
    let fin = contract.endDate;
    if (!fin && contract.startDate && contract.duration) {
      const d = new Date(contract.startDate);
      d.setMonth(d.getMonth() + Number(contract.duration));
      if (d.getDate() !== new Date(contract.startDate).getDate()) d.setDate(0);
      fin = d.toISOString();
    }
    let dateMatch = true;
    if (dateFinStart) dateMatch = dateMatch && fin && fin.slice(0,10) >= dateFinStart;
    if (dateFinEnd) dateMatch = dateMatch && fin && fin.slice(0,10) <= dateFinEnd;
    return clientMatch && refMatch && dateMatch;
  });

  const fetchAll = async () => {
    setLoading(true);
    const [contractsRes, clientsRes, productsRes] = await Promise.all([
      fetch('/api/admin/contracts', { credentials: 'include' }),
      fetch('/api/admin/clients', { credentials: 'include' }),
      fetch('/api/admin/products', { credentials: 'include' })
    ]);
function safeJson(res) {
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) throw new Error('Erreur API');
  if (!contentType.includes('application/json')) throw new Error('Session expirée ou accès refusé');
  return res.json();
}

const [contractsData, clientsData, productsData] = await Promise.all([
  safeJson(contractsRes), safeJson(clientsRes), safeJson(productsRes)
]);
    setContracts(contractsData);
    setClients(clientsData);
    setProducts(productsData);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  if (mode === 'add' || (mode === 'edit' && editContract)) {
    return (
      <AddContractSPA
        clients={clients}
        products={products}
        initialContract={editContract}
        onSuccess={() => { setMode('list'); setEditContract(null); fetchAll(); }}
        onCancel={() => { setMode('list'); setEditContract(null); }}
      />
    );
  }

  return (
    <section style={{ marginTop: 40, fontFamily: 'Montserrat, sans-serif' }}>
      {/* Zone de filtres améliorée */}
      <div style={{ background: '#fff', boxShadow: '0 2px 16px #00b3e610', borderRadius: 16, padding: '18px 28px', marginBottom: 24, display: 'flex', alignItems: 'flex-end', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontWeight: 600, color: '#0090b3', fontSize: 13, marginBottom: 2 }}>Client</label>
          <input
            type="text"
            placeholder="Rechercher par client..."
            value={searchClient}
            onChange={e => { setSearchClient(e.target.value); setPage(1); }}
            style={{ padding: 8, borderRadius: 8, border: '1.5px solid #cce8f6', fontSize: 15, fontFamily: 'Montserrat, sans-serif', minWidth: 180, background: '#f6fcff' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontWeight: 600, color: '#0090b3', fontSize: 13, marginBottom: 2 }}>Référence</label>
          <input
            type="text"
            placeholder="Rechercher par référence..."
            value={searchReference}
            onChange={e => { setSearchReference(e.target.value); setPage(1); }}
            style={{ padding: 8, borderRadius: 8, border: '1.5px solid #cce8f6', fontSize: 15, fontFamily: 'Montserrat, sans-serif', minWidth: 150, background: '#f6fcff' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontWeight: 600, color: '#0090b3', fontSize: 13, marginBottom: 2 }}>Fin entre</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="date"
              value={dateFinStart}
              onChange={e => { setDateFinStart(e.target.value); setPage(1); }}
              style={{ padding: 7, borderRadius: 8, border: '1.5px solid #cce8f6', fontSize: 15, fontFamily: 'Montserrat, sans-serif', background: '#f6fcff' }}
            />
            <span style={{ color: '#888', fontSize: 13 }}>et</span>
            <input
              type="date"
              value={dateFinEnd}
              onChange={e => { setDateFinEnd(e.target.value); setPage(1); }}
              style={{ padding: 7, borderRadius: 8, border: '1.5px solid #cce8f6', fontSize: 15, fontFamily: 'Montserrat, sans-serif', background: '#f6fcff' }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => { setSearchClient(''); setDateFinStart(''); setDateFinEnd(''); setPage(1); }}
          style={{ marginLeft: 10, marginTop: 18, padding: '8px 20px', borderRadius: 8, border: 'none', background: '#e6f7fa', color: '#00b3e6', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 2px 8px #00b3e610', transition: 'background 0.18s' }}
        >
          Réinitialiser
        </button>
      </div>
      {/* En-tête contrats et actions */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 28, color: '#00b3e6', background: '#e6f7fa', borderRadius: '50%', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📄</span>
          <h2 style={{ color: '#00b3e6', fontWeight: 800, fontSize: 26, margin: 0, letterSpacing: 1 }}>Contrats</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <label style={{ fontWeight: 700, color: '#00b3e6', fontFamily: 'Montserrat, sans-serif', fontSize: 15, display: 'flex', alignItems: 'center', gap: 5, background: '#fff', border: '1.5px solid #00b3e6', borderRadius: 10, boxShadow: '0 2px 8px #00b3e610', padding: '6px 20px', marginRight: 0 }}>
            <span role="img" aria-label="voir">👁️</span> Afficher&nbsp;
            <select
              value={contractsPerPage}
              onChange={e => { setContractsPerPage(Number(e.target.value)); setPage(1); }}
              style={{ padding: '6px 14px', border: '1.5px solid #cce8f6', borderRadius: 8, fontFamily: 'Montserrat, sans-serif', fontSize: 15, background: '#f6fcff', color: '#222', outline: 'none', marginLeft: 4, marginRight: 4 }}
            >
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            &nbsp;par page
          </label>
          <button
            style={{
              background: 'linear-gradient(90deg, #00b3e6 60%, #43e0ff 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '13px 0',
              fontWeight: 800,
              fontSize: 18,
              fontFamily: 'Montserrat, sans-serif',
              boxShadow: '0 4px 18px #00b3e650',
              cursor: 'pointer',
              transition: 'background 0.18s, box-shadow 0.18s',
              width: 240,
              letterSpacing: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              textTransform: 'uppercase',
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #0090b3 60%, #43e0ff 100%)';
              e.currentTarget.style.boxShadow = '0 8px 32px #00b3e660';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #00b3e6 60%, #43e0ff 100%)';
              e.currentTarget.style.boxShadow = '0 4px 18px #00b3e650';
            }}
            onClick={() => setMode('add')}
          >
            <span role="img" aria-label="plus">➕</span> AJOUTER
          </button>
        </div>
      </header>
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div style={{
          background: '#fff',
          borderRadius: 18,
          boxShadow: '0 4px 18px #00b3e620',
          padding: 0,
          overflowX: 'auto',
          marginBottom: 24,
        }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 680 }}>
            <thead>
              <tr style={{ background: '#00b3e6' }}>
                <SortableTh label="Client" sortKey="client" sort={sort} setSort={setSort} />
                <SortableTh label="Produits" sortKey="produits" sort={sort} setSort={setSort} />
                <SortableTh label="Début" sortKey="debut" sort={sort} setSort={setSort} />
                <SortableTh label="Fin" sortKey="fin" sort={sort} setSort={setSort} />
                <SortableTh label="Email Alertée" sortKey="email" sort={sort} setSort={setSort} />
                <SortableTh label="Statut" sortKey="statut" sort={sort} setSort={setSort} />
                <th style={{ padding: 14, color: '#fff', fontWeight: 700, fontSize: 18, borderTopRightRadius: 18 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.slice((page-1)*contractsPerPage, page*contractsPerPage).map((contract, idx) => (
                <tr key={contract.id} style={{ background: idx % 2 === 0 ? '#f6fcff' : '#e6f7fa' }}>
                  <td style={{ padding: 12, border: 'none', fontSize: 17, borderBottom: '1px solid #e0e0e0', borderTopLeftRadius: idx === 0 ? 18 : 0 }}>{contract.client?.name}</td>
                  <td style={{ padding: 12, border: 'none', fontSize: 17, borderBottom: '1px solid #e0e0e0' }}>{contract.contractProducts.map(cp => cp.product.reference).join(', ')}</td>
                  <td style={{ padding: 12, border: 'none', fontSize: 17, borderBottom: '1px solid #e0e0e0' }}>{formatDateFr(contract.startDate)}</td>
                  <td style={{ padding: 12, border: 'none', fontSize: 17, borderBottom: '1px solid #e0e0e0' }}>{(() => {
  let fin = contract.endDate;
  if (!fin && contract.startDate && contract.duration) {
    const d = new Date(contract.startDate);
    d.setMonth(d.getMonth() + Number(contract.duration));
    if (d.getDate() !== new Date(contract.startDate).getDate()) d.setDate(0);
    fin = d.toISOString();
  }
  return formatDateFr(fin);
})()}</td>
                  <td style={{ padding: 12, border: 'none', fontSize: 17, borderBottom: '1px solid #e0e0e0' }}>{contract.email || ''}</td>
                  <td style={{ padding: 12, border: 'none', fontSize: 17, borderBottom: '1px solid #e0e0e0' }}>{contract.status || ''}</td>
                  <td style={{ padding: 12, border: 'none', fontSize: 17, borderBottom: '1px solid #e0e0e0', borderTopRightRadius: idx === 0 ? 18 : 0 }}>
                    <button
                      style={{
                        background: 'linear-gradient(90deg, #00b3e6 60%, #43e0ff 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        padding: '9px 0',
                        fontWeight: 800,
                        fontSize: 15,
                        fontFamily: 'Montserrat, sans-serif',
                        boxShadow: '0 2px 8px #00b3e640',
                        cursor: 'pointer',
                        transition: 'background 0.18s, box-shadow 0.18s',
                        width: 120,
                        letterSpacing: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        textTransform: 'uppercase',
                        marginRight: 8,
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.background = 'linear-gradient(90deg, #0090b3 60%, #43e0ff 100%)';
                        e.currentTarget.style.boxShadow = '0 6px 18px #00b3e660';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.background = 'linear-gradient(90deg, #00b3e6 60%, #43e0ff 100%)';
                        e.currentTarget.style.boxShadow = '0 2px 8px #00b3e640';
                      }}
                      onClick={() => { setEditContract(contract); setMode('edit'); }}
                    >
                      <span role="img" aria-label="crayon">✏️</span> MODIFIER
                    </button>
                    <button
                      style={{
                        background: 'linear-gradient(90deg, #ff4957 60%, #ff8d43 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        padding: '9px 0',
                        fontWeight: 800,
                        fontSize: 15,
                        fontFamily: 'Montserrat, sans-serif',
                        boxShadow: '0 2px 8px #ff495770',
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
                        e.currentTarget.style.background = 'linear-gradient(90deg, #c9001a 60%, #ff8d43 100%)';
                        e.currentTarget.style.boxShadow = '0 6px 18px #ff495780';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.background = 'linear-gradient(90deg, #ff4957 60%, #ff8d43 100%)';
                        e.currentTarget.style.boxShadow = '0 2px 8px #ff495770';
                      }}
                      onClick={async () => {
                        if (!window.confirm('Confirmer la suppression du contrat ?')) return;
                        const res = await fetch('/api/admin/contracts', {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: contract.id }),
                          credentials: 'include',
                        });
                        if (res.ok) {
                          setContracts(contracts.filter(c => c.id !== contract.id));
                        } else {
                          const data = await res.json();
                          alert(data.error || 'Erreur lors de la suppression');
                        }
                      }}
                    >
                      <span role="img" aria-label="poubelle">🗑️</span> SUPPRIMER
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {contracts.length > contractsPerPage && (
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
            Page {page} / {Math.ceil(contracts.length / contractsPerPage)}
          </span>
          <button
            onClick={() => setPage(p => Math.min(Math.ceil(contracts.length / contractsPerPage), p + 1))}
            disabled={page === Math.ceil(contracts.length / contractsPerPage)}
            style={{
              padding: '7px 18px',
              background: '#f6fcff',
              color: '#00b3e6',
              border: '1.5px solid #cce8f6',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 15,
              cursor: page === Math.ceil(contracts.length / contractsPerPage) ? 'not-allowed' : 'pointer',
              fontFamily: 'Montserrat, sans-serif',
              opacity: page === Math.ceil(contracts.length / contractsPerPage) ? 0.5 : 1,
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
