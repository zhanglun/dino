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
  assets: CaptureAsset[];
}

export interface CaptureOptions {
  fetchMode?: "auto" | "static" | "browser" | "stealth";
  // 测试/高级注入点（与 processItem 一致，可选）
  staticFetch?: ProcessItemOptions["staticFetch"];
  browserFetch?: ProcessItemOptions["browserFetch"];
  stealthFetch?: ProcessItemOptions["stealthFetch"];
  fetchImage?: ProcessItemOptions["fetchImage"];
}

/** 给定 URL，返回一份不落盘的内容数据（markdown + 图片二进制）。失败即 throw。 */
export async function capture(url: string, options: CaptureOptions = {}): Promise<CaptureResult> {
  const item = makeUrlItem(url);
  const produced = await produceContent(item, { ...options, outputDir: "" });
  const collected = await collectImages(produced.cleanedHtml, {
    baseUrl: produced.resolvedUrl,
    fetchImage: produced.imageFetch,
  });
  const markdown = demoteTopLevelHeadings(
    stripLeadingDateLine(
      stripDuplicateLeadingHeading(htmlToMarkdown(collected.html), produced.title),
    ),
  );
  return {
    url: produced.resolvedUrl,
    title: produced.title,
    markdown,
    author: produced.metadata.author,
    publishedAt: produced.metadata.published,
    assets: collected.assets.map((a) => ({ path: a.path, data: a.data, contentType: a.contentType })),
  };
}
