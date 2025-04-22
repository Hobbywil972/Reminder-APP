import { getToken } from 'next-auth/jwt';

export async function getServerSideProps(context) {
  const token = await getToken({ req: context.req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'COMMERCIAL') {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }
  return { props: { user: { name: token.name, email: token.email, role: token.role } } };
}

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CommercialDashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/commercial/dashboard');
  }, [router]);
  return null;
}
