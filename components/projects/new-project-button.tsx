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

  const className =
    variant === "primary"
      ? "rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      : "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        New project
      </button>

      <Modal open={open} onClose={close} title="New project">
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-lg font-semibold text-slate-900">New project</h2>
          <p className="mt-1 text-sm text-slate-500">
            It starts with three columns: To Do, In Progress and Done.
          </p>

          {error ? (
            <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="project-name" className="block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                id="project-name"
                required
                autoFocus
                maxLength={120}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="project-description"
                className="block text-sm font-medium text-slate-700"
              >
                Description <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                id="project-description"
                rows={3}
                maxLength={2000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={close}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Creating…" : "Create project"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
