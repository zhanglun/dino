import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { DinoMetadata } from "./cleaning/types.js";

export type ConflictResolution = "overwrite" | "add" | "cancel";

export class ConflictCancelledError extends Error {
  constructor(path: string) {
    super(`Skipped: ${path} already exists`);
    this.name = "ConflictCancelledError";
  }
}

const FRONTMATTER_ESCAPE_RE = /[\n\r]/g;

export function sanitizeFilename(title: string): string {
  return title
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 180) || "Untitled";
}

function yamlString(value: string): string {
  return JSON.stringify(value.replace(FRONTMATTER_ESCAPE_RE, " "));
}

export function renderFrontmatter(source: string, title: string, metadata: DinoMetadata, created: string): string {
  const lines = ["---", `source: ${yamlString(source)}`, `title: ${yamlString(title)}`];
  if (metadata.author) {
    lines.push(`author: ${yamlString(metadata.author)}`);
  }
  lines.push(`created: ${yamlString(created)}`);
  lines.push("---", "");
  return `${lines.join("\n")}\n`;
}

function noteSource(text: string): string {
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return "";
  for (const line of lines.slice(1)) {
    if (line.trim() === "---") break;
    const match = line.match(/^\s*source:\s*(.*)\s*$/);
    if (!match) continue;
    const raw = match[1].trim();
    try {
      return JSON.parse(raw) as string;
    } catch {
      return raw.replace(/^['"]|['"]$/g, "");
    }
  }
  return "";
}

export async function cleanupExistingNote(outputDir: string, sourceUrl: string): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  const entries = await readdir(outputDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const contentPath = join(outputDir, entry.name, "content.md");
    let text = "";
    try {
      text = await readFile(contentPath, "utf8");
    } catch {
      continue;
    }
    if (noteSource(text) !== sourceUrl && !text.includes(`> Source: ${sourceUrl}`)) continue;
    await rm(join(outputDir, entry.name), { recursive: true, force: true });
    return;
  }
}

function urlHash(url: string): string {
  return createHash("sha1").update(url).digest("hex").slice(0, 8);
}

export interface MarkdownNote {
  sourceUrl: string;
  title: string;
  metadata: DinoMetadata;
  markdown: string;
  created: string;
}

function datePrefixFromCreated(created: string): string {
  return created.slice(0, 10);
}

export async function writeMarkdownNote(
  outputDir: string,
  note: MarkdownNote,
  onConflict?: (conflictDir: string) => Promise<ConflictResolution>,
  options?: { datePrefix?: boolean },
): Promise<string> {
  const slug = sanitizeFilename(note.title);
  const base = options?.datePrefix ? `${datePrefixFromCreated(note.created)}-${slug}` : slug;
  const noteDir = join(outputDir, base);
  let targetDir = noteDir;

  let dirExists = false;
  try {
    await stat(join(noteDir, "content.md"));
    dirExists = true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  if (dirExists) {
    const resolution = onConflict ? await onConflict(noteDir) : "add";
    if (resolution === "cancel") {
      throw new ConflictCancelledError(noteDir);
    } else if (resolution === "overwrite") {
      await rm(noteDir, { recursive: true, force: true });
    } else {
      targetDir = join(outputDir, `${base}-${urlHash(note.sourceUrl)}`);  // base already includes date prefix if enabled
    }
  }

  await mkdir(targetDir, { recursive: true });
  const path = join(targetDir, "content.md");
  const body = note.markdown.trim();
  await writeFile(path, `${renderFrontmatter(note.sourceUrl, note.title, note.metadata, note.created)}# ${note.title}\n\n${body}\n`, "utf8");
  return path;
}
