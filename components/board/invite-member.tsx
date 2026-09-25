"use client";

import { useState, type FormEvent } from "react";
import { ApiError, api, jsonBody } from "@/lib/client";
import type { MemberData } from "@/lib/types";

/** Rendered only for owners and admins — the API enforces the same rule. */
export function InviteMember({
  projectId,
  onInvited,
}: {
  projectId: string;
  onInvited: (member: MemberData) => void;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const member = await api<MemberData>(`/api/projects/${projectId}/members`, {
        method: "POST",
        ...jsonBody({ email, role }),
      });
      onInvited(member);
      setMessage(`${member.user.name} was added to the project.`);
      setEmail("");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not add that person.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        Invite member
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-lg border border-slate-200 bg-white p-3 sm:w-auto"
    >
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex-1">
          <span className="block text-xs font-medium text-slate-600">Email address</span>
          <input
            type="email"
            required
            autoFocus
            value={email}
            placeholder="teammate@example.com"
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500 sm:w-64"
          />
        </label>

        <label>
          <span className="block text-xs font-medium text-slate-600">Role</span>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as "MEMBER" | "ADMIN")}
            className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
          >
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? "Adding…" : "Add"}
        </button>

        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
            setMessage(null);
          }}
          className="rounded-md px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Done
        </button>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        The person needs a TaskBoard account already.
      </p>

      {error ? (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      ) : null}
      {message ? <p className="mt-2 text-xs text-emerald-700">{message}</p> : null}
    </form>
  );
}
