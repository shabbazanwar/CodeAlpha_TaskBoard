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
        className="btn-secondary"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Invite member
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card w-full animate-pop-in p-4 sm:w-auto"
    >
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-full flex-1 sm:min-w-0">
          <span className="label">Email address</span>
          <input
            type="email"
            required
            autoFocus
            value={email}
            placeholder="teammate@example.com"
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 input input-sm sm:w-64"
          />
        </label>

        <label>
          <span className="label">Role</span>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as "MEMBER" | "ADMIN")}
            className="input input-sm mt-1.5 w-auto"
          >
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary btn-sm"
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
          className="btn-ghost btn-sm"
        >
          Done
        </button>
      </div>

      <p className="mt-3 text-xs text-ink-400">
        The person needs a TaskBoard account already.
      </p>

      {error ? (
        <p role="alert" className="mt-2 text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : null}
      {message ? <p className="mt-2 text-xs font-medium text-emerald-600">{message}</p> : null}
    </form>
  );
}
