import { useState, useEffect } from 'react';
import AddProductSPA from '../../components/AddProductSPA';
import EditProductSPA from '../../components/EditProductSPA';

export default function ProductsSection({ user }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('list'); // "list", "add", "edit"
  const [editProduct, setEditProduct] = useState(null);
  const [productsPerPage, setProductsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [searchReference, setSearchReference] = useState('');
  const [sort, setSort] = useState({ key: 'reference', dir: 'asc' });

  // Tri et filtrage produits
  const sortedProducts = [...products].sort((a, b) => {
    let aVal = a[sort.key];
    let bVal = b[sort.key];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sort.dir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sort.dir === 'asc' ? 1 : -1;
    return 0;
  });
  const filteredProducts = sortedProducts.filter(p => !searchReference || (p.reference || '').toLowerCase().includes(searchReference.toLowerCase()));

  const fetchProducts = () => {
    setLoading(true);
    fetch('/api/admin/products', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (mode === 'add') {
    return (
      <AddProductSPA
        onSuccess={() => {
          setMode('list');
          fetchProducts();
        }}
        onCancel={() => setMode('list')}
      />
    );
  }

  if (mode === 'edit' && editProduct) {
    return (
      <EditProductSPA
        product={editProduct}
        onSuccess={() => {
          setMode('list');
          setEditProduct(null);
          fetchProducts();
        }}
        onCancel={() => {
          setMode('list');
          setEditProduct(null);
        }}
      />
    );
  }

  return (
    <section style={{ marginTop: 40 }}>
      {/* Barre de recherche référence */}
      <div style={{ background: '#fff', boxShadow: '0 2px 16px #00b3e610', borderRadius: 16, padding: '12px 24px', marginBottom: 18, display: 'flex', alignItems: 'flex-end', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontWeight: 600, color: '#0090b3', fontSize: 13, marginBottom: 2 }}>Référence</label>
          <input
            type="text"
            placeholder="Rechercher par référence..."
            value={searchReference}
            onChange={e => { setSearchReference(e.target.value); setPage(1); }}
            style={{ padding: 8, borderRadius: 8, border: '1.5px solid #cce8f6', fontSize: 15, fontFamily: 'Montserrat, sans-serif', minWidth: 180, background: '#f6fcff' }}
          />
        </div>
      </div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 26, color: '#00b3e6', margin: 0 }}>Produits</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            style={{ background: '#00b3e6', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 700, fontSize: 16, fontFamily: 'Montserrat, sans-serif', boxShadow: '0 2px 8px #00b3e620', cursor: 'pointer', transition: 'background 0.15s' }}
            onClick={() => setMode('add')}
            onMouseOver={e => (e.currentTarget.style.background = '#0090b3')}
            onMouseOut={e => (e.currentTarget.style.background = '#00b3e6')}
          >
            <span role="img" aria-label="plus">➕</span> Ajouter un produit
          </button>
          <label style={{ fontWeight: 700, color: '#00b3e6', fontFamily: 'Montserrat, sans-serif', fontSize: 15, display: 'flex', alignItems: 'center', gap: 5, background: '#fff', border: '1.5px solid #00b3e6', borderRadius: 10, boxShadow: '0 2px 8px #00b3e610', padding: '6px 20px', marginRight: 0 }}>
            <span role="img" aria-label="voir">👁️</span> Afficher&nbsp;
            <select
              value={productsPerPage}
              onChange={e => { setProductsPerPage(Number(e.target.value)); setPage(1); }}
              style={{ padding: '6px 14px', border: '1.5px solid #cce8f6', borderRadius: 8, fontFamily: 'Montserrat, sans-serif', fontSize: 15, background: '#f6fcff', color: '#222', outline: 'none', marginLeft: 4, marginRight: 4 }}
            >
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            &nbsp;par page
          </label>
          {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
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
                width: 220,
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
          )}
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
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 380 }}>
            <thead>
              <tr style={{ background: '#00b3e6' }}>
                <th
                  style={{ padding: 14, color: '#fff', fontWeight: 700, fontSize: 18, borderTopLeftRadius: 18, cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => setSort(s => ({ key: 'reference', dir: s.key === 'reference' && s.dir === 'asc' ? 'desc' : 'asc' }))}
                >
                  Référence {sort.key === 'reference' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th
                  style={{ padding: 14, color: '#fff', fontWeight: 700, fontSize: 18, cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => setSort(s => ({ key: 'description', dir: s.key === 'description' && s.dir === 'asc' ? 'desc' : 'asc' }))}
                >
                  Description {sort.key === 'description' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th style={{ padding: 14, color: '#fff', fontWeight: 700, fontSize: 18, borderTopRightRadius: 18 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.slice((page-1)*productsPerPage, page*productsPerPage).map((product, idx) => (
                <tr key={product.id} style={{ background: idx % 2 === 0 ? '#f6fcff' : '#e6f7fa' }}>
                  <td style={{ padding: 12, border: 'none', fontSize: 17, borderBottom: '1px solid #e0e0e0', borderTopLeftRadius: idx === 0 ? 18 : 0 }}>{product.reference}</td>
                  <td style={{ padding: 12, border: 'none', fontSize: 17, borderBottom: '1px solid #e0e0e0' }}>{product.description}</td>
                  <td style={{ padding: 12, border: 'none', fontSize: 17, borderBottom: '1px solid #e0e0e0', borderTopRightRadius: idx === 0 ? 18 : 0 }}>
                    {/* Bouton Modifier visible uniquement pour ADMIN */}
                    {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
                      <>
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
                            width: 140,
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
                          onClick={() => {
                            setEditProduct(product);
                            setMode('edit');
                          }}
                        >
                          <span role="img" aria-label="crayon">✏️</span> MODIFIER
                        </button>
                        <button
                          style={{
                            background: 'linear-gradient(90deg, #ff4957 60%, #ffb347 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 10,
                            padding: '9px 0',
                            fontWeight: 800,
                            fontSize: 15,
                            fontFamily: 'Montserrat, sans-serif',
                            boxShadow: '0 2px 8px #ff495740',
                            cursor: 'pointer',
                            transition: 'background 0.18s, box-shadow 0.18s',
                            width: 140,
                            letterSpacing: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            textTransform: 'uppercase',
                          }}
                          onMouseOver={e => {
                            e.currentTarget.style.background = 'linear-gradient(90deg, #c9001a 60%, #ffb347 100%)';
                            e.currentTarget.style.boxShadow = '0 6px 18px #ff495760';
                          }}
                          onMouseOut={e => {
                            e.currentTarget.style.background = 'linear-gradient(90deg, #ff4957 60%, #ffb347 100%)';
                            e.currentTarget.style.boxShadow = '0 2px 8px #ff495740';
                          }}
                          onClick={async () => {
                            if (window.confirm('Confirmer la suppression de ce produit ?')) {
                              const res = await fetch('/api/admin/products', {
                                method: 'DELETE',
                                credentials: 'include',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: product.id }),
                              });
                              if (res.ok) {
                                fetchProducts();
                              } else {
                                const data = await res.json();
                                alert(data.error || 'Erreur lors de la suppression');
                              }
                            }
                          }}
                        >
                          <span role="img" aria-label="poubelle">🗑️</span> SUPPRIMER
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {products.length > productsPerPage && (
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
            Page {page} / {Math.ceil(products.length / productsPerPage)}
          </span>
          <button
            onClick={() => setPage(p => Math.min(Math.ceil(products.length / productsPerPage), p + 1))}
            disabled={page === Math.ceil(products.length / productsPerPage)}
            style={{
              padding: '7px 18px',
              background: '#f6fcff',
              color: '#00b3e6',
              border: '1.5px solid #cce8f6',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 15,
              cursor: page === Math.ceil(products.length / productsPerPage) ? 'not-allowed' : 'pointer',
              fontFamily: 'Montserrat, sans-serif',
              opacity: page === Math.ceil(products.length / productsPerPage) ? 0.5 : 1,
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
