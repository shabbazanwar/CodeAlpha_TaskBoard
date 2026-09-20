import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { SEED_PASSWORD, daysFromNow, projects, users } from "./seed-data";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash(SEED_PASSWORD, 10);

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { email: user.email, name: user.name, passwordHash },
      create: { id: user.id, email: user.email, name: user.name, passwordHash },
    });
  }

  for (const project of projects) {
    await prisma.project.upsert({
      where: { id: project.id },
      update: { name: project.name, description: project.description, ownerId: project.ownerId },
      create: {
        id: project.id,
        name: project.name,
        description: project.description,
        ownerId: project.ownerId,
      },
    });

    for (const member of project.members) {
      await prisma.projectMember.upsert({
        where: { projectId_userId: { projectId: project.id, userId: member.userId } },
        update: { role: member.role },
        create: { projectId: project.id, userId: member.userId, role: member.role },
      });
    }

    for (const [boardIndex, board] of project.boards.entries()) {
      await prisma.board.upsert({
        where: { id: board.id },
        update: { name: board.name, position: boardIndex, projectId: project.id },
        create: {
          id: board.id,
          name: board.name,
          position: boardIndex,
          projectId: project.id,
        },
      });

      for (const [taskIndex, task] of board.tasks.entries()) {
        const data = {
          title: task.title,
          description: task.description ?? null,
          position: taskIndex,
          priority: task.priority,
          dueDate: task.dueInDays === undefined ? null : daysFromNow(task.dueInDays),
          boardId: board.id,
          assigneeId: task.assigneeId ?? null,
          createdById: task.createdById,
        };

        await prisma.task.upsert({
          where: { id: task.id },
          update: data,
          create: { id: task.id, ...data },
        });

        for (const comment of task.comments ?? []) {
          await prisma.comment.upsert({
            where: { id: comment.id },
            update: { body: comment.body, authorId: comment.authorId, taskId: task.id },
            create: {
              id: comment.id,
              body: comment.body,
              authorId: comment.authorId,
              taskId: task.id,
            },
          });
        }
      }
    }
  }

  const counts = {
    users: await prisma.user.count(),
    projects: await prisma.project.count(),
    boards: await prisma.board.count(),
    tasks: await prisma.task.count(),
    comments: await prisma.comment.count(),
  };

  console.log("Seed complete:", counts);
  console.log(`Sign in as any of: ${users.map((u) => u.email).join(", ")}`);
  console.log(`Password: ${SEED_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
