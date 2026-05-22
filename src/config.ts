import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export interface DinoConfig {
  outputDir?: string;
  fetchMode?: "auto" | "static" | "browser" | "stealth";
  waitMs?: number;
  proxy?: string;
  siteRulesDir?: string;
}

const CONFIG_FILENAME = ".dino.json";

export function localConfigPath(): string {
  return join(process.cwd(), CONFIG_FILENAME);
}

export function globalConfigPath(): string {
  return join(homedir(), CONFIG_FILENAME);
}

async function tryReadJson(path: string): Promise<DinoConfig | null> {
  try {
    const text = await readFile(path, "utf8");
    return JSON.parse(text) as DinoConfig;
  } catch {
    return null;
  }
}

export async function loadConfig(): Promise<{ config: DinoConfig; source: string | null }> {
  const localPath = localConfigPath();
  const local = await tryReadJson(localPath);
  if (local) return { config: local, source: localPath };
  const globalPath = globalConfigPath();
  const global = await tryReadJson(globalPath);
  if (global) return { config: global, source: globalPath };
  return { config: {}, source: null };
}

export async function saveConfig(config: DinoConfig, path: string): Promise<void> {
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}
