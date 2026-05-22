import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export interface FeedloomConfig {
  outputDir?: string;
  fetchMode?: "auto" | "static" | "browser" | "stealth";
  waitMs?: number;
  proxy?: string;
  siteRulesDir?: string;
}

const CONFIG_FILENAME = ".feedloom.json";

export function localConfigPath(): string {
  return join(process.cwd(), CONFIG_FILENAME);
}

export function globalConfigPath(): string {
  return join(homedir(), CONFIG_FILENAME);
}

async function tryReadJson(path: string): Promise<FeedloomConfig | null> {
  try {
    const text = await readFile(path, "utf8");
    return JSON.parse(text) as FeedloomConfig;
  } catch {
    return null;
  }
}

export async function loadConfig(): Promise<{ config: FeedloomConfig; source: string | null }> {
  const localPath = localConfigPath();
  const local = await tryReadJson(localPath);
  if (local) return { config: local, source: localPath };
  const globalPath = globalConfigPath();
  const global = await tryReadJson(globalPath);
  if (global) return { config: global, source: globalPath };
  return { config: {}, source: null };
}

export async function saveConfig(config: FeedloomConfig, path: string): Promise<void> {
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}
