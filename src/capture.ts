import { readdir } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadSiteProfiles } from "./cleaning/profiles.js";
import type { SiteProfile } from "./cleaning/types.js";
import { collectImages } from "./collect-images.js";
import { makeUrlItem } from "./models.js";
import {
  demoteTopLevelHeadings,
  produceContent,
  stripDuplicateLeadingHeading,
  stripLeadingDateLine,
  type ProcessItemOptions,
} from "./pipeline.js";
import { htmlToMarkdown } from "./render/markdown.js";

/** Extension detection — mirrors logic in collect-images.ts / assets.ts */
function extensionFrom(contentType: string | null, url: string): string {
  const pathExt = extname(new URL(url).pathname).replace(/[^.a-z0-9]/gi, "");
  if (pathExt && pathExt.length <= 8) return pathExt;
  if (contentType?.includes("svg")) return ".svg";
  if (contentType?.includes("png")) return ".png";
  if (contentType?.includes("webp")) return ".webp";
  if (contentType?.includes("gif")) return ".gif";
  return ".jpg";
}

export interface CaptureAsset {
  path: string;
  data: Uint8Array;
  contentType?: string;
}

export interface CaptureResult {
  url: string;
  title: string;
  markdown: string;
  author?: string;
  publishedAt?: string;
  coverImage?: string;
  assets: CaptureAsset[];
}

export interface CaptureOptions {
  fetchMode?: "auto" | "static" | "browser" | "stealth";
  /**
   * Site profiles to apply. Defaults to the built-in rules (same as the CLI).
   * Pass an empty array to disable all profiles.
   */
  profiles?: SiteProfile[];
  // 测试/高级注入点（与 processItem 一致，可选）
  staticFetch?: ProcessItemOptions["staticFetch"];
  browserFetch?: ProcessItemOptions["browserFetch"];
  stealthFetch?: ProcessItemOptions["stealthFetch"];
  fetchImage?: ProcessItemOptions["fetchImage"];
}

let _builtinProfiles: SiteProfile[] | undefined;

async function getBuiltinProfiles(): Promise<SiteProfile[]> {
  if (_builtinProfiles) return _builtinProfiles;
  const rulesDir = join(dirname(fileURLToPath(import.meta.url)), "site-rules");
  const names = await readdir(rulesDir).catch((err) => {
    console.warn(`capture: 无法读取内置 site-rules 目录 (${rulesDir}): ${(err as Error).message}`);
    return [] as string[];
  });
  const paths = names.filter((n) => n.endsWith(".toml")).sort().map((n) => join(rulesDir, n));
  _builtinProfiles = await loadSiteProfiles(paths);
  return _builtinProfiles;
}

async function downloadCoverImage(
  imageUrl: string,
  imageFetch: typeof fetch | undefined,
  pageUrl: string,
): Promise<CaptureAsset | undefined> {
  const fetchFn = imageFetch ?? fetch;
  let response: Response;
  try {
    response = await fetchFn(imageUrl, { headers: { Referer: pageUrl } });
  } catch (err) {
    console.error(`Cover image fetch error: ${imageUrl.slice(0, 80)} — ${(err as Error).message}`);
    return undefined;
  }
  if (!response.ok) {
    console.error(`Cover image fetch ${response.status}: ${imageUrl.slice(0, 80)}`);
    return undefined;
  }
  const contentType = response.headers.get("content-type");
  if (contentType && !contentType.toLowerCase().startsWith("image/")) {
    console.error(`Cover image skipped (content-type: ${contentType}): ${imageUrl.slice(0, 80)}`);
    return undefined;
  }
  const ext = extensionFrom(contentType, imageUrl);
  const data = new Uint8Array(await response.arrayBuffer());
  return { path: `assets/cover${ext}`, data, contentType: contentType ?? undefined };
}

/** 给定 URL，返回一份不落盘的内容数据（markdown + 图片二进制）。失败即 throw。 */
export async function capture(url: string, options: CaptureOptions = {}): Promise<CaptureResult> {
  const profiles = options.profiles ?? await getBuiltinProfiles();
  const item = makeUrlItem(url);
  const produced = await produceContent(item, { ...options, profiles, outputDir: "" });
  const collected = await collectImages(produced.cleanedHtml, {
    baseUrl: produced.resolvedUrl,
    fetchImage: produced.imageFetch,
  });
  const markdown = demoteTopLevelHeadings(
    stripLeadingDateLine(
      stripDuplicateLeadingHeading(htmlToMarkdown(collected.html), produced.title),
    ),
  );

  const coverImageUrl = produced.metadata.image;
  let coverAsset: CaptureAsset | undefined;
  if (coverImageUrl) {
    coverAsset = await downloadCoverImage(coverImageUrl, produced.imageFetch, produced.resolvedUrl);
  }

  const assets: CaptureAsset[] = [];
  if (coverAsset) assets.push(coverAsset);
  assets.push(...collected.assets.map((a) => ({ path: a.path, data: a.data, contentType: a.contentType })));

  return {
    url: produced.resolvedUrl,
    title: produced.title,
    markdown,
    author: produced.metadata.author,
    publishedAt: produced.metadata.published,
    coverImage: coverImageUrl,
    assets,
  };
}
