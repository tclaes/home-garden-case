import Link from 'next/link';
import { buttonVariants } from '@itp-home-garden/web-ui';

export default function RegisterSuccessPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">Account created</h1>
      <p className="text-gray-500">Your account has been registered successfully.</p>
      <Link href="/gardens" className={buttonVariants({ variant: 'primary' })}>
        Go to gardens
      </Link>
    </div>
  );
}
