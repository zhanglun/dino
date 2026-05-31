import { localizeImages } from "./assets.js";
import { cleanHtml } from "./cleaning/clean-html.js";
import { selectActiveProfiles } from "./cleaning/profiles.js";
import type { DinoMetadata, SiteProfile } from "./cleaning/types.js";
import { proxyAwareFetch } from "./fetch/proxy-fetch.js";
import { fetchHtmlResult, type FetchHtmlOptions } from "./fetch/strategy.js";
import type { UrlItem } from "./models.js";
import { cleanupExistingNote, sanitizeFilename, writeMarkdownNote, type ConflictResolution } from "./output.js";
import { htmlToMarkdown } from "./render/markdown.js";

export interface ProcessItemOptions extends FetchHtmlOptions {
  outputDir: string;
  profiles?: SiteProfile[];
  localizeAssets?: boolean;
  fetchImage?: typeof fetch;
  browserStateDefaults?: {
    userDataDir: string;
    profile: string;
  } | null;
  onConflict?: (conflictDir: string) => Promise<ConflictResolution>;
  datePrefix?: boolean;
}

export interface ProcessItemResult {
  item: UrlItem;
  outputPath: string;
  title: string;
}

function titleFromUrl(url: string): string {
  const parsed = new URL(url);
  const segment = parsed.pathname.split("/").filter(Boolean).pop();
  return decodeURIComponent(segment || parsed.hostname || "Untitled").replace(/[-_]+/g, " ").trim() || "Untitled";
}

function stripDuplicateLeadingHeading(markdown: string, title: string): string {
  const normalizedTitle = title.replace(/\s+/g, " ").trim().toLowerCase();
  return markdown.replace(/^#\s+(.+?)\s*\n+/, (match, heading: string) => {
    return heading.replace(/\s+/g, " ").trim().toLowerCase() === normalizedTitle ? "" : match;
  });
}

function stripLeadingDateLine(markdown: string): string {
  return markdown.replace(/^(?:Published\s+)?(?:\d{4}[-/.年]\d{1,2}[-/.月]\d{1,2}日?|[A-Z][a-z]+\s+\d{1,2},\s+\d{4})\s*\n+/i, "");
}

function demoteTopLevelHeadings(markdown: string): string {
  const lines = markdown.split("\n");
  let inFence = false;
  return lines.map((line) => {
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      return line;
    }
    if (!inFence && /^#(?!#)\s+/.test(line)) {
      return `#${line}`;
    }
    return line;
  }).join("\n");
}

function createdFromItemDate(date: Date): string {
  if (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  ) {
    return date.toISOString().slice(0, 10);
  }
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function resolveCreatedValue(item: UrlItem, published: string | undefined): string {
  if (published?.trim()) return published.trim();
  if (item.publishedAt) return createdFromItemDate(item.publishedAt);
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function mergeProfileFetchOptions(options: ProcessItemOptions, profiles: SiteProfile[]): FetchHtmlOptions {
  const merged: FetchHtmlOptions = { ...options };
  for (const profile of profiles) {
    if (profile.fetch?.mode) merged.fetchMode = profile.fetch.mode;
    if (profile.fetch?.waitMs !== undefined) merged.waitMs = profile.fetch.waitMs;
    if (profile.fetch?.networkIdle !== undefined) merged.networkIdle = profile.fetch.networkIdle;
    if (profile.fetch?.waitSelector) merged.waitSelector = profile.fetch.waitSelector;
    if (profile.fetch?.waitSelectorState) merged.waitSelectorState = profile.fetch.waitSelectorState;
    if (profile.fetch?.clickSelectors) merged.clickSelectors = profile.fetch.clickSelectors;
    if (profile.fetch?.scrollToBottom !== undefined) merged.scrollToBottom = profile.fetch.scrollToBottom;
    if (profile.fetch?.useProxyEnv !== undefined) merged.useProxyEnv = profile.fetch.useProxyEnv;
    if (profile.fetch?.preferBrowserState && options.browserStateDefaults) {
      merged.browserState = {
        ...options.browserStateDefaults,
        waitMs: merged.waitMs,
        networkIdle: merged.networkIdle,
        proxy: merged.proxy,
        dnsOverHttps: merged.dnsOverHttps,
        waitSelector: merged.waitSelector,
        waitSelectorState: merged.waitSelectorState,
        clickSelectors: merged.clickSelectors,
        scrollToBottom: merged.scrollToBottom,
        headless: merged.headless,
        realChromeDefaults: merged.realChromeDefaults,
      };
    }
  }
  return merged;
}

export interface ProducedContent {
  resolvedUrl: string;
  title: string;
  created: string;
  cleanedHtml: string;
  metadata: DinoMetadata;
  imageFetch?: typeof fetch;
}

/** 纯数据生产：抓取 + 清洗 + 元数据 + 标题/created。无落盘副作用。 */
export async function produceContent(item: UrlItem, options: ProcessItemOptions): Promise<ProducedContent> {
  const urlProfiles = selectActiveProfiles(options.profiles, item.url, "");
  const fetchOptions = mergeProfileFetchOptions(options, urlProfiles);
  const fetchResult = await fetchHtmlResult(item.url, fetchOptions);
  const html = fetchResult.html;
  const resolvedUrl = fetchResult.finalUrl;
  const activeProfiles = selectActiveProfiles(options.profiles, item.url, html);
  const defuddleFetch = activeProfiles.some((profile) => profile.fetch?.useProxyEnv) ? proxyAwareFetch : undefined;
  const cleaned = await cleanHtml(html, { baseUrl: item.url, profiles: options.profiles, activeProfiles, defuddleFetch });
  if (activeProfiles.some((profile) => profile.extraction?.requireText) && !cleaned.content.replace(/<[^>]*>/g, "").trim()) {
    throw new Error("matched site rule requires extracted text, but no text content was extracted");
  }
  const title = cleaned.metadata.title || item.sourceTitle || titleFromUrl(item.url);
  const imageFetch = options.fetchImage ?? (activeProfiles.some((profile) => profile.fetch?.useProxyEnv) ? proxyAwareFetch : undefined);
  const created = resolveCreatedValue(item, cleaned.metadata.published);
  return { resolvedUrl, title, created, cleanedHtml: cleaned.content, metadata: cleaned.metadata, imageFetch };
}

export async function processItem(item: UrlItem, options: ProcessItemOptions): Promise<ProcessItemResult> {
  const { resolvedUrl, title, created, cleanedHtml, metadata, imageFetch } = await produceContent(item, options);
  await cleanupExistingNote(options.outputDir, item.url);
  const slug = sanitizeFilename(title);
  const noteBase = options.datePrefix ? `${created.slice(0, 10)}-${slug}` : slug;
  const contentHtml = options.localizeAssets === false
    ? cleanedHtml
    : await localizeImages(cleanedHtml, {
        outputDir: options.outputDir,
        noteSlug: noteBase,
        baseUrl: resolvedUrl,
        fetchImage: imageFetch,
      });
  const markdown = demoteTopLevelHeadings(stripLeadingDateLine(stripDuplicateLeadingHeading(htmlToMarkdown(contentHtml), title)));
  const outputPath = await writeMarkdownNote(options.outputDir, {
    sourceUrl: item.url,
    title,
    metadata,
    markdown,
    created,
  }, options.onConflict, { datePrefix: options.datePrefix });
  return { item, outputPath, title };
}
