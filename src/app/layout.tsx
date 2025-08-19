import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Geist, Geist_Mono, Raleway } from 'next/font/google';
import Providers from '@/features/integrations/provider';

const classico = localFont({
  src: [
    {
      path: './fonts/classico.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/classico-bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-classico',
});

const brown = localFont({
  src: './fonts/brown-regular.ttf',
  variable: '--font-brown',
});

const raleway = Raleway({
  variable: '--font-raleway',
  subsets: ['latin'],
});

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Panesars Kenya Ltd',
    template: `%s / PKL`,
  },
  description: 'The integrated PKL system',
  icons: [
    {
      url: '/logos/favicon-black.svg',
      href: '/logos/favicon-black.svg',
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${classico.variable} ${brown.variable} ${raleway.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
