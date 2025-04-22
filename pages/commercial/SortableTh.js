import React, { useMemo } from 'react';

export function SortableTh({ label, sortKey, sort = {}, setSort = () => {} }) {
  const isActive = sort?.key === sortKey;
  return (
    <th
      style={{ cursor: 'pointer', padding: 14, color: '#fff', fontWeight: 700, fontSize: 18, userSelect: 'none' }}
      onClick={() => setSort({ key: sortKey, dir: isActive && sort?.dir === 'asc' ? 'desc' : 'asc' })}
    >
      {label} {isActive ? (sort?.dir === 'asc' ? '▲' : '▼') : ''}
    </th>
  );
}

export function useSortableData(data, sort) {
  if (typeof useMemo !== 'function') throw new Error('useSortableData doit être appelé dans un composant React ou un hook personnalisé.');
  return useMemo(() => {
    const sorted = [...data];
    sorted.sort((a, b) => {
      let aVal, bVal;
      switch (sort.key) {
        case 'client':
          aVal = a.client?.name || '';
          bVal = b.client?.name || '';
          break;
        case 'produits':
          aVal = a.contractProducts?.map(cp => cp.product.reference).join(', ') || '';
          bVal = b.contractProducts?.map(cp => cp.product.reference).join(', ') || '';
          break;
        case 'debut':
          aVal = a.startDate || '';
          bVal = b.startDate || '';
          break;
        case 'fin':
          aVal = a.endDate || '';
          bVal = b.endDate || '';
          break;
        case 'email':
          aVal = a.email || '';
          bVal = b.email || '';
          break;
        case 'statut':
          aVal = a.status || '';
          bVal = b.status || '';
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
