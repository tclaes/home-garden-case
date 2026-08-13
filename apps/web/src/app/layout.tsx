import Link from 'next/link';
import { getCurrentUser, logoutAction } from '@itp-home-garden/web-data-access-auth';
import './global.css';

export const metadata = {
  title: 'Home Garden',
  description: 'Manage your gardens and plants',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body>
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/gardens" className="text-lg font-semibold text-green-800">
              🌱 Home Garden
            </Link>
            {user && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>Hi {user.firstName ?? user.emailAddress}</span>
                <form action={logoutAction}>
                  <button type="submit" className="font-medium text-green-800 hover:underline">
                    Logout
                  </button>
                </form>
              </div>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
