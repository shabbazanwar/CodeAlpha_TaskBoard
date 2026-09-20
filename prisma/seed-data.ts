/**
 * Development seed data. IDs are fixed and human-readable so that re-running
 * the seed updates the same rows instead of creating duplicates.
 */

export const SEED_PASSWORD = "password123";

/** Dates are relative to the seed run so the board always looks current. */
export function daysFromNow(days: number): Date {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

export type SeedUser = { id: string; email: string; name: string };

export const users: SeedUser[] = [
  { id: "seed-user-ada", email: "ada@taskboard.dev", name: "Ada Lovelace" },
  { id: "seed-user-grace", email: "grace@taskboard.dev", name: "Grace Hopper" },
  { id: "seed-user-alan", email: "alan@taskboard.dev", name: "Alan Turing" },
];

export type SeedComment = { id: string; body: string; authorId: string };

export type SeedTask = {
  id: string;
  title: string;
  description?: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueInDays?: number;
  assigneeId?: string;
  createdById: string;
  comments?: SeedComment[];
};

export type SeedBoard = { id: string; name: string; tasks: SeedTask[] };

export type SeedProject = {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: { userId: string; role: "OWNER" | "ADMIN" | "MEMBER" }[];
  boards: SeedBoard[];
};

export const projects: SeedProject[] = [
  {
    id: "seed-project-website",
    name: "Website Redesign",
    description: "Rebuild the marketing site on the new design system.",
    ownerId: "seed-user-ada",
    members: [
      { userId: "seed-user-ada", role: "OWNER" },
      { userId: "seed-user-grace", role: "ADMIN" },
      { userId: "seed-user-alan", role: "MEMBER" },
    ],
    boards: [
      {
        id: "seed-board-web-todo",
        name: "To Do",
        tasks: [
          {
            id: "seed-task-web-1",
            title: "Audit current page templates",
            description:
              "List every template in use, note which ones are duplicates and which can be retired.",
            priority: "MEDIUM",
            dueInDays: 5,
            assigneeId: "seed-user-alan",
            createdById: "seed-user-ada",
            comments: [
              {
                id: "seed-comment-web-1",
                body: "There are 14 templates but I think half are unused. Starting with analytics.",
                authorId: "seed-user-alan",
              },
            ],
          },
          {
            id: "seed-task-web-2",
            title: "Write copy for the pricing page",
            priority: "HIGH",
            dueInDays: 2,
            createdById: "seed-user-ada",
          },
          {
            id: "seed-task-web-3",
            title: "Pick a font pairing",
            description: "Needs to work at small sizes on mobile.",
            priority: "LOW",
            createdById: "seed-user-grace",
          },
        ],
      },
      {
        id: "seed-board-web-doing",
        name: "In Progress",
        tasks: [
          {
            id: "seed-task-web-4",
            title: "Build the component library",
            description: "Buttons, form fields, cards and the nav bar to start with.",
            priority: "HIGH",
            dueInDays: 7,
            assigneeId: "seed-user-grace",
            createdById: "seed-user-ada",
            comments: [
              {
                id: "seed-comment-web-2",
                body: "Buttons and inputs are done. Cards next.",
                authorId: "seed-user-grace",
              },
              {
                id: "seed-comment-web-3",
                body: "Nice. Can we get a disabled state on the inputs too?",
                authorId: "seed-user-ada",
              },
            ],
          },
          {
            id: "seed-task-web-5",
            title: "Set up the staging environment",
            priority: "MEDIUM",
            dueInDays: -1,
            assigneeId: "seed-user-alan",
            createdById: "seed-user-alan",
          },
        ],
      },
      {
        id: "seed-board-web-done",
        name: "Done",
        tasks: [
          {
            id: "seed-task-web-6",
            title: "Agree on the sitemap",
            priority: "MEDIUM",
            assigneeId: "seed-user-ada",
            createdById: "seed-user-ada",
            comments: [
              {
                id: "seed-comment-web-4",
                body: "Signed off in the Tuesday call.",
                authorId: "seed-user-ada",
              },
            ],
          },
          {
            id: "seed-task-web-7",
            title: "Choose a hosting provider",
            description: "Went with Vercel for the preview deployments.",
            priority: "LOW",
            assigneeId: "seed-user-grace",
            createdById: "seed-user-grace",
          },
          {
            id: "seed-task-web-8",
            title: "Kick-off workshop",
            priority: "LOW",
            createdById: "seed-user-ada",
          },
        ],
      },
    ],
  },
  {
    id: "seed-project-mobile",
    name: "Mobile App Launch",
    description: "Ship the iOS and Android builds to the stores.",
    ownerId: "seed-user-grace",
    members: [
      { userId: "seed-user-grace", role: "OWNER" },
      { userId: "seed-user-alan", role: "MEMBER" },
    ],
    boards: [
      {
        id: "seed-board-mob-todo",
        name: "To Do",
        tasks: [
          {
            id: "seed-task-mob-1",
            title: "Prepare store screenshots",
            description: "Six per platform, both light and dark.",
            priority: "MEDIUM",
            dueInDays: 9,
            createdById: "seed-user-grace",
          },
          {
            id: "seed-task-mob-2",
            title: "Draft the release notes",
            priority: "LOW",
            assigneeId: "seed-user-alan",
            createdById: "seed-user-grace",
          },
          {
            id: "seed-task-mob-3",
            title: "Set up crash reporting",
            priority: "HIGH",
            dueInDays: 4,
            createdById: "seed-user-alan",
          },
        ],
      },
      {
        id: "seed-board-mob-doing",
        name: "In Progress",
        tasks: [
          {
            id: "seed-task-mob-4",
            title: "Fix the onboarding flow on small screens",
            description: "The continue button sits below the fold on an iPhone SE.",
            priority: "HIGH",
            dueInDays: 1,
            assigneeId: "seed-user-alan",
            createdById: "seed-user-grace",
            comments: [
              {
                id: "seed-comment-mob-1",
                body: "Reproduced it. The scroll view has a fixed height — fixing now.",
                authorId: "seed-user-alan",
              },
            ],
          },
          {
            id: "seed-task-mob-5",
            title: "Beta test with the support team",
            priority: "MEDIUM",
            dueInDays: 6,
            assigneeId: "seed-user-grace",
            createdById: "seed-user-grace",
          },
        ],
      },
      {
        id: "seed-board-mob-done",
        name: "Done",
        tasks: [
          {
            id: "seed-task-mob-6",
            title: "Register the app bundle IDs",
            priority: "MEDIUM",
            assigneeId: "seed-user-grace",
            createdById: "seed-user-grace",
          },
          {
            id: "seed-task-mob-7",
            title: "Agree the launch date",
            priority: "LOW",
            createdById: "seed-user-grace",
            comments: [
              {
                id: "seed-comment-mob-2",
                body: "Locked in for the end of the month.",
                authorId: "seed-user-grace",
              },
            ],
          },
        ],
      },
    ],
  },
];
