import type { UserSummary } from "@/lib/types";

/** Deterministic colour per person, so the same face keeps the same tint. */
const PALETTE = [
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
];

export function initialsOf(name: string, email: string): string {
  const source = name.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function tintFor(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i);
  return PALETTE[sum % PALETTE.length];
}

export function Avatar({
  user,
  size = "md",
}: {
  user: UserSummary;
  size?: "sm" | "md";
}) {
  const dimensions = size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs";

  return (
    <span
      title={`${user.name} (${user.email})`}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${dimensions} ${tintFor(user.id)}`}
    >
      {initialsOf(user.name, user.email)}
    </span>
  );
}
