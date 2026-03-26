import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Management | School ERP',
  description: 'Manage student fee refunds, transport refunds, and fine refunds with automated approval workflows',
  keywords: ['refunds', 'fee management', 'student refunds', 'school ERP'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
