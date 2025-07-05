import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

export default function SouscripteurDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contracts, setContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [errorContracts, setErrorContracts] = useState('');

  useEffect(() => {
    if (status === 'loading') return; // Ne rien faire pendant le chargement
    if (status === 'unauthenticated') {
      router.replace('/auth/signin'); // Rediriger si non authentifié
    }
    // Vérifier le rôle une fois la session chargée et authentifiée
    if (status === 'authenticated' && session.user?.role !== 'SOUSCRIPTEUR') {
      // Si l'utilisateur est authentifié mais n'est pas SOUSCRIPTEUR,
      // le rediriger vers la page de connexion avec une erreur ou une page d'accès refusé générale.
      router.replace('/auth/signin?error=Accès refusé pour cette section'); 
    }
  }, [session, status, router]);

  // Fetch contracts when session is available and user is a SOUSCRIPTEUR
  useEffect(() => {
    if (session && session.user?.role === 'SOUSCRIPTEUR') {
      const fetchContracts = async () => {
        setLoadingContracts(true);
        setErrorContracts('');
        try {
          const res = await fetch('/api/souscripteur/contracts', { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            console.log('Contrats reçus:', JSON.stringify(data, null, 2)); // Log pour vérifier les données
            setContracts(data);
          } else {
            const errorData = await res.json();
            console.error('Failed to fetch contracts:', errorData);
            setErrorContracts(`Impossible de charger vos contrats (HTTP ${res.status}: ${errorData.error || 'Erreur inconnue'}).`);
          }
        } catch (e) {
          console.error('Network error fetching contracts:', e);
          setErrorContracts('Erreur de connexion lors du chargement des contrats.');
        }
        setLoadingContracts(false);
      };
      fetchContracts();
    }
  }, [session]); // Dépend de la session pour s'exécuter

  // Afficher un message de chargement ou rien pendant la redirection ou si la session n'est pas valide
  if (status === 'loading' || !session || session.user?.role !== 'SOUSCRIPTEUR') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
        <p>Chargement des informations du souscripteur...</p>
      </div>
    );
  }

  // Contenu de la page pour le souscripteur authentifié
  return (
    <div style={{ fontFamily: 'Montserrat, sans-serif', padding: '30px', maxWidth: '900px', margin: '40px auto', background: '#fff', borderRadius: '12px', boxShadow: '0 6px 20px rgba(0,0,0,0.08)' }}>
      <header style={{ borderBottom: '1px solid #eee', paddingBottom: '20px', marginBottom: '30px' }}>
        <h1 style={{ color: '#333', fontSize: '28px', margin: 0 }}>Espace Souscripteur</h1>
      </header>
      
      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#555', fontSize: '22px', marginBottom: '15px' }}>Vos Informations</h2>
        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
          <p style={{ margin: '8px 0', fontSize: '16px' }}><strong>Nom:</strong> {session.user.name}</p>
          <p style={{ margin: '8px 0', fontSize: '16px' }}><strong>Email:</strong> {session.user.email}</p>
          {/* Ne pas afficher le rôle ici, car c'est implicite pour cette page */}
        </div>
      </section>

      {/* Section pour afficher les contrats (à implémenter) */}
      <section>
        <h2 style={{ color: '#555', fontSize: '22px', marginBottom: '15px' }}>Vos Contrats</h2>
        {loadingContracts ? (
          <p>Chargement des contrats...</p>
        ) : errorContracts ? (
          <div style={{ color: 'red', background: '#ffeaea', border: '1px solid #ffb3b3', padding: '10px', borderRadius: '8px' }}>{errorContracts}</div>
        ) : contracts.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#f9f9f9', borderRadius: '8px' }}>
              <thead>
                <tr style={{ background: '#00b3e6', color: 'white' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '16px' }}>Produit(s)</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '16px' }}>Date de Début</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '16px' }}>Date de Fin</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '16px' }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract, index) => (
                  <tr key={contract.id} style={{ borderBottom: index === contracts.length - 1 ? 'none' : '1px solid #e0e0e0' }}>
                    <td style={{ padding: '12px', fontSize: '15px' }}>
                      {contract.contractProducts && contract.contractProducts.length > 0 
                        ? contract.contractProducts.map((cp, index) => (
                        <React.Fragment key={cp.product?.id || index}>
                          {index > 0 && ', '}
                          <span 
                            title={cp.product?.description ? String(cp.product.description) : `Description pour ${cp.product?.reference || 'produit inconnu'}`}
                            
                          >
                            {cp.product?.reference || 'Référence N/A'}
                          </span>
                        </React.Fragment>
                      ))
                        : 'Aucun produit associé'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '15px' }}>{new Date(contract.startDate).toLocaleDateString()}</td>
                    <td style={{ padding: '12px', fontSize: '15px' }}>
                      {(() => {
                        if (contract.startDate && contract.duration != null) {
                          const startDate = new Date(contract.startDate);
                          const endDate = new Date(startDate.setMonth(startDate.getMonth() + contract.duration));
                          return endDate.toLocaleDateString();
                        } 
                        return 'N/A';
                      })()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '15px' }}>{contract.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#777', fontSize: '16px' }}>Vous n'avez aucun contrat pour le moment.</p>
          </div>
        )}
      </section>

      <footer style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eee', textAlign: 'center' }}>
        <button 
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          style={{
            background: '#ff4957',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'background 0.2s ease'
          }}
          onMouseOver={e => e.currentTarget.style.background = '#d93642'}
          onMouseOut={e => e.currentTarget.style.background = '#ff4957'}
        >
          Se Déconnecter
        </button>
      </footer>
    </div>
  );
}
