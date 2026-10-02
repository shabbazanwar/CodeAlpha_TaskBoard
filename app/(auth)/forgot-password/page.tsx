import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata = { title: "Forgot password · TaskBoard" };

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-ink-900">Forgot your password?</h1>
      <p className="mt-2 text-sm text-ink-500">
        Enter the email you signed up with and we&apos;ll send you a link to choose a new one.
      </p>
      <ForgotPasswordForm />
      <p className="mt-8 text-center text-sm text-ink-500">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
