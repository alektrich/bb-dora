import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/lib/providers/QueryProvider';
import NavBar from '@/components/NavBar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Bitbucket DORA Metrics',
  description: 'DORA metrics dashboard for Bitbucket repositories',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <QueryProvider>
          <div className='min-h-full'>
            <NavBar />
            <main>
              <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>{children}</div>
            </main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
