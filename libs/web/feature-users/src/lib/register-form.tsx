'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@itp-home-garden/shared-api-contracts';
import { type ActionResult, registerUserAction } from '@itp-home-garden/web-data-access-users';
import { Button, FieldError, Input, Label } from '@itp-home-garden/web-ui';

type FormState = ActionResult<User> | null;

function parseFormData(formData: FormData) {
  const age = formData.get('age');
  return {
    firstName: (formData.get('firstName') as string) || null,
    lastName: (formData.get('lastName') as string) || null,
    age: age ? Number(age) : null,
    emailAddress: String(formData.get('emailAddress') ?? ''),
  };
}

export function RegisterForm() {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prevState, formData) => {
      const input = parseFormData(formData);
      const result = await registerUserAction(input);

      if (result.ok) {
        router.push('/register/success');
      }
      return result;
    },
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="firstName">First name</Label>
        <Input id="firstName" name="firstName" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="lastName">Last name</Label>
        <Input id="lastName" name="lastName" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="age">Age</Label>
        <Input id="age" name="age" type="number" min={1} step="1" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="emailAddress">Email address</Label>
        <Input id="emailAddress" name="emailAddress" type="email" required />
      </div>

      {state && !state.ok && <FieldError>{state.error}</FieldError>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Registering…' : 'Register'}
      </Button>
    </form>
  );
}
