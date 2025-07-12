import React, { useMemo } from 'react';

export function SortableTh({ label, sortKey, sort = {}, setSort = () => {}, style: customStyle = {} }) {
  const isActive = sort?.key === sortKey;
  const baseStyle = {
    padding: '14px 18px',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '18px',
    userSelect: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  };

  return (
    <th
      style={{ ...baseStyle, ...customStyle }}
      onClick={() => setSort({ key: sortKey, dir: isActive && sort?.dir === 'asc' ? 'desc' : 'asc' })}
    >
      {label}{isActive ? (sort?.dir === 'asc' ? ' ▲' : ' ▼') : ''}
    </th>
  );
}

export function useSortableData(data, sort) {
  if (typeof useMemo !== 'function') throw new Error('useSortableData doit être appelé dans un composant React ou un hook personnalisé.');
    return useMemo(() => {
    if (!sort || !sort.key) {
      return data; // Retourne les données non triées si pas de config de tri
    }
        const sorted = [...data];
    sorted.sort((a, b) => {
      let aVal, bVal;

      const getEndDate = (contract) => {
        let fin = contract.endDate;
        if (!fin && contract.startDate && contract.duration) {
          const d = new Date(contract.startDate);
          d.setMonth(d.getMonth() + Number(contract.duration));
          if (d.getDate() !== new Date(contract.startDate).getDate()) d.setDate(0);
          fin = d.toISOString();
        }
        return fin || '';
      };

      switch (sort.key) {
        case 'client':
          aVal = a.client?.name || '';
          bVal = b.client?.name || '';
          break;
        case 'user':
          aVal = a.user?.name || '';
          bVal = b.user?.name || '';
          break;
        case 'produit':
          aVal = (a.contractProducts || []).map(cp => cp.product?.reference).join(', ');
          bVal = (b.contractProducts || []).map(cp => cp.product?.reference).join(', ');
          break;
        case 'startDate':
          aVal = a.startDate || '';
          bVal = b.startDate || '';
          break;
        case 'endDate':
          aVal = getEndDate(a);
          bVal = getEndDate(b);
          break;
        case 'email':
          aVal = a.email || '';
          bVal = b.email || '';
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        case 'commentaire':
          aVal = a.commentaire || '';
          bVal = b.commentaire || '';
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sort.dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [data, sort]);
}
