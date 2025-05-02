import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const users = session.role === 'ADMIN' || session.role === 'SUPERADMIN'
    ? await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: 'asc' },
      })
    : [];
  return { props: { user: session.user, users } };
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
import ProductsSection from './products';
import ContractsSection from './contracts';
import Configuration from './configuration';

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
                .filter(c => c.name && c.name.toLowerCase().includes(searchName.toLowerCase())) // Filtrage dynamique par nom
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

export default function AdminDashboard({ user, users }) {
  const [section, setSection] = useState('users');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Montserrat, sans-serif' }}>
      <aside style={{ width: 240, background: '#00b3e6', color: '#fff', padding: '32px 0 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '2px 0 16px #00b3e610', borderTopRightRadius: 24, borderBottomRightRadius: 24, minHeight: '100vh', fontFamily: 'Montserrat, sans-serif' }}>
        <img src="/logo-infodom.png" alt="Infodom Logo" style={{ height: 54, marginBottom: 8 }} />
        <span style={{ fontWeight: 700, fontSize: 22, color: '#fff', letterSpacing: 1, marginBottom: 32 }}>Infodom</span>
        <nav style={{ width: '100%' }}>
          <ul style={{ listStyle: 'none', padding: 0, width: '100%' }}>
            <li>
              <button onClick={() => setSection('users')} style={{ background: section === 'users' ? '#0090b3' : 'none', color: '#fff', border: 'none', padding: '14px 32px', textAlign: 'left', width: '100%', cursor: 'pointer', fontWeight: 600, fontSize: 17, borderRadius: 12, margin: '4px 0', transition: 'background 0.15s' }}>
                <span role="img" aria-label="users" style={{ marginRight: 12 }}>👥</span> Utilisateurs
              </button>
            </li>
            <li>
              <button onClick={() => setSection('clients')} style={{ background: section === 'clients' ? '#0090b3' : 'none', color: '#fff', border: 'none', padding: '14px 32px', textAlign: 'left', width: '100%', cursor: 'pointer', fontWeight: 600, fontSize: 17, borderRadius: 12, margin: '4px 0', transition: 'background 0.15s' }}>
                <span role="img" aria-label="clients" style={{ marginRight: 12 }}>🏢</span> Clients
              </button>
            </li>
            <li>
              <button onClick={() => setSection('products')} style={{ background: section === 'products' ? '#0090b3' : 'none', color: '#fff', border: 'none', padding: '14px 32px', textAlign: 'left', width: '100%', cursor: 'pointer', fontWeight: 600, fontSize: 17, borderRadius: 12, margin: '4px 0', transition: 'background 0.15s' }}>
                <span role="img" aria-label="products" style={{ marginRight: 12 }}>📦</span> Produits
              </button>
            </li>
            <li>
              <button onClick={() => setSection('contracts')} style={{ background: section === 'contracts' ? '#0090b3' : 'none', color: '#fff', border: 'none', padding: '14px 32px', textAlign: 'left', width: '100%', cursor: 'pointer', fontWeight: 600, fontSize: 17, borderRadius: 12, margin: '4px 0', transition: 'background 0.15s' }}>
                <span role="img" aria-label="contracts" style={{ marginRight: 12 }}>📜</span> Contrats
              </button>
            </li>
            <li>
              <button onClick={() => setSection('configuration')} style={{ background: section === 'configuration' ? '#0090b3' : 'none', color: '#fff', border: 'none', padding: '14px 32px', textAlign: 'left', width: '100%', cursor: 'pointer', fontWeight: 600, fontSize: 17, borderRadius: 12, margin: '4px 0', transition: 'background 0.15s' }}>
                <span role="img" aria-label="config" style={{ marginRight: 12 }}>⚙️</span> Configuration
              </button>
            </li>
            <li>
              <a href="/admin/export-csv" style={{ display: 'block', color: '#fff', textDecoration: 'none', padding: '14px 32px', fontWeight: 600, fontSize: 17, borderRadius: 12, margin: '4px 0', background: 'none', textAlign: 'left', width: '100%', cursor: 'pointer', transition: 'background 0.15s' }}>
                <span role="img" aria-label="export" style={{ marginRight: 12 }}>⬇️</span> Export CSV
              </a>
            </li>
            <li>
              <a href="/admin/import-csv" style={{ display: 'block', color: '#fff', textDecoration: 'none', padding: '14px 32px', fontWeight: 600, fontSize: 17, borderRadius: 12, margin: '4px 0', background: 'none', textAlign: 'left', width: '100%', cursor: 'pointer', transition: 'background 0.15s' }}>
                <span role="img" aria-label="import" style={{ marginRight: 12 }}>⬆️</span> Import CSV
              </a>
            </li>
            <li>
              <button onClick={() => signOut({ callbackUrl: '/auth/signin' })} style={{ background: '#fff', color: '#00b3e6', border: '1.5px solid #cce8f6', padding: '14px 32px', textAlign: 'left', width: '100%', cursor: 'pointer', borderRadius: 12, marginTop: 32, fontWeight: 700, fontSize: 17, transition: 'background 0.15s' }}>
                <span role="img" aria-label="logout" style={{ marginRight: 12 }}>🚪</span> Déconnexion
              </button>
            </li>
          </ul>
        </nav>
        <div style={{ marginTop: 'auto', width: '100%', padding: '0 0 18px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', opacity: 0.95, marginBottom: 2, letterSpacing: 1 }}>ReminderAPP</div>
          <div style={{ fontSize: 13, color: '#fff', opacity: 0.7, marginBottom: 1 }}>&copy; Willy GROMAT</div>
          <div style={{ fontSize: 13, color: '#fff', opacity: 0.7 }}>v1.0</div>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 32, background: '#f6fcff', minHeight: '100vh', fontFamily: 'Montserrat, sans-serif' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: 18, boxShadow: '0 2px 12px #00b3e610', padding: '24px 40px 24px 40px', marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src="/logo-infodom.png" alt="Infodom Logo" style={{ height: 36 }} />
            <span style={{ fontWeight: 700, fontSize: 22, color: '#00b3e6', letterSpacing: 1 }}>Infodom</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, fontSize: 18, color: '#222' }}>Bienvenue, {user.name}</div>
            <div style={{ color: '#888', fontSize: 15 }}>{user.email}</div>
          </div>
        </header>
        {section === 'users' && <UsersSection users={users} user={user} />}
        {section === 'clients' && <ClientsSection user={user} />}
        {section === 'products' && <ProductsSection user={user} />}
        {section === 'contracts' && <ContractsSection user={user} />}
        {section === 'configuration' && <Configuration user={user} />}
      </main>
    </div>
  );
}
