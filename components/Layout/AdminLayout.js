import { signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link'; // Importer Link pour la navigation côté client

export default function AdminLayout({ user, children, currentSection }) {
  const router = useRouter();

  const navLinkBaseStyle = {
    display: 'block',
    textDecoration: 'none',
    padding: '14px 32px',
    fontWeight: 600,
    fontSize: 17,
    borderRadius: 12,
    margin: '4px 0',
    textAlign: 'left',
    width: '100%',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
    border: 'none', // Assurer que les boutons ressemblent à des liens
    fontFamily: 'inherit' // Hériter la police
  };

  const navLinkStyle = (isActive) => ({
    ...navLinkBaseStyle,
    color: isActive ? '#00b3e6' : '#fff',
    background: isActive ? '#fff' : 'transparent',
  });

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin', redirect: true }).then(() => {
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const cookieNames = [
          'next-auth.session-token',
          '__Secure-next-auth.session-token',
          'next-auth.csrf-token',
          '__Secure-next-auth.csrf-token',
          'next-auth.callback-url'
        ];
        cookieNames.forEach(name => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
        });
      }
      // Il est préférable de laisser NextAuth gérer la redirection via callbackUrl
      // plutot que window.location.reload()
    });
  };

  // Assurer que user est un objet avant d'accéder à ses propriétés
  const safeUser = user || {}; 
  const userName = safeUser.name || 'Utilisateur';
  const userEmail = safeUser.email || '';
  const userRole = safeUser.role || '';

  const sidebarLinks = [
    { section: 'users', path: '/admin?section=users', label: 'Utilisateurs', icon: '👥', roles: ['ADMIN', 'SUPERADMIN'] },
    { section: 'clients', path: '/admin?section=clients', label: 'Clients', icon: '🏢', roles: ['ADMIN', 'SUPERADMIN', 'COMMERCIAL'] },
    { section: 'souscripteurs', path: '/admin?section=souscripteurs', label: 'Souscripteurs', icon: '👤', roles: ['ADMIN', 'SUPERADMIN'] },
    { section: 'products', path: '/admin?section=products', label: 'Produits', icon: '📦', roles: ['ADMIN', 'SUPERADMIN', 'COMMERCIAL'] },
    { section: 'contracts', path: '/admin?section=contracts', label: 'Contrats', icon: '📄', roles: ['ADMIN', 'SUPERADMIN', 'COMMERCIAL'] },
    { path: '/admin/export-csv', label: 'Export CSV', icon: '📤', roles: ['ADMIN'], isPage: true }, // Indiquer que c'est une page dédiée
    { path: '/admin/import-csv', label: 'Import CSV', icon: '📥', roles: ['ADMIN'], isPage: true }, // Indiquer que c'est une page dédiée
    { section: 'configuration', path: '/admin?section=configuration', label: 'Configuration', icon: '⚙️', roles: ['ADMIN', 'SUPERADMIN'] },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Montserrat, sans-serif' }}>
      <aside style={{ width: 280, background: '#00b3e6', color: '#fff', padding: '32px 0 0 0', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 12px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '0 32px 28px 32px', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#fff' }}>ReminderAPP</h1>
          <p style={{ margin: '4px 0 0', fontSize: 15, opacity: 0.8 }}>Panneau d'administration</p>
        </div>
        <nav style={{ flexGrow: 1, padding: '24px 16px' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {sidebarLinks.map(link => (
              link.roles.includes(userRole) && (
                <li key={link.path}>
                  <Link href={link.path} passHref legacyBehavior>
                    <a style={navLinkStyle(link.isPage ? router.pathname === link.path : currentSection === link.section)}>
                      <span role="img" aria-label={link.label.toLowerCase()} style={{ marginRight: 12 }}>{link.icon}</span> {link.label}
                    </a>
                  </Link>
                </li>
              )
            ))}
          </ul>
        </nav>
        <div style={{ padding: '0 16px 16px 16px' }}>
            <button
                onClick={handleSignOut}
                style={{ ...navLinkBaseStyle, background: '#fff', color: '#00b3e6', border: '1.5px solid #cce8f6'}}
            >
                <span role="img" aria-label="logout" style={{ marginRight: 12 }}>🚪</span> Déconnexion
            </button>
        </div>
        <div style={{ marginTop: 'auto', width: '100%', padding: '10px 0 18px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', opacity: 0.95, marginBottom: 2, letterSpacing: 1, marginTop:10 }}>ReminderAPP</div>
          <div style={{ fontSize: 13, color: '#fff', opacity: 0.7, marginBottom: 1 }}>&copy; Willy GROMAT</div>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 32, background: '#f6fcff', minHeight: '100vh', fontFamily: 'Montserrat, sans-serif' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: 18, boxShadow: '0 2px 12px #00b3e610', padding: '24px 40px 24px 40px', marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src="/logo-infodom.png" alt="Infodom Logo" style={{ height: 36 }} />
            <span style={{ fontWeight: 700, fontSize: 22, color: '#00b3e6', letterSpacing: 1 }}>Infodom</span>
          </div>
          {user && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, fontSize: 18, color: '#222' }}>Bienvenue, {userName}</div>
              <div style={{ color: '#888', fontSize: 15 }}>{userEmail}</div>
            </div>
          )}
        </header>
        {children}
      </main>
    </div>
  );
}
