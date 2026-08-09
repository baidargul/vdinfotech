"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  loginAction,
  signupAction,
  type AuthFormState,
} from "@/app/actions/auth";

const initialState: AuthFormState = {};

function SubmitButton({ mode }: { mode: "login" | "signup" }) {
  const { pending } = useFormStatus();

  return (
    <button className="auth-submit" type="submit" disabled={pending}>
      <span>
        {pending
          ? mode === "login" ? "Signing in..." : "Creating account..."
          : mode === "login" ? "Sign in" : "Create account"}
      </span>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </button>
  );
}

function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="auth-field-error" id={id}>{errors.join(" ")}</p>;
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isLogin = mode === "login";
  const action = isLogin ? loginAction : signupAction;
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form className="auth-form" action={formAction} noValidate>
      {!isLogin && (
        <label>
          <span>Full name</span>
          <input
            name="name"
            type="text"
            autoComplete="name"
            defaultValue={state.values?.name}
            aria-invalid={Boolean(state.errors?.name)}
            aria-describedby={state.errors?.name ? "name-error" : undefined}
            placeholder="Your name"
            required
          />
          <FieldError id="name-error" errors={state.errors?.name} />
        </label>
      )}

      <label>
        <span>Email address</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email}
          aria-invalid={Boolean(state.errors?.email)}
          aria-describedby={state.errors?.email ? "email-error" : undefined}
          placeholder="you@company.com"
          required
        />
        <FieldError id="email-error" errors={state.errors?.email} />
      </label>

      <label>
        <span>Password</span>
        <input
          name="password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          aria-invalid={Boolean(state.errors?.password)}
          aria-describedby={state.errors?.password ? "password-error" : undefined}
          placeholder={isLogin ? "Enter your password" : "At least 8 characters"}
          required
        />
        <FieldError id="password-error" errors={state.errors?.password} />
      </label>

      {state.message && (
        <p className="auth-form-error" role="alert">{state.message}</p>
      )}

      <SubmitButton mode={mode} />

      <p className="auth-switch">
        {isLogin ? "New to VD Infotech?" : "Already have an account?"}{" "}
        <Link href={isLogin ? "/signup" : "/login"}>
          {isLogin ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
