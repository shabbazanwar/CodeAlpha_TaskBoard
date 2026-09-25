"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/modal";
import { ApiError, api, jsonBody } from "@/lib/client";

export function NewProjectButton({ variant = "primary" }: { variant?: "primary" | "ghost" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function close() {
    if (saving) return;
    setOpen(false);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const project = await api<{ id: string }>("/api/projects", {
        method: "POST",
        ...jsonBody({ name, description: description || null }),
      });
      setOpen(false);
      setName("");
      setDescription("");
      router.push(`/projects/${project.id}`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not create the project.");
    } finally {
      setSaving(false);
    }
  }

  const className = variant === "primary" ? "btn-primary" : "btn-secondary";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.6">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
        New project
      </button>

      <Modal open={open} onClose={close} title="New project">
        <form onSubmit={handleSubmit} className="p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-glow">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <rect x="3" y="4" width="5" height="16" rx="1.6" />
              <rect x="10" y="4" width="5" height="10" rx="1.6" fillOpacity="0.8" />
              <rect x="17" y="4" width="4" height="6" rx="1.6" fillOpacity="0.6" />
            </svg>
          </span>
          <h2 className="mt-4 text-xl font-semibold tracking-tight text-ink-900">New project</h2>
          <p className="mt-1 text-sm text-ink-500">
            It starts with three columns: To Do, In Progress and Done.
          </p>

          {error ? (
            <p role="alert" className="mt-4 alert-error">
              {error}
            </p>
          ) : null}

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="project-name" className="block text-sm font-medium text-ink-700">
                Name
              </label>
              <input
                id="project-name"
                required
                autoFocus
                maxLength={120}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="input mt-1.5"
              />
            </div>

            <div>
              <label
                htmlFor="project-description"
                className="block text-sm font-medium text-ink-700"
              >
                Description <span className="font-normal text-ink-400">(optional)</span>
              </label>
              <textarea
                id="project-description"
                rows={3}
                maxLength={2000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="input mt-1.5"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={close}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? "Creating…" : "Create project"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
