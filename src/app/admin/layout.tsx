import { isAdminAuthenticated } from '@/lib/admin-auth';
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import AdminShell from '@/components/admin/AdminShell';

export const metadata = {
  title: 'Admin | Tournament of Jazz',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return <AdminLoginForm />;
  }

  return <AdminShell>{children}</AdminShell>;
}
