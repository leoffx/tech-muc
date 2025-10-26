import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CACHE_DIR = join(process.cwd(), ".cache", "plans");

interface CachedPlan {
  ticketId: string;
  markdown: string;
  sessionId: string;
  generatedAt: string;
  workspace: {
    workspacePath: string;
    repoUrl: string;
    branch: string | null;
  };
}

function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function getCacheFilePath(ticketId: string): string {
  return join(CACHE_DIR, `${ticketId}.json`);
}

export function getCachedPlan(ticketId: string): CachedPlan | null {
  try {
    const filePath = getCacheFilePath(ticketId);
    if (!existsSync(filePath)) {
      return null;
    }

    const content = readFileSync(filePath, "utf8");
    return JSON.parse(content) as CachedPlan;
  } catch (error) {
    console.error("[PlanCache] Failed to read cached plan", {
      ticketId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export function setCachedPlan(data: CachedPlan): void {
  try {
    ensureCacheDir();
    const filePath = getCacheFilePath(data.ticketId);
    writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    console.info("[PlanCache] Cached plan successfully", {
      ticketId: data.ticketId,
    });
  } catch (error) {
    console.error("[PlanCache] Failed to write cached plan", {
      ticketId: data.ticketId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
