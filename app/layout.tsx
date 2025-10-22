import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Alpha Insights - AI Analytics Assistant',
  description: 'Advanced sales data analysis powered by AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
