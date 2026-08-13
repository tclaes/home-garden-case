import Link from 'next/link';
import './global.css';
import { getCurrentUser } from '@itp-home-garden/web-data-access-users/session';

export const metadata = {
  title: 'Home Garden',
  description: 'Manage your gardens and plants',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.emailAddress
    : null;

  return (
    <html lang="en">
      <body>
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/gardens" className="text-lg font-semibold text-green-800">
              🌱 Home Garden
            </Link>
            {displayName ? (
              <span className="text-sm font-medium text-gray-900">{displayName}</span>
            ) : (
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Login
              </Link>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
