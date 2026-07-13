import { prisma } from "@/lib/prisma";
import { STAGES, STAGE_ORDER, PLACEMENT_PASS_THRESHOLD } from "@/lib/constants";
import { ExerciseRecord } from "@/types/exercise";

export type Stage = keyof typeof STAGE_ORDER;

export interface PlacementSection {
  stage: Stage;
  exercises: ExerciseRecord[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// One section per stage above BEGINNER, sampled from that stage's earliest
// unit — stages with no content yet (the common case while the curriculum is
// still small) are simply omitted rather than blocking placement.
export async function buildPlacementSections(languageId: string): Promise<PlacementSection[]> {
  const sections: PlacementSection[] = [];

  for (const stage of STAGES) {
    if (stage === "BEGINNER") continue;
    const unit = await prisma.unit.findFirst({
      where: { languageId, stage },
      orderBy: { sortOrder: "asc" },
      include: { lessons: { orderBy: { sortOrder: "asc" }, include: { exercises: true } } },
    });
    if (!unit) continue;

    const allExercises = unit.lessons.flatMap((l) => l.exercises) as unknown as ExerciseRecord[];
    if (allExercises.length === 0) continue;

    sections.push({ stage, exercises: shuffle(allExercises).slice(0, 3) });
  }

  return sections;
}

// Walks stages lowest-to-highest; the highest stage the learner clears at
// PLACEMENT_PASS_THRESHOLD becomes their unlocked stage. Stops at the first
// stage they fail (or have no data for), so placement can't skip a gap.
export function scorePlacement(results: { stage: Stage; correct: boolean }[]): Stage {
  let unlocked: Stage = "BEGINNER";
  for (const stage of STAGES) {
    if (stage === "BEGINNER") continue;
    const stageResults = results.filter((r) => r.stage === stage);
    if (stageResults.length === 0) break;
    const accuracy = stageResults.filter((r) => r.correct).length / stageResults.length;
    if (accuracy < PLACEMENT_PASS_THRESHOLD) break;
    unlocked = stage;
  }
  return unlocked;
}
