'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { type ActionResult, registerAction } from '@itp-home-garden/web-data-access-auth';
import { Button, Card, CardContent, FieldError, Input, Label } from '@itp-home-garden/web-ui';

type FormState = ActionResult<null> | null;

function parseFormData(formData: FormData) {
  const age = formData.get('age');
  return {
    firstName: (formData.get('firstName') as string) || null,
    lastName: (formData.get('lastName') as string) || null,
    age: age ? Number(age) : null,
    emailAddress: String(formData.get('emailAddress') ?? ''),
    password: String(formData.get('password') ?? ''),
  };
}

export function RegisterForm() {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prevState, formData) => {
      const result = await registerAction(parseFormData(formData));
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
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" name="firstName" autoFocus />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="emailAddress">Email</Label>
            <Input id="emailAddress" name="emailAddress" type="email" required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" minLength={8} required />
          </div>

          {state && !state.ok && <FieldError>{state.error}</FieldError>}

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating account…' : 'Create account'}
          </Button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-green-800 hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
