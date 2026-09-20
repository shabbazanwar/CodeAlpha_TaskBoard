import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Create an account · TaskBoard" };

export default function RegisterPage() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">Create an account</h1>
      <p className="mt-1 text-sm text-slate-500">Start organising work with your team.</p>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
