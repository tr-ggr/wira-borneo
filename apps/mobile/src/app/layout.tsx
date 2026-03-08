import Providers from '../components/Providers';
import MobileEnforcer from '../components/MobileEnforcer';
import './global.css';

export const metadata = {
  title: 'WIRA — Regional Alertness',
  description: 'Woven Intelligence for Regional Alertness',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased overflow-x-hidden">
        <Providers>
          <MobileEnforcer>
            {children}
          </MobileEnforcer>
        </Providers>
      </body>
    </html>
  );
}
