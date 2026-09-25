/**
 * The shapes the client works with. Dates are ISO strings so that data fetched
 * over `fetch` and data passed down from a server component are identical —
 * otherwise one side has `Date` objects and the other has strings.
 */

export type ProjectRoleName = "OWNER" | "ADMIN" | "MEMBER";
export type TaskPriorityName = "LOW" | "MEDIUM" | "HIGH";

export type UserSummary = {
  id: string;
  name: string;
  email: string;
};

export type TaskCardData = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  priority: TaskPriorityName;
  dueDate: string | null;
  boardId: string;
  assignee: UserSummary | null;
  createdBy: UserSummary | null;
  commentCount: number;
};

export type CommentData = {
  id: string;
  body: string;
  createdAt: string;
  author: UserSummary;
};

export type TaskDetailData = TaskCardData & {
  comments: CommentData[];
};

export type BoardData = {
  id: string;
  name: string;
  position: number;
  tasks: TaskCardData[];
};

export type MemberData = {
  id: string;
  role: ProjectRoleName;
  user: UserSummary;
};

export type ProjectBoardData = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  role: ProjectRoleName;
  members: MemberData[];
  boards: BoardData[];
};

export type ProjectListItem = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  role: ProjectRoleName;
  owner: UserSummary;
  memberCount: number;
  boardCount: number;
  updatedAt: string;
};
