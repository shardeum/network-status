import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
import { Footer } from '@/components/Footer';
export const metadata: Metadata = {
  title: 'Shardeum Network Status Monitor',
  description: 'Monitor the uptime and latency of the Shardeum network',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Footer />
      </body>
    </html>
  );
}
