import { getSession } from 'next-auth/react';
import { PrismaClient } from '@prisma/client';
import { useRouter } from 'next/router';
import { useState } from 'react';
import AddContractSPA from '../../../../components/AddContractSPA';

export default function ModifierContratPage({ contract, clients, products, userEmail }) {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0); // force rerender after success

  if (!contract) {
    return <p style={{ textAlign: 'center', marginTop: 60 }}>Contrat introuvable.</p>;
  }

  const handleSuccess = () => {
    // Après mise à jour, retour à la liste des contrats de l'admin
    router.replace('/admin?section=contracts');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <AddContractSPA
      key={refreshKey}
      initialContract={contract}
      clients={clients}
      products={products}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
      userEmail={userEmail}
    />
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session || !session.user || !['ADMIN', 'SUPERADMIN', 'COMMERCIAL'].includes(session.user.role)) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  const prisma = new PrismaClient();
  const contractId = parseInt(context.params.id, 10);
  if (isNaN(contractId)) {
    return { notFound: true };
  }

  try {
    const [contract, clients, products] = await prisma.$transaction([
      prisma.contract.findUnique({
        where: { id: contractId },
        include: {
          client: true,
          contractProducts: { include: { product: true } },
        },
      }),
      prisma.client.findMany({ orderBy: { name: 'asc' } }),
      prisma.product.findMany({ orderBy: { reference: 'asc' } }),
    ]);

    if (!contract) {
      return { notFound: true };
    }

    return {
      props: {
        contract: JSON.parse(JSON.stringify(contract)),
        clients: JSON.parse(JSON.stringify(clients)),
        products: JSON.parse(JSON.stringify(products)),
        userEmail: session.user.email,
      },
    };
  } catch (error) {
    console.error('Erreur getServerSideProps modifier contrat:', error);
    return { notFound: true };
  }
}
