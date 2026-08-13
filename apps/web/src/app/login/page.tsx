import Link from 'next/link';
import { LoginForm } from '@itp-home-garden/web-feature-users';

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-gray-900">Log in</h1>
      <div className="max-w-md">
        <LoginForm />
        <p className="mt-4 text-sm text-gray-600">
          No account yet?{' '}
          <Link href="/register" className="font-medium text-gray-900 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
