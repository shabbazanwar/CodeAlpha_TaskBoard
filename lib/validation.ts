import { z } from "zod";

/* ---------------------------------------------------------------- auth --- */

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be at most 100 characters"),
});

export const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

/* ------------------------------------------------------------ projects --- */

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").max(120),
  description: z.string().trim().max(2000).optional().nullable(),
});

export const addMemberSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

/* -------------------------------------------------------------- boards --- */

export const createBoardSchema = z.object({
  name: z.string().trim().min(1, "Board name is required").max(80),
});

export const updateBoardSchema = z
  .object({
    name: z.string().trim().min(1, "Board name is required").max(80).optional(),
    position: z.number().int().min(0).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });

/* --------------------------------------------------------------- tasks --- */

const priority = z.enum(["LOW", "MEDIUM", "HIGH"]);

/** Accepts an ISO string or a yyyy-mm-dd value; null clears the date. */
// `null` must come first: z.coerce.date() turns null into new Date(null), i.e.
// 1 Jan 1970, which would otherwise win and make it impossible to clear a date.
const dueDate = z.union([z.null(), z.coerce.date()]);

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(5000).optional().nullable(),
  priority: priority.optional(),
  dueDate: dueDate.optional(),
  assigneeId: z.string().min(1).optional().nullable(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    priority: priority.optional(),
    dueDate: dueDate.optional(),
    assigneeId: z.string().min(1).nullable().optional(),
    boardId: z.string().min(1).optional(),
    position: z.number().int().min(0).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });

/* ------------------------------------------------------------ comments --- */

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, "Comment cannot be empty").max(5000),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
