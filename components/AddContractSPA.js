import { useState, useEffect } from 'react';

export default function AddContractSPA({ clients, products, onSuccess, onCancel, initialContract }) {
  const [email, setEmail] = useState(initialContract ? initialContract.email || '' : '');
  // Alerte renouvellement (mois avant fin)
  const [renewalAlertMonths, setRenewalAlertMonths] = useState(initialContract ? initialContract.renewalAlertMonths || 1 : 1);
  const [clientId, setClientId] = useState(initialContract ? initialContract.clientId?.toString() || (initialContract.client?.id?.toString?.() || '') : '');
  const [clientSearch, setClientSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Nouvelle gestion : liste des produits ajoutés
  const [productsWithQuantities, setProductsWithQuantities] = useState(initialContract ? initialContract.contractProducts?.map(cp => ({ productId: cp.productId || cp.product?.id, quantity: cp.quantity })) || [] : []); // [{productId, quantity}]
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [productSearch, setProductSearch] = useState('');
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [startDate, setStartDate] = useState(initialContract ? initialContract.startDate?.slice(0,10) : '');
  const [duration, setDuration] = useState(initialContract ? initialContract.duration || 12 : 12); // en mois (par défaut 12)

  // Calcule la date de fin automatiquement
  const computedEndDate = (() => {
    if (!startDate || !duration) return '';
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + Number(duration));
    // Corrige les dépassements de mois (ex: 31 jan + 1 mois = 3 mars)
    if (d.getDate() !== new Date(startDate).getDate()) d.setDate(0);
    return d.toISOString().slice(0, 10);
  })();
  const [status, setStatus] = useState(initialContract ? initialContract.status : 'EN_COURS');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Empêche les doublons de référence produit
  const availableProducts = (currentId) => products.filter(
    p =>
      !productsWithQuantities.some(
        pq => pq.productId === p.id && p.id !== currentId
      )
  );

  const handleProductChange = (idx, value) => {
    setProductsWithQuantities(pqs => pqs.map((pq, i) => i === idx ? { ...pq, productId: Number(value) } : pq));
  };

  const handleQuantityChange = (idx, value) => {
    setProductsWithQuantities(pqs => pqs.map((pq, i) => i === idx ? { ...pq, quantity: Math.max(1, Number(value)) } : pq));
  };

  const handleAddLine = () => {
    setProductsWithQuantities(pqs => [...pqs, { productId: '', quantity: 1 }]);
  };

  const handleRemoveLine = (idx) => {
    setProductsWithQuantities(pqs => pqs.length > 1 ? pqs.filter((_, i) => i !== idx) : pqs);
  };

  useEffect(() => {
    if (initialContract) {
      setEmail(initialContract.email || '');
      setRenewalAlertMonths(initialContract.renewalAlertMonths || 1);
      setClientId(initialContract.clientId?.toString() || (initialContract.client?.id?.toString?.() || ''));
      setProductsWithQuantities(initialContract.contractProducts?.map(cp => ({ productId: cp.productId || cp.product?.id, quantity: cp.quantity })) || []);
      setStartDate(initialContract.startDate?.slice(0,10) || '');
      setDuration(initialContract.duration || 12);
      setStatus(initialContract.status || 'EN_COURS');
    }
    // eslint-disable-next-line
  }, [initialContract]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!clientId || !startDate || !duration) {
      setError('Client, produit(s), dates et durée obligatoires');
      return;
    }
    if (productsWithQuantities.length === 0) {
      setError('Au moins un produit doit être ajouté.');
      return;
    }
    // Remplace productsWithQuantities par filteredProductsWithQuantities pour l'envoi
    // et autorise 1 ou plusieurs produits sélectionnés
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Adresse email valide obligatoire');
      return;
    }
    if (!status) {
      setError('Statut obligatoire');
      return;
    }
    if (!renewalAlertMonths || renewalAlertMonths < 1 || renewalAlertMonths > 12) {
      setError('L\'alerte de renouvellement doit être comprise entre 1 et 12 mois.');
      return;
    }
    // Récupère le CSRF token
    let csrfToken = '';
    try {
      const csrfRes = await fetch('/api/auth/csrf');
      if (csrfRes.ok) {
        const csrfData = await csrfRes.json();
        csrfToken = csrfData.csrfToken;
      }
    } catch (e) {}
    if (!csrfToken) {
      setError('Erreur technique : CSRF Token manquant. Veuillez recharger la page.');
      return;
    }
    const method = initialContract ? 'PUT' : 'POST';
    const payload = initialContract ?
      { id: initialContract.id, clientId: Number(clientId), productsWithQuantities, startDate, endDate: computedEndDate, status, duration: Number(duration), renewalAlertMonths: Number(renewalAlertMonths), email, csrfToken }
      : { clientId: Number(clientId), productsWithQuantities, startDate, duration: Number(duration), status, renewalAlertMonths: Number(renewalAlertMonths), email, csrfToken };
    const res = await fetch('/api/admin/contracts', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    });
    if (res.ok) {
      setSuccess('Contrat ajouté avec succès');
      // Réinitialise le formulaire
      setEmail('');
      setRenewalAlertMonths(1);
      setClientId('');
      setProductsWithQuantities([]);
      setSelectedProductId('');
      setSelectedQuantity(1);
      setStartDate('');
      setDuration(12);
      setStatus('EN_COURS');
      setTimeout(() => {
        setSuccess('');
        if (onSuccess) onSuccess();
      }, 2000);
    } else {
      let data;
      try {
        data = await res.json();
      } catch (e) {
        data = {};
      }
      setError(data.error || 'Erreur lors de l\'ajout');
      // Affiche l’erreur réseau en console pour debug
      console.error('Erreur API contrat', data);
    }
  };


  return (
    <section style={{ maxWidth: 540, margin: '60px auto', fontFamily: 'Montserrat, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 4px 18px #00b3e620', padding: '38px 32px', maxWidth: 540, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <span style={{ fontSize: 28, color: '#00b3e6', background: '#e6f7fa', borderRadius: '50%', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📄</span>
          <h2 style={{ color: '#00b3e6', fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 24, margin: 0, letterSpacing: 1 }}>{initialContract ? 'Modifier le contrat' : 'Ajouter un contrat'}</h2>
        </div>
        {/* Champ Client (autocomplete) */}
        <label style={{ fontWeight: 600, fontSize: 16, marginBottom: 2, position: 'relative', display: 'block', marginBottom: 18 }}>Client
  <input
    type="text"
    value={clientSearch}
    onChange={e => {
      setClientSearch(e.target.value);
      setClientId('');
    }}
    placeholder="Rechercher un client..."
    style={{ marginTop: 8, padding: '10px 16px', border: '1.5px solid #cce8f6', borderRadius: 10, fontSize: 15, fontFamily: 'Montserrat, sans-serif', outline: 'none', width: '100%' }}
    required={!clientId}
    autoComplete="off"
    onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
    onFocus={() => setShowSuggestions(true)}
  />
  {/* Suggestions */}
  {clientSearch && showSuggestions && (
    <div style={{ position: 'absolute', top: 56, left: 0, right: 0, background: '#fff', border: '1.5px solid #cce8f6', borderRadius: 10, zIndex: 10, maxHeight: 200, overflowY: 'auto', boxShadow: '0 2px 8px #00b3e620' }}>
      {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 ? (
        <div style={{ padding: 10, color: '#888' }}>Aucun client trouvé</div>
      ) : (
        clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).map(c => (
          <div
            key={c.id}
            style={{ padding: 10, cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
            onMouseDown={() => {
              setClientId(c.id.toString());
              setClientSearch(c.name);
              setShowSuggestions(false);
            }}
          >
            {c.name}
          </div>
        ))
      )}
    </div>
  )}
</label>
        {/* Bloc d’ajout de produits au contrat */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', minWidth: 180 }}>
            <input
              type="text"
              value={productSearch}
              onChange={e => {
                setProductSearch(e.target.value);
                setSelectedProductId('');
              }}
              placeholder="Rechercher un produit..."
              style={{ padding: 8, border: '1px solid #ccc', borderRadius: 4, width: '100%' }}
              autoComplete="off"
              onBlur={() => setTimeout(() => setShowProductSuggestions(false), 120)}
              onFocus={() => setShowProductSuggestions(true)}
            />
            {productSearch && showProductSuggestions && (
              <div style={{ position: 'absolute', top: 40, left: 0, right: 0, background: '#fff', border: '1.5px solid #cce8f6', borderRadius: 10, zIndex: 10, maxHeight: 200, overflowY: 'auto', boxShadow: '0 2px 8px #00b3e620' }}>
                {products.filter(p => (p.reference + ' ' + p.description).toLowerCase().includes(productSearch.toLowerCase())).length === 0 ? (
                  <div style={{ padding: 10, color: '#888' }}>Aucun produit trouvé</div>
                ) : (
                  products.filter(p => (p.reference + ' ' + p.description).toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                    <div
                      key={p.id}
                      style={{ padding: 10, cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                      onMouseDown={() => {
                        setSelectedProductId(p.id.toString());
                        setProductSearch(p.reference + ' — ' + p.description);
                        setShowProductSuggestions(false);
                      }}
                    >
                      {p.reference} — {p.description}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <input
            type="number"
            min={1}
            value={selectedQuantity}
            onChange={e => setSelectedQuantity(Math.max(1, Number(e.target.value)))}
            style={{ width: 60, padding: 4, border: '1px solid #ccc', borderRadius: 4 }}
          />
          <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                if (!selectedProductId) return;
                setProductsWithQuantities(pqs => [...pqs, { productId: Number(selectedProductId), quantity: selectedQuantity }]);
                setSelectedProductId('');
                setSelectedQuantity(1);
              }}
              style={{
                background: selectedProductId ? 'linear-gradient(90deg, #00b3e6 60%, #43e0ff 100%)' : '#e6f7fa',
                color: selectedProductId ? '#fff' : '#9cc4d6',
                border: 'none',
                borderRadius: 10,
                padding: '10px 18px',
                fontWeight: 800,
                fontSize: 15,
                fontFamily: 'Montserrat, sans-serif',
                boxShadow: selectedProductId ? '0 2px 8px #00b3e640' : 'none',
                cursor: selectedProductId ? 'pointer' : 'not-allowed',
                transition: 'background 0.18s, box-shadow 0.18s',
                width: 'auto',
                minWidth: 110,
                letterSpacing: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                textTransform: 'uppercase',
                marginLeft: 4
              }}
              onMouseOver={e => {
                if (selectedProductId) {
                  e.currentTarget.style.background = 'linear-gradient(90deg, #0090b3 60%, #43e0ff 100%)';
                  e.currentTarget.style.boxShadow = '0 6px 18px #00b3e660';
                }
              }}
              onMouseOut={e => {
                if (selectedProductId) {
                  e.currentTarget.style.background = 'linear-gradient(90deg, #00b3e6 60%, #43e0ff 100%)';
                  e.currentTarget.style.boxShadow = '0 2px 8px #00b3e640';
                }
              }}
              disabled={!selectedProductId}
            >
              <span role="img" aria-label="plus">➕</span> AJOUTER
            </button>
          </div>
        </div>
        {productsWithQuantities.length > 0 && (
          <table style={{ width: '100%', marginTop: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 4, borderBottom: '1px solid #ccc' }}>Produit</th>
                <th style={{ textAlign: 'left', padding: 4, borderBottom: '1px solid #ccc' }}>Quantité</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {productsWithQuantities.map((pq, idx) => {
                const prod = products.find(p => p.id === pq.productId);
                return (
                  <tr key={pq.productId + '-' + idx}>
                    <td style={{ padding: 4 }}>{prod ? `${prod.reference} — ${prod.description}` : ''}</td>
                    <td style={{ padding: 4 }}>{pq.quantity}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setProductsWithQuantities(pqs => pqs.filter((_, i) => i !== idx))}
                        style={{ background: '#eee', color: '#a00', border: '1px solid #ccc', borderRadius: 4, padding: '2px 10px', cursor: 'pointer' }}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 18 }}>

          <label style={{ fontWeight: 'bold' }}>Adresse Email (pour l'alerte de renouvellement)</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="exemple@mail.com" style={{ padding: 10, border: '1px solid #ccc', borderRadius: 4 }} />
          <label style={{ fontWeight: 'bold' }}>Date de début de contrat</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 4 }} />
          <label style={{ fontWeight: 'bold' }}>Durée du contrat (en mois)</label>
<input
  type="number"
  min={1}
  value={duration}
  onChange={e => setDuration(e.target.value)}
  style={{ padding: 10, border: '1px solid #ccc', borderRadius: 4 }}
  placeholder="Durée en mois"
/>
          {startDate && duration && (
            <div style={{ color: '#333', marginTop: 4 }}>
              Date de fin calculée : <b>{computedEndDate}</b>
            </div>
          )}
          <label style={{ fontWeight: 'bold' }}>Alerte de renouvellement (mois avant fin)</label>
          <input type="number" min={1} max={12} value={renewalAlertMonths} onChange={e => setRenewalAlertMonths(e.target.value)} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 4 }} />
          <button
            type="submit"
            style={{
              background: initialContract
                ? 'linear-gradient(90deg, #ffe066 60%, #ffeab3 100%)'
                : 'linear-gradient(90deg, #00b3e6 60%, #43e0ff 100%)',
              border: 'none',
              borderRadius: 12,
              padding: '15px 0',
              fontWeight: 800,
              fontSize: 19,
              fontFamily: 'Montserrat, sans-serif',
              boxShadow: initialContract ? '0 4px 18px #ffe06660' : '0 4px 18px #00b3e650',
              cursor: 'pointer',
              transition: 'background 0.18s, box-shadow 0.18s',
              width: '100%',
              letterSpacing: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              textTransform: 'uppercase',
            }}
            onMouseOver={e => {
              if (initialContract) {
                e.currentTarget.style.background = 'linear-gradient(90deg, #ffd700 60%, #ffeab3 100%)';
                e.currentTarget.style.boxShadow = '0 8px 32px #ffe06680';
              } else {
                e.currentTarget.style.background = 'linear-gradient(90deg, #0090b3 60%, #43e0ff 100%)';
                e.currentTarget.style.boxShadow = '0 8px 32px #00b3e660';
              }
            }}
            onMouseOut={e => {
              if (initialContract) {
                e.currentTarget.style.background = 'linear-gradient(90deg, #ffe066 60%, #ffeab3 100%)';
                e.currentTarget.style.boxShadow = '0 4px 18px #ffe06660';
              } else {
                e.currentTarget.style.background = 'linear-gradient(90deg, #00b3e6 60%, #43e0ff 100%)';
                e.currentTarget.style.boxShadow = '0 4px 18px #00b3e650';
              }
            }}
          >
            <span role="img" aria-label={initialContract ? 'crayon' : 'plus'}>{initialContract ? '✏️' : '➕'}</span> {initialContract ? 'MODIFIER LE CONTRAT' : 'AJOUTER LE CONTRAT'}
          </button>
          {error && <div style={{ background: '#ffeaea', color: '#d6002a', padding: '10px 0', borderRadius: 8, textAlign: 'center', fontWeight: 600, marginTop: 8 }}>{error}</div>}
          {success && <div style={{ background: '#eaffea', color: '#00b36b', padding: '10px 0', borderRadius: 8, textAlign: 'center', fontWeight: 600, marginTop: 8 }}>{success}</div>}
        </form>
        <button
          onClick={onCancel}
          style={{ marginTop: 26, background: '#f6fcff', color: '#00b3e6', border: '1.5px solid #cce8f6', borderRadius: 10, padding: '11px 0', fontWeight: 600, fontSize: 16, cursor: 'pointer', width: '100%', fontFamily: 'Montserrat, sans-serif', boxShadow: '0 2px 8px #00b3e620', transition: 'background 0.12s' }}
          onMouseOver={e => (e.currentTarget.style.background = '#e6f7fa')}
          onMouseOut={e => (e.currentTarget.style.background = '#f6fcff')}
        >
          <span role="img" aria-label="retour">↩️</span> Retour à la liste
        </button>
      </div>
    </section>
  );
}
