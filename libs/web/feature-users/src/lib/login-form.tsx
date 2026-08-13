'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@itp-home-garden/shared-api-contracts';
import { type ActionResult, loginUserAction } from '@itp-home-garden/web-data-access-users';
import { Button, FieldError, Input, Label } from '@itp-home-garden/web-ui';

type FormState = ActionResult<User> | null;

export function LoginForm() {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prevState, formData) => {
      const result = await loginUserAction({
        emailAddress: String(formData.get('emailAddress') ?? ''),
      });

      if (result.ok) {
        router.push('/gardens');
      }
      return result;
    },
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="emailAddress">Email address</Label>
        <Input id="emailAddress" name="emailAddress" type="email" required />
      </div>

      {state && !state.ok && <FieldError>{state.error}</FieldError>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Logging in…' : 'Log in'}
      </Button>
    </form>
  );
}
