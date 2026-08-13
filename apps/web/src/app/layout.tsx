import Link from 'next/link';
import './global.css';

export const metadata = {
  title: 'Home Garden',
  description: 'Manage your gardens and plants',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/gardens" className="text-lg font-semibold text-green-800">
              🌱 Home Garden
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Register
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
