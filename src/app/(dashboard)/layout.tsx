import AppLayout from '@/components/AppLayout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout 
      currentPage="subscription" 
      title="Subscription Management"
    >
      {children}
    </AppLayout>
  );
}
