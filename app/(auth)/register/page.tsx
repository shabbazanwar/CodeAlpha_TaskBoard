import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Create an account · TaskBoard" };

export default function RegisterPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-ink-900">Create your account</h1>
      <p className="mt-2 text-sm text-ink-500">Start organising work with your team in minutes.</p>
      <RegisterForm />
      <p className="mt-8 text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
