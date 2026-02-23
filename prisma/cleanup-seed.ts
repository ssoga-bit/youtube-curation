import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_VIDEO_IDS = [
  "v_python_intro",
  "v_python_list",
  "v_python_func",
  "v_ai_intro",
  "v_prompt_eng",
  "v_chatgpt_api",
  "v_git_intro",
  "v_html_css",
  "v_math_basics",
  "v_ai_ethics",
  "v_python_en",
  "v_ai_history",
];

const SEED_PATH_IDS = ["path_python_intro", "path_ai_intro"];
const SEED_USER_IDS = ["demo-user", "admin-user"];

async function main() {
  // Delete related records first (foreign key constraints)
  const progress = await prisma.userProgress.deleteMany({
    where: { videoId: { in: SEED_VIDEO_IDS } },
  });
  console.log(`Deleted ${progress.count} user progress records`);

  const feedback = await prisma.feedback.deleteMany({
    where: { videoId: { in: SEED_VIDEO_IDS } },
  });
  console.log(`Deleted ${feedback.count} feedback records`);

  const steps = await prisma.pathStep.deleteMany({
    where: { pathId: { in: SEED_PATH_IDS } },
  });
  console.log(`Deleted ${steps.count} path steps`);

  const paths = await prisma.path.deleteMany({
    where: { id: { in: SEED_PATH_IDS } },
  });
  console.log(`Deleted ${paths.count} paths`);

  const videos = await prisma.video.deleteMany({
    where: { id: { in: SEED_VIDEO_IDS } },
  });
  console.log(`Deleted ${videos.count} videos`);

  const users = await prisma.user.deleteMany({
    where: { id: { in: SEED_USER_IDS } },
  });
  console.log(`Deleted ${users.count} seed users`);

  console.log("\nSeed data cleanup complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
