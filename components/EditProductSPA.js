import { useState, useEffect } from 'react';

export default function EditProductSPA({ product, onSuccess, onCancel }) {
  const [reference, setReference] = useState(product?.reference || '');
  const [description, setDescription] = useState(product?.description || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setReference(product?.reference || '');
    setDescription(product?.description || '');
  }, [product]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!reference.trim() || !description.trim()) {
      setError('La référence et la description sont obligatoires');
      return;
    }
    const res = await fetch('/api/admin/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: product.id, reference, description }),
      credentials: 'include',
    });
    if (res.ok) {
      setSuccess('Produit modifié avec succès');
      setTimeout(() => {
        setSuccess('');
        if (onSuccess) onSuccess();
      }, 1000);
    } else {
      const data = await res.json();
      setError(data.error || 'Erreur lors de la modification');
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '48px auto', fontFamily: 'Montserrat, sans-serif', background: '#fff', borderRadius: 18, boxShadow: '0 8px 28px #00b3e620', padding: '36px 32px 32px 32px' }}>
      <h2 style={{ color: '#00b3e6', fontWeight: 700, fontSize: 26, marginBottom: 28 }}>Modifier le produit</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <input
          type="text"
          placeholder="Référence"
          value={reference}
          onChange={e => setReference(e.target.value)}
          style={{
            padding: 13,
            border: '1.5px solid #cce8f6',
            borderRadius: 10,
            background: '#f6fcff',
            fontSize: 17,
            outline: 'none',
            transition: 'border 0.2s',
            fontFamily: 'inherit',
          }}
          onFocus={e => (e.target.style.border = '1.5px solid #00b3e6')}
          onBlur={e => (e.target.style.border = '1.5px solid #cce8f6')}
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={{
            padding: 13,
            border: '1.5px solid #cce8f6',
            borderRadius: 10,
            background: '#f6fcff',
            fontSize: 17,
            outline: 'none',
            transition: 'border 0.2s',
            fontFamily: 'inherit',
            minHeight: 60,
          }}
          onFocus={e => (e.target.style.border = '1.5px solid #00b3e6')}
          onBlur={e => (e.target.style.border = '1.5px solid #cce8f6')}
        />
        <button
          type="submit"
          style={{
            background: '#00b3e6',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 16,
            padding: '12px 0',
            marginBottom: 10,
            cursor: 'pointer',
            width: '100%',
            fontFamily: 'Montserrat, sans-serif',
            boxShadow: '0 2px 8px #00b3e620',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            transition: 'background 0.12s',
          }}
          onMouseOver={e => (e.currentTarget.style.background = '#0090b3')}
          onMouseOut={e => (e.currentTarget.style.background = '#00b3e6')}
        >
          <span role="img" aria-label="crayon">✏️</span> Sauvegarder
        </button>
        {error && <div style={{ background: '#ffeaea', color: '#b90000', borderRadius: 8, padding: '8px 12px', fontWeight: 600, fontSize: 15, marginTop: 2, border: '1px solid #ffb3b3', textAlign: 'center' }}>{error}</div>}
        {success && <div style={{ background: '#e6fff6', color: '#008e4b', borderRadius: 8, padding: '8px 12px', fontWeight: 600, fontSize: 15, marginTop: 2, border: '1px solid #8ef2c0', textAlign: 'center' }}>{success}</div>}
      </form>
      <button
        onClick={onCancel}
        style={{
          background: '#f6fcff',
          color: '#00b3e6',
          border: '1.5px solid #cce8f6',
          padding: '11px 0',
          borderRadius: 10,
          fontWeight: 600,
          fontSize: 16,
          cursor: 'pointer',
          width: '100%',
          fontFamily: 'Montserrat, sans-serif',
          boxShadow: '0 2px 8px #00b3e620',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          transition: 'background 0.12s',
        }}
        onMouseOver={e => (e.currentTarget.style.background = '#e6f7fa')}
        onMouseOut={e => (e.currentTarget.style.background = '#f6fcff')}
      >
        <span role="img" aria-label="retour">↩️</span> Retour à la liste
      </button>
    </div>
  );
}
