import { useState, useEffect } from 'react';

// Helper function for API calls
async function fetchApi(url, options) {
    const response = await fetch(url, options);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Une erreur est survenue' }));
        throw new Error(errorData.message || 'Erreur inconnue');
    }
    if (response.status === 204) return null; // For DELETE No Content
    return response.json();
}

const DepartementForm = ({ departement, onSave, onCancel }) => {
    const [name, setName] = useState(departement ? departement.name : '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...departement, name });
    };

    return (
        <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '500px', margin: '30px auto' }}>
            <h3 style={{ color: '#005f73', fontSize: '22px', fontWeight: 700, marginBottom: '20px' }}>
                {departement ? 'Modifier le département' : 'Ajouter un département'}
            </h3>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '16px' }}>
                    <label htmlFor="name" style={{ display: 'block', fontWeight: 600, color: '#0090b3', marginBottom: '6px' }}>Nom du département</label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Commercial Est"
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cce8f6', fontSize: '15px' }}
                        required
                    />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                    <button type="button" onClick={onCancel} style={{ padding: '10px 20px', background: '#f0f0f0', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                        Annuler
                    </button>
                    <button type="submit" style={{ padding: '10px 20px', background: '#00b3e6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                        {departement ? 'Enregistrer' : 'Ajouter'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const Departements = () => {
    const [departements, setDepartements] = useState([]);
    const [mode, setMode] = useState('list'); // 'list', 'add', 'edit'
    const [currentDepartement, setCurrentDepartement] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchDepartements = async () => {
        try {
            const data = await fetchApi('/api/admin/departements');
            setDepartements(data);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => { fetchDepartements(); }, []);

    const handleSave = async (departementData) => {
        setError('');
        setSuccess('');
        try {
            if (mode === 'edit') {
                await fetchApi('/api/admin/departements', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(departementData),
                });
                setSuccess('Département modifié avec succès !');
            } else {
                await fetchApi('/api/admin/departements', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: departementData.name }),
                });
                setSuccess('Département ajouté avec succès !');
            }
            setMode('list');
            fetchDepartements();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Voulez-vous vraiment supprimer ce département ?')) {
            setError('');
            setSuccess('');
            try {
                await fetchApi(`/api/admin/departements?id=${id}`, { method: 'DELETE' });
                setSuccess('Département supprimé avec succès !');
                fetchDepartements();
            } catch (err) {
                setError(err.message);
            }
        }
    };

    if (mode === 'add' || mode === 'edit') {
        return <DepartementForm 
            departement={currentDepartement} 
            onSave={handleSave} 
            onCancel={() => setMode('list')} 
        />;
    }

    return (
        <section style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ color: '#005f73', fontSize: '28px', fontWeight: 800 }}>Départements</h2>
                <button 
                    onClick={() => { setMode('add'); setCurrentDepartement(null); }}
                    style={{ background: '#00b3e6', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 22px', fontWeight: 700, fontSize: '16px', cursor: 'pointer' }}
                >
                    + Ajouter un département
                </button>
            </div>

            {error && <div style={{ backgroundColor: '#ffdddd', border: '1px solid #ffaaaa', color: '#d8000c', padding: '10px', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}
            {success && <div style={{ backgroundColor: '#ddffdd', border: '1px solid #aaffaa', color: '#005000', padding: '10px', borderRadius: '8px', marginBottom: '16px' }}>{success}</div>}

            <div style={{ background: '#fff', borderRadius: '18px', boxShadow: '0 4px 18px rgba(0, 179, 230, 0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'linear-gradient(to right, #00b3e6, #0090b3)' }}>
                            <th style={{ padding: '16px', color: '#fff', fontWeight: 700, textAlign: 'left' }}>Nom</th>
                            <th style={{ padding: '16px', color: '#fff', fontWeight: 700, textAlign: 'center', width: '150px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {departements.map((dep, index) => (
                            <tr key={dep.id} style={{ background: index % 2 === 0 ? '#f6fcff' : '#e6f7fa', borderBottom: '1px solid #d0eefc' }}>
                                <td style={{ padding: '14px 16px', color: '#005f73' }}>{dep.name}</td>
                                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                    <button onClick={() => { setMode('edit'); setCurrentDepartement(dep); }} style={{ background: 'linear-gradient(to right, #00b3e6, #009dcc)', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer', marginRight: '8px', fontWeight: 'bold' }}>MODIFIER</button>
                                    <button onClick={() => handleDelete(dep.id)} style={{ background: 'linear-gradient(to right, #ff416c, #ff4b2b)', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer', fontWeight: 'bold' }}>SUPPRIMER</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default Departements;
