import React from 'react';

const fakeData = {
  client: 'Société Alpha',
  produits: 'PROD-001 (2) | PROD-003 (1)',
  date: '2025-06-01',
  statut: 'EN_COURS',
};

function renderTemplate(str, vars) {
  return str
    .replace(/\{client\}/g, vars.client)
    .replace(/\{produits\}/g, vars.produits)
    .replace(/\{date\}/g, vars.date)
    .replace(/\{statut\}/g, vars.statut);
}

export default function EmailTemplatePreview({ subject, body }) {
  if (!subject && !body) return null;
  return (
    <div style={{ border: '1px solid #bbb', background: '#fafbfd', padding: 16, marginTop: 10, marginBottom: 16 }}>
      <div style={{ fontWeight: 'bold', marginBottom: 6 }}>Aperçu du mail&nbsp;:</div>
      <div style={{ marginBottom: 10 }}>
        <table style={{ fontSize: 13, borderCollapse: 'collapse', marginBottom: 8 }}>
          <thead>
            <tr style={{ background: '#f3f3f3' }}>
              <th style={{ border: '1px solid #ddd', padding: '2px 8px' }}>Variable</th>
              <th style={{ border: '1px solid #ddd', padding: '2px 8px' }}>Valeur fictive</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={{ border: '1px solid #ddd', padding: '2px 8px' }}>{'{client}'}</td><td style={{ border: '1px solid #ddd', padding: '2px 8px' }}>{fakeData.client}</td></tr>
            <tr><td style={{ border: '1px solid #ddd', padding: '2px 8px' }}>{'{produits}'}</td><td style={{ border: '1px solid #ddd', padding: '2px 8px' }}>{fakeData.produits}</td></tr>
            <tr><td style={{ border: '1px solid #ddd', padding: '2px 8px' }}>{'{date}'}</td><td style={{ border: '1px solid #ddd', padding: '2px 8px' }}>{fakeData.date}</td></tr>
            <tr><td style={{ border: '1px solid #ddd', padding: '2px 8px' }}>{'{statut}'}</td><td style={{ border: '1px solid #ddd', padding: '2px 8px' }}>{fakeData.statut}</td></tr>
          </tbody>
        </table>
      </div>
      <div><strong>Objet&nbsp;:</strong> {renderTemplate(subject, fakeData)}</div>
      <div style={{ marginTop: 8, whiteSpace: 'pre-line' }}>{renderTemplate(body, fakeData)}</div>
    </div>
  );
}
