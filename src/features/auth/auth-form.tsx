'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { api, ApiError } from '@/lib/api/client';
import type { UserView } from '@/lib/api/types';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

type Credentials = z.infer<typeof credentialsSchema>;

interface AuthFormProps {
  mode: 'login' | 'register';
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Credentials>({ resolver: zodResolver(credentialsSchema) });

  async function onSubmit(values: Credentials): Promise<void> {
    setSubmitError(null);
    try {
      await api.post<UserView>(`/auth/${mode}`, values);
      router.push('/');
      router.refresh();
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : 'Unexpected error',
      );
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      className="mx-auto flex max-w-sm flex-col gap-4"
    >
      <h1 className="text-xl font-semibold">
        {mode === 'login' ? 'Log in' : 'Register'}
      </h1>
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          type="email"
          autoComplete="email"
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
          {...register('email')}
        />
        {errors.email ? (
          <span className="text-red-600">{errors.email.message}</span>
        ) : null}
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Password
        <input
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          className="rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
          {...register('password')}
        />
        {errors.password ? (
          <span className="text-red-600">{errors.password.message}</span>
        ) : null}
      </label>
      {submitError ? (
        <p className="text-sm text-red-600">{submitError}</p>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-foreground px-4 py-2 text-background disabled:opacity-60"
      >
        {mode === 'login' ? 'Log in' : 'Create account'}
      </button>
    </form>
  );
}
