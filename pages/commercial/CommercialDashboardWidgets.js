import { useEffect, useState } from 'react';

import { useRouter } from 'next/router';

export default function CommercialDashboardWidgets({ setSection }) {
  const [stats, setStats] = useState({ clients: 0, contracts: 0, expiring: 0, loading: true });

  useEffect(() => {
    async function fetchStats() {
      setStats(s => ({ ...s, loading: true }));
      const [clientsRes, contractsRes] = await Promise.all([
        fetch('/api/admin/clients', { credentials: 'include' }),
        fetch('/api/admin/contracts', { credentials: 'include' })
      ]);
      const clients = await clientsRes.json();
      const contracts = await contractsRes.json();
      // Contrats à échéance dans les 30 prochains jours
      const now = new Date();
      const in30d = new Date();
      in30d.setDate(now.getDate() + 30);
      const expiring = contracts.filter(c => {
        let end = c.endDate;
        if (!end && c.startDate && c.duration) {
          const d = new Date(c.startDate);
          d.setMonth(d.getMonth() + Number(c.duration));
          if (d.getDate() !== new Date(c.startDate).getDate()) d.setDate(0);
          end = d.toISOString();
        }
        return end && new Date(end) >= now && new Date(end) <= in30d;
      }).length;
      setStats({
        clients: Array.isArray(clients) ? clients.length : 0,
        contracts: Array.isArray(contracts) ? contracts.length : 0,
        expiring,
        loading: false
      });
    }
    fetchStats();
  }, []);

  if (stats.loading) return <p>Chargement du tableau de bord...</p>;

  return (
    <section style={{ marginTop: 40 }}>
      <h2 style={{ marginBottom: 32 }}>Tableau de bord</h2>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <WidgetCard label="Clients" value={stats.clients} color="#51cf66" icon="👥" onClick={() => setSection('clients')} />
        <WidgetCard label="Contrats" value={stats.contracts} color="#339af0" icon="📄" onClick={() => setSection('contracts')} />
        <WidgetCard label="Contrats à échéance < 30j" value={stats.expiring} color="#fab005" icon="⏰" />
      </div>
    </section>
  );
}

function WidgetCard({ label, value, color, icon, onClick }) {
  return (
    <div
      style={{
        minWidth: 220,
        background: '#fff',
        borderRadius: 18,
        boxShadow: '0 6px 18px #00b3e620',
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: `2px solid ${color}`,
        transition: 'transform 0.15s, box-shadow 0.15s',
        cursor: 'pointer',
        marginBottom: 16,
      }}
      onClick={onClick}
      onMouseOver={e => {
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)';
        e.currentTarget.style.boxShadow = '0 12px 32px #00b3e648';
      }}
      onMouseOut={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '0 6px 18px #00b3e620';
      }}
    >
      <span
        style={{
          background: color,
          color: '#fff',
          borderRadius: '50%',
          width: 60,
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 34,
          marginBottom: 18,
          boxShadow: '0 2px 8px #0001',
        }}
      >
        {icon}
      </span>
      <span style={{ fontSize: 42, fontWeight: 800, color: color, marginBottom: 8 }}>{value}</span>
      <span style={{ color: '#00b3e6', fontWeight: 600, fontSize: 18 }}>{label}</span>
    </div>
  );
}
