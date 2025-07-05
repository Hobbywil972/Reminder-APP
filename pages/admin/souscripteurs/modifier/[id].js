import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';
import AdminLayout from '../../../../components/Layout/AdminLayout';

const prisma = new PrismaClient();

export async function getServerSideProps(context) {
  const session = await getSession(context);
  const { id } = context.params; // Récupérer l'ID du souscripteur depuis l'URL

  if (!session || !session.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  try {
    const souscripteurId = parseInt(id, 10);
    if (isNaN(souscripteurId)) {
      console.log(`Invalid ID format: ${id}`);
      return { notFound: true }; 
    }

    const souscripteur = await prisma.user.findUnique({
      where: { id: souscripteurId },
      select: {
        id: true,
        name: true,
        email: true,
        clientId: true,
        role: true, // Pour s'assurer que c'est bien un souscripteur
      },
    });

    if (!souscripteur || souscripteur.role !== 'SOUSCRIPTEUR') {
      console.log(`Souscripteur not found or not a SOUSCRIPTEUR for ID: ${id}`);
      return { notFound: true }; 
    }

    const clients = await prisma.client.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    const userForLayout = session.user || session; 

    return {
      props: {
        user: {
          name: userForLayout.name,
          email: userForLayout.email,
          role: userForLayout.role,
        },
        souscripteurData: JSON.parse(JSON.stringify(souscripteur)),
        clientsData: JSON.parse(JSON.stringify(clients))
      },
    };
  } catch (error) {
    console.error(`Error in getServerSideProps for /admin/souscripteurs/modifier/${id}:`, error);
    return {
      redirect: {
        destination: '/admin/souscripteurs?error=data-fetch-failed',
        permanent: false,
      },
    };
  }
}

export default function EditSouscripteurPage({ user, souscripteurData, clientsData }) { 
  const router = useRouter();
  const [name, setName] = useState(souscripteurData.name || '');
  const [email, setEmail] = useState(souscripteurData.email || '');
  const [password, setPassword] = useState('');
  const [clientId, setClientId] = useState(souscripteurData.clientId || '');
  const [clients, setClients] = useState(clientsData || []);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (souscripteurData) {
      setName(souscripteurData.name || '');
      setEmail(souscripteurData.email || '');
      setClientId(souscripteurData.clientId || '');
    }
    if (clientsData) {
      setClients(clientsData);
    }
  }, [souscripteurData, clientsData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (!name || !email || !clientId) {
      setError('Le nom, l\'email et le client associé sont obligatoires.');
      setLoading(false);
      return;
    }

    const body = { name, email, clientId: parseInt(clientId, 10) };
    if (password && password.trim() !== '') { 
      body.password = password;
    }

    try {
      const res = await fetch(`/api/admin/souscripteurs/${souscripteurData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include', 
      });

      if (res.ok) {
        const updatedSouscripteur = await res.json();
        setSuccessMessage('Souscripteur mis à jour avec succès !');
        setName(updatedSouscripteur.name);
        setEmail(updatedSouscripteur.email);
        setClientId(updatedSouscripteur.clientId);
        setPassword(''); 
        setTimeout(() => router.push('/admin?section=souscripteurs'), 2000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || `Erreur ${res.status} lors de la mise à jour.`);
      }
    } catch (e) {
      console.error('Form submission error:', e);
      setError('Erreur de connexion ou problème lors de la soumission du formulaire.');
    }
    setLoading(false);
  };

  if (!souscripteurData) {
    return (
      <AdminLayout user={user} currentSection="souscripteurs">
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
          <div style={{ width: '100%', maxWidth: 600, background: '#fff', borderRadius: 18, boxShadow: '0 8px 28px #00b3e620', padding: '36px 32px 32px 32px', fontFamily: 'Montserrat, sans-serif' }}>
            <h1 style={{ color: '#00b3e6', fontWeight: 700, fontSize: 26, marginBottom: 10, textAlign: 'center' }}>
              Modifier le Souscripteur
            </h1>
            <p style={{ textAlign: 'center', marginBottom: 28, fontSize: 18, color: '#555' }}>Chargement des données du souscripteur ou souscripteur non trouvé...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={user} currentSection="souscripteurs">
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
        <div style={{ width: '100%', maxWidth: 600, background: '#fff', borderRadius: 18, boxShadow: '0 8px 28px #00b3e620', padding: '36px 32px 32px 32px', fontFamily: 'Montserrat, sans-serif' }}>
          <h1 style={{ color: '#00b3e6', fontWeight: 700, fontSize: 26, marginBottom: 10, textAlign: 'center' }}>
            Modifier le Souscripteur
          </h1>
          {/* Afficher le nom actuel du souscripteur (avant modification dans le formulaire) */}
          {souscripteurData && <p style={{ textAlign: 'center', marginBottom: 28, fontSize: 18, color: '#555' }}>{souscripteurData.name}</p>}
          
          <form onSubmit={handleSubmit}>
            {error && <p style={{ background: '#ffeaea', color: '#b90000', borderRadius: 8, padding: '8px 12px', fontWeight: 600, fontSize: 15, marginTop: 2, border: '1px solid #ffb3b3', textAlign: 'center', marginBottom: 15 }}>{error}</p>}
            {successMessage && <p style={{ background: '#e6fff6', color: '#008e4b', borderRadius: 8, padding: '8px 12px', fontWeight: 600, fontSize: 15, marginTop: 2, border: '1px solid #8ef2c0', textAlign: 'center', marginBottom: 15 }}>{successMessage}</p>}

            <div style={{ marginBottom: 20 }}>
              <label htmlFor="name" style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#333' }}>Nom :</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required 
                     style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #cce8f6', fontSize: 17, boxSizing: 'border-box', background: '#f6fcff', outline: 'none', transition: 'border 0.2s' }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label htmlFor="email" style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#333' }}>Email :</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required 
                     style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #cce8f6', fontSize: 17, boxSizing: 'border-box', background: '#f6fcff', outline: 'none', transition: 'border 0.2s' }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label htmlFor="password" style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#333' }}>Nouveau Mot de Passe (laisser vide pour ne pas changer) :</label>
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} 
                     style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #cce8f6', fontSize: 17, boxSizing: 'border-box', background: '#f6fcff', outline: 'none', transition: 'border 0.2s' }} />
            </div>

            <div style={{ marginBottom: 30 }}>
              <label htmlFor="clientId" style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#333' }}>Client Associé :</label>
              <select id="clientId" value={clientId} onChange={(e) => setClientId(e.target.value)} required 
                      style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #cce8f6', fontSize: 17, background: '#f6fcff', boxSizing: 'border-box', outline: 'none', transition: 'border 0.2s' }}>
                <option value="">Sélectionner un client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={loading} 
                    style={{
                      background: loading ? '#ccc' : '#00b3e6', color: '#fff', border: 'none', borderRadius: 10, 
                      padding: '12px 0', fontWeight: 700, fontSize: 18, cursor: loading ? 'not-allowed' : 'pointer',
                      width: '100%', transition: 'background 0.15s', opacity: loading ? 0.7 : 1,
                      boxShadow: loading ? 'none' : '0 2px 8px #00b3e620'
                    }}
                    onMouseOver={e => { if (!loading) e.currentTarget.style.background = '#0090b3'; }}
                    onMouseOut={e => { if (!loading) e.currentTarget.style.background = '#00b3e6'; }}
            >
              {loading ? 'Mise à jour en cours...' : 'Mettre à jour le Souscripteur'}
            </button>
            
            <button
              type="button"
              onClick={() => router.push('/admin?section=souscripteurs')}
              style={{
                marginTop: 20, background: 'transparent', color: '#555',
                border: '1.5px solid #ddd', padding: '11px 0', borderRadius: 10,
                fontWeight: 600, fontSize: 16, cursor: 'pointer', width: '100%',
                transition: 'background 0.12s, border-color 0.12s, color 0.12s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.borderColor = '#bbb'; e.currentTarget.style.color = '#333';}}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.color = '#555';}}
            >
              Annuler et retourner à la liste
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>


  );
}

