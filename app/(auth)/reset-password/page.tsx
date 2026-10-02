import { Suspense } from "react";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata = { title: "Reset password · TaskBoard" };

export default function ResetPasswordPage() {
  return (
    // The form reads ?token from the URL, so it needs a Suspense boundary.
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-ink-100" aria-hidden />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
