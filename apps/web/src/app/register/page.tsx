import { RegisterForm } from '@itp-home-garden/web-feature-auth';

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-center text-2xl font-semibold text-gray-900">Create an account</h1>
      <RegisterForm />
    </div>
  );
}
