'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { type ActionResult, loginAction } from '@itp-home-garden/web-data-access-auth';
import { Button, Card, CardContent, FieldError, Input, Label } from '@itp-home-garden/web-ui';

type FormState = ActionResult<null> | null;

function parseFormData(formData: FormData) {
  return {
    emailAddress: String(formData.get('emailAddress') ?? ''),
    password: String(formData.get('password') ?? ''),
  };
}

export function LoginForm() {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prevState, formData) => {
      const result = await loginAction(parseFormData(formData));
      if (result.ok) {
        router.push('/gardens');
      }
      return result;
    },
    null,
  );

  return (
    <Card className="mx-auto max-w-sm">
      <CardContent className="pt-4">
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="emailAddress">Email</Label>
            <Input id="emailAddress" name="emailAddress" type="email" required autoFocus />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>

          {state && !state.ok && <FieldError>{state.error}</FieldError>}

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Logging in…' : 'Log in'}
          </Button>

          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-green-800 hover:underline">
              Register
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
