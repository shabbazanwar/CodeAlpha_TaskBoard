import type { UserSummary } from "@/lib/types";

/** Deterministic gradient per person, so the same face keeps the same colour. */
const PALETTE = [
  "from-rose-400 to-orange-400",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-sky-400 to-indigo-500",
  "from-violet-400 to-fuchsia-500",
  "from-teal-400 to-cyan-500",
  "from-blue-400 to-indigo-500",
  "from-indigo-400 to-violet-500",
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

const SIZES = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
} as const;

export function Avatar({
  user,
  size = "md",
  ring = false,
  single = false,
}: {
  user: UserSummary;
  size?: keyof typeof SIZES;
  /** White ring, for when avatars overlap in a stack. */
  ring?: boolean;
  /** Show one initial instead of two, for tight spaces. */
  single?: boolean;
}) {
  return (
    <span
      title={`${user.name} (${user.email})`}
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shadow-sm ${SIZES[size]} ${tintFor(user.id)} ${
        ring ? "ring-2 ring-white" : ""
      }`}
    >
      {single ? initialsOf(user.name, user.email).charAt(0) : initialsOf(user.name, user.email)}
    </span>
  );
}

/** Overlapping avatars with a "+N" chip once there are more than `max`. */
export function AvatarStack({
  users,
  max = 5,
  size = "md",
}: {
  users: UserSummary[];
  max?: number;
  size?: keyof typeof SIZES;
}) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;

  return (
    <span className="inline-flex items-center -space-x-1">
      {shown.map((user) => (
        <Avatar key={user.id} user={user} size={size} ring single={size === "sm" || size === "xs"} />
      ))}
      {extra > 0 ? (
        <span
          className={`inline-flex items-center justify-center rounded-full bg-ink-100 font-semibold text-ink-600 ring-2 ring-white ${SIZES[size]}`}
        >
          +{extra}
        </span>
      ) : null}
    </span>
  );
}
