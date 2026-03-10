import './global.css';
import { Space_Grotesk } from 'next/font/google';
import { Providers } from './providers';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata = {
  title: 'ASEAN Relief - Impact Dashboard',
  description:
    'Transparent humanitarian aid delivery secured by ASEAN blockchain validation nodes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-display">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
