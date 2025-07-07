import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { signOut } from 'next-auth/react';
import LogoutButton from '../../components/LogoutButton';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session || !session.user) { // Vérifie session et session.user
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  // S'assurer que l'objet session.user existe et contient les informations nécessaires
  // Si session.user n'est pas directement peuplé par votre `authOptions` callbacks,
  // vous devrez peut-être le récupérer de la base de données ici en utilisant session.user.id ou session.user.email.
  // Pour l'instant, on suppose que session (ou session.user) contient { name, email, role }
  // session.user est maintenant garanti d'exister grâce à la vérification ci-dessus.
  // Nous utilisons directement session.user pour plus de clarté et de cohérence.
  const userFromSession = session.user;

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  let usersList = [];
  if (session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') {
    usersList = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
  }

  // Déterminer la section à afficher, avec 'clients' comme défaut
  const currentSection = context.query.section || 'clients'; 

  return {
    props: {
      // Passer l'objet utilisateur complet nécessaire pour AdminLayout et les sections
      user: {
        name: session.user.name,
        email: session.user.email,
        role: session.user.role, // Utilise directement session.user.role
      },
      users: usersList, // Renommé pour éviter la confusion avec 'user' de la session
      initialSection: currentSection,
    },
  };
}

function UsersSection({ users, user }) {
  return (
    <section style={{ marginTop: 40 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Utilisateurs</h2>
        <button
          style={{
            background: '#00b3e6',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 16,
            padding: '11px 22px',
            fontFamily: 'Montserrat, sans-serif',
            boxShadow: '0 2px 8px #00b3e620',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            transition: 'background 0.15s',
          }}
          onMouseOver={e => (e.currentTarget.style.background = '#0090b3')}
          onMouseOut={e => (e.currentTarget.style.background = '#00b3e6')}
          onClick={() => window.location.href = '/admin/users/add'}
        >
          <span role="img" aria-label="ajouter">➕</span> Ajouter un utilisateur
        </button>
      </header>
      <div style={{
        background: '#fff',
        borderRadius: 18,
        boxShadow: '0 4px 18px #00b3e620',
        padding: 0,
        overflowX: 'auto',
        marginBottom: 24,
      }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 480 }}>
          <thead>
            <tr style={{ background: '#00b3e6' }}>
              <th style={{ padding: 14, color: '#fff', fontWeight: 700, fontSize: 18, borderTopLeftRadius: 18 }}>Nom</th>
              <th style={{ padding: 14, color: '#fff', fontWeight: 700, fontSize: 18 }}>Email</th>
              <th style={{ padding: 14, color: '#fff', fontWeight: 700, fontSize: 18 }}>Rôle</th>
              <th style={{ padding: 14, color: '#fff', fontWeight: 700, fontSize: 18, borderTopRightRadius: 18 }}></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, idx) => (
              <tr key={u.id} style={{ background: idx % 2 === 0 ? '#f6fcff' : '#e6f7fa' }}>
                <td style={{ padding: 12, border: 'none', fontSize: 17, borderBottom: '1px solid #e0e0e0', borderTopLeftRadius: idx === 0 ? 18 : 0 }}>{u.name}</td>
                <td style={{ padding: 12, border: 'none', fontSize: 17, borderBottom: '1px solid #e0e0e0' }}>{u.email}</td>
                <td style={{ padding: 12, border: 'none', fontSize: 17, borderBottom: '1px solid #e0e0e0' }}>{u.role}</td>
                <td style={{ padding: 12, border: 'none', fontSize: 17, borderBottom: '1px solid #e0e0e0', borderTopRightRadius: idx === 0 ? 18 : 0 }}>
                  <button
                    style={{
                      background: '#00b3e6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 20px',
                      fontWeight: 600,
                      fontSize: 15,
                      fontFamily: 'Montserrat, sans-serif',
                      boxShadow: '0 2px 8px #00b3e620',
                      marginRight: 8,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'background 0.15s',
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = '#0090b3')}
                    onMouseOut={e => (e.currentTarget.style.background = '#00b3e6')}
                    onClick={() => window.location.href = `/admin/users/${u.id}`}
                  >
                    <span role="img" aria-label="crayon">✏️</span> Modifier
                  </button>
                  <button
                    style={{
                      background: '#ff4957',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 20px',
                      fontWeight: 600,
                      fontSize: 15,
                      fontFamily: 'Montserrat, sans-serif',
                      boxShadow: '0 2px 8px #ff495720',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'background 0.15s',
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = '#c9001a')}
                    onMouseOut={e => (e.currentTarget.style.background = '#ff4957')}
                    onClick={async () => {
                      if (window.confirm('Confirmer la suppression ?')) {
                        const res = await fetch('/api/admin/users', {
                          method: 'DELETE',
                          credentials: 'include',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: u.id }),
                        });
                        if (res.ok) {
                          window.location.reload();
                        } else {
                          const data = await res.json();
                          alert(data.error || 'Erreur lors de la suppression');
                        }
                      }
                    }}
                    disabled={u.email === user.email}
                    title={u.email === user.email ? 'Vous ne pouvez pas supprimer votre propre compte' : ''}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

import AddClientSPA from '../../components/AddClientSPA';
import EditClientSPA from '../../components/EditClientSPA';
import ProductsSection from './products';
import ContractsSection from './contracts';
import Configuration from './configuration';
import SouscripteursSection from './souscripteurs';

/**
 * Composant de gestion des clients.
 * Affiche la liste des clients, permet l'ajout, l'édition et la suppression.
 */
function ClientsSection() {
  // Liste complète des clients récupérée depuis l’API
  const [clients, setClients] = useState([]);
  // Indique si les données sont en cours de chargement
  const [loading, setLoading] = useState(true);
  // Mode d’affichage actuel : liste, ajout, édition
  const [mode, setMode] = useState('list'); // "list", "add", "edit"
  // Client sélectionné pour édition
  const [editClient, setEditClient] = useState(null);
  // Nombre de clients affichés par page
  const [clientsPerPage, setClientsPerPage] = useState(10);
  // Page courante de pagination
  const [page, setPage] = useState(1);
  // Texte de recherche pour filtrer les clients par nom
  const [searchName, setSearchName] = useState("");
  // Objet de tri : clé (ici "name") et direction ("asc" ou "desc")
  const [sort, setSort] = useState({ key: "name", dir: "asc" });

  /**
   * Rafraîchir la liste des clients.
   * Appelé lors du montage du composant ou lors d'une action utilisateur.
   */
  const fetchClients = () => {
    setLoading(true);
    fetch('/api/admin/clients', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setClients(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClients();
  }, []);

  if (mode === 'add') {
    return (
      <AddClientSPA
        onSuccess={() => {
          setMode('list');
          fetchClients();
        }}
        onCancel={() => setMode('list')}
      />
    );
  }

  if (mode === 'edit' && editClient) {
    return (
      <EditClientSPA
        client={editClient}
        onSuccess={() => {
          setMode('list');
          setEditClient(null);
          fetchClients();
        }}
        onCancel={() => {
          setMode('list');
          setEditClient(null);
        }}
      />
    );
  }

  return (
    <section style={{ marginTop: 40 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 26, color: '#00b3e6', margin: 0 }}>Clients</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Champ de recherche pour filtrer dynamiquement la liste des clients par nom */}
          <div style={{ background: '#e6f7fa', boxShadow: '0 2px 16px #00b3e610', borderRadius: 12, padding: '7px 18px', display: 'flex', alignItems: 'center', gap: 14, maxWidth: 320 }}>
            <label style={{ fontWeight: 700, color: '#0090b3', fontSize: 15, marginRight: 8 }}>🔎 Nom&nbsp;</label>
            <input
              type="text"
              placeholder="Recherche par nom..."
              value={searchName}
              onChange={e => { setSearchName(e.target.value); setPage(1); }} // Met à jour l’état searchName et réinitialise la page
              style={{ padding: 8, borderRadius: 8, border: '1.5px solid #00b3e6', fontSize: 16, fontFamily: 'Montserrat, sans-serif', minWidth: 120, background: '#fff' }}
            />
          </div>
          <label style={{ fontWeight: 700, color: '#00b3e6', fontFamily: 'Montserrat, sans-serif', fontSize: 15, display: 'flex', alignItems: 'center', gap: 5, background: '#fff', border: '1.5px solid #00b3e6', borderRadius: 10, boxShadow: '0 2px 8px #00b3e610', padding: '6px 20px', marginRight: 0 }}>
            <span role="img" aria-label="voir">👁️</span> Afficher&nbsp;
            <select
              value={clientsPerPage}
              onChange={e => { setClientsPerPage(Number(e.target.value)); setPage(1); }}
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
              background: '#00b3e6',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 16,
              padding: '11px 22px',
              fontFamily: 'Montserrat, sans-serif',
              boxShadow: '0 2px 8px #00b3e620',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              transition: 'background 0.15s',
            }}
            onMouseOver={e => (e.currentTarget.style.background = '#0090b3')}
            onMouseOut={e => (e.currentTarget.style.background = '#00b3e6')}
            onClick={() => setMode('add')}
          >
            <span role="img" aria-label="ajouter">➕</span> Ajouter un client
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
          overflow: 'hidden',
          marginTop: 16,
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            minWidth: 480,
            fontFamily: 'Montserrat, sans-serif',
          }}>
            <thead>
              <tr style={{ background: '#00b3e6' }}>
                {/* En-tête de colonne Nom cliquable pour trier les clients par nom (▲▼) */}
                <th
                  style={{ padding: 14, color: '#fff', fontWeight: 700, fontSize: 18, borderTopLeftRadius: 18, cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => setSort(s => ({ key: 'name', dir: s.dir === 'asc' ? 'desc' : 'asc' }))}
                  title="Cliquer pour trier par nom"
                >
                  Nom {sort.key === 'name' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th style={{ padding: 14, color: '#fff', fontWeight: 700, fontSize: 18 }}>Contrats</th>
                <th style={{ padding: 14, color: '#fff', fontWeight: 700, fontSize: 18, borderTopRightRadius: 18 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/*
                On filtre d’abord la liste des clients selon le champ de recherche (insensible à la casse),
                puis on trie selon la clé et la direction (ici "name" asc/desc),
                puis on applique la pagination (slice).
              */}
              {(Array.isArray(clients) ? clients : [])
                .filter(client => client.name && client.name.toLowerCase().includes(searchName.toLowerCase()))
                .sort((a, b) => { // Tri dynamique par nom
                  if (sort.key === 'name') {
                    if (a.name.toLowerCase() < b.name.toLowerCase()) return sort.dir === 'asc' ? -1 : 1;
                    if (a.name.toLowerCase() > b.name.toLowerCase()) return sort.dir === 'asc' ? 1 : -1;
                    return 0;
                  }
                  return 0;
                })
                .slice((page-1)*clientsPerPage, page*clientsPerPage) // Pagination
                .map((client, idx) => (
                <tr key={client.id} style={{ background: idx % 2 === 0 ? '#f6fcff' : '#e6f7fa' }}>
                  <td style={{ padding: 12, border: 'none', fontSize: 17, borderBottom: '1px solid #e0e0e0', borderTopLeftRadius: idx === 0 ? 18 : 0 }}>{client.name}</td>
                  <td style={{ padding: 12, border: 'none', fontSize: 17, borderBottom: '1px solid #e0e0e0' }}>{client.contracts.length}</td>
                  <td style={{ padding: 12, border: 'none', fontSize: 17, borderBottom: '1px solid #e0e0e0', borderTopRightRadius: idx === 0 ? 18 : 0 }}>
                    <button
                      style={{
                        background: '#00b3e6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 20px',
                        fontWeight: 600,
                        fontSize: 15,
                        fontFamily: 'Montserrat, sans-serif',
                        boxShadow: '0 2px 8px #00b3e620',
                        marginRight: 8,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'background 0.15s',
                      }}
                      onMouseOver={e => (e.currentTarget.style.background = '#0090b3')}
                      onMouseOut={e => (e.currentTarget.style.background = '#00b3e6')}
                      onClick={() => {
                        setEditClient(client);
                        setMode('edit');
                      }}
                    >
                      <span role="img" aria-label="crayon">✏️</span> Modifier
                    </button>
                    <button
                      style={{
                        background: '#ff4957',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '8px 20px',
                        fontWeight: 600,
                        fontSize: 15,
                        fontFamily: 'Montserrat, sans-serif',
                        boxShadow: '0 2px 8px #ff495720',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'background 0.15s',
                      }}
                      onMouseOver={e => (e.currentTarget.style.background = '#c9001a')}
                      onMouseOut={e => (e.currentTarget.style.background = '#ff4957')}
                      onClick={async () => {
                        if (!window.confirm(`Confirmer la suppression du client ${client.name} ?`)) return;
                        const res = await fetch('/api/admin/clients', {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: client.id }),
                          credentials: 'include',
                        });
                        if (res.ok) {
                          setClients(clients.filter(c => c.id !== client.id));
                        } else {
                          const data = await res.json();
                          alert(data.error || 'Erreur lors de la suppression');
                        }
                      }}
                    >
                      <span role="img" aria-label="poubelle">🗑️</span> Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clients.length > clientsPerPage && (
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
                Page {page} / {Math.ceil(clients.length / clientsPerPage)}
              </span>
              <button
                onClick={() => setPage(p => Math.min(Math.ceil(clients.length / clientsPerPage), p + 1))}
                disabled={page === Math.ceil(clients.length / clientsPerPage)}
                style={{
                  padding: '7px 18px',
                  background: '#f6fcff',
                  color: '#00b3e6',
                  border: '1.5px solid #cce8f6',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: page === Math.ceil(clients.length / clientsPerPage) ? 'not-allowed' : 'pointer',
                  fontFamily: 'Montserrat, sans-serif',
                  opacity: page === Math.ceil(clients.length / clientsPerPage) ? 0.5 : 1,
                  transition: 'background 0.12s',
                }}
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

import AdminLayout from '../../components/Layout/AdminLayout';

export default function AdminDashboard({ user, users: usersListProp, initialSection }) {
  const router = useRouter();
  // La section est maintenant déterminée par l'URL, gérée par le Link dans AdminLayout
  // et initialisée par initialSection via getServerSideProps.
  // Si vous avez besoin de changer de section programmatiquement SANS recharger la page via Link,
  // vous pourriez utiliser router.push(`/admin?section=nouvelleSection`, undefined, { shallow: true });
  // et un useEffect pour écouter router.query.section.
  // Pour l'instant, on se base sur initialSection pour le rendu initial.
  const currentSection = router.query.section || initialSection; 

  // La prop 'user' est l'objet utilisateur complet { name, email, role }
  // La prop 'usersListProp' est la liste des utilisateurs pour la section 'users'
  // La prop 'initialSection' est la section à afficher initialement

  // Le composant AdminLayout gère maintenant la sidebar, le header et la navigation de section.
  return (
    <AdminLayout user={user} currentSection={currentSection}>
      {/* Le contenu spécifique à la section est rendu ici */}
      {currentSection === 'users' && <UsersSection users={usersListProp} user={user} />}
      {currentSection === 'clients' && <ClientsSection user={user} />}
      {currentSection === 'souscripteurs' && <SouscripteursSection user={user} />}
      {currentSection === 'products' && <ProductsSection user={user} />}
      {currentSection === 'contracts' && <ContractsSection user={user} />}
      {currentSection === 'configuration' && <Configuration user={user} />}
      {/* Ajoutez un fallback ou un message si la section n'est pas reconnue */}
      {!['users', 'clients', 'souscripteurs', 'products', 'contracts', 'configuration'].includes(currentSection) && (
        <p>Section non trouvée. Veuillez sélectionner une section dans le menu.</p>
      )}
    </AdminLayout>
  );
}
