import * as DefuddleModule from "defuddle";
import { parseHTML } from "linkedom";

import { applyMetadataProfiles, applySiteProfiles } from "./profile-dom.js";
import { selectActiveProfiles } from "./profiles.js";
import type { DinoMetadata, HtmlCleaningOptions, HtmlCleaningResult, RemovalRecord, SiteProfile } from "./types.js";

function resolveContentSelector(profiles: SiteProfile[], doc: Document, override?: string): string | undefined {
  if (override) return doc.querySelector(override) ? override : undefined;
  for (const profile of profiles) {
    for (const sel of profile.content?.selectors ?? []) {
      if (sel.trim() && doc.querySelector(sel)) return sel;
    }
  }
  return undefined;
}

// Reveal content images that are hidden by ancestor visibility/aria-hidden attributes.
// Without this, sites that lazy-reveal their images (e.g. WeChat swipers) look empty to Defuddle.
function revealHiddenImages(root: Element): void {
  for (const img of Array.from(root.querySelectorAll("img"))) {
    const el = img as unknown as Element;
    const src = el.getAttribute("src") ?? "";
    const dataSrc = el.getAttribute("data-src") ?? "";
    if ((!src || src.startsWith("data:")) && !dataSrc) continue;
    let ancestor: Element | null = el.parentElement as unknown as Element | null;
    while (ancestor && ancestor !== root) {
      const style = ancestor.getAttribute("style") ?? "";
      if (/visibility\s*:\s*hidden/i.test(style)) {
        ancestor.setAttribute("style", style.replace(/visibility\s*:\s*hidden\s*;?\s*/gi, "").trim());
      }
      if (ancestor.getAttribute("aria-hidden") === "true") {
        ancestor.removeAttribute("aria-hidden");
      }
      ancestor = ancestor.parentElement as unknown as Element | null;
    }
  }
}

// Fallback for image-only content (e.g. WeChat slideshows) when Defuddle returns nothing:
// collect all real images from the selector root and wrap them in simple paragraphs.
function buildImageFallbackContent(root: Element): string {
  const parts: string[] = [];
  for (const img of Array.from(root.querySelectorAll("img")) as unknown as Element[]) {
    const src = img.getAttribute("src") ?? "";
    const dataSrc = img.getAttribute("data-src") ?? "";
    const actualSrc = (!src || src.startsWith("data:")) ? dataSrc : src;
    if (!actualSrc) continue;
    const alt = img.getAttribute("alt") ?? "";
    parts.push(`<p><img src="${actualSrc}" alt="${alt}"></p>`);
  }
  return parts.join("\n");
}

const DEFAULT_DINO_PROFILE: SiteProfile = {
  name: "dino-default",
  removals: {
    exactSelectors: [
      "script",
      "style",
      "noscript",
      ".share-buttons",
      ".social-share",
      ".newsletter",
      ".subscribe",
      ".related",
      ".comments",
    ],
    partialAttributePatterns: ["share.{0,6}(btn|button|icon|link|bar|widget|count|social)", "newsletter", "subscribe", "related", "comment"],
  },
};

type DefuddleParseResult = {
  title?: string;
  description?: string;
  domain?: string;
  favicon?: string;
  image?: string;
  language?: string;
  published?: string;
  author?: string;
  site?: string;
  schemaOrgData?: unknown;
  wordCount?: number;
  parseTime?: number;
  content: string;
  contentMarkdown?: string;
  debug?: { contentSelector?: string; removals?: RemovalRecord[] };
};

type DefuddleParser = {
  parse(): DefuddleParseResult;
  parseAsync?: () => Promise<DefuddleParseResult>;
};
type DefuddleConstructor = new (document: Document, options?: Record<string, unknown>) => DefuddleParser;
const DefuddleClass = ((DefuddleModule as unknown as { default?: DefuddleConstructor; Defuddle?: DefuddleConstructor }).default ??
  (DefuddleModule as unknown as { Defuddle?: DefuddleConstructor }).Defuddle) as DefuddleConstructor;

type DomConstructorName = "Node" | "Element" | "HTMLElement" | "Document" | "DocumentFragment" | "Text" | "Comment" | "HTMLAnchorElement";

type DomConstructorMap = Partial<Record<DomConstructorName, unknown>>;

function installDefuddleDomGlobals(window: Window & typeof globalThis): void {
  const target = globalThis as DomConstructorMap;
  const source = window as unknown as DomConstructorMap;
  for (const key of ["Node", "Element", "HTMLElement", "Document", "DocumentFragment", "Text", "Comment", "HTMLAnchorElement"] as const) {
    if (!target[key] && source[key]) {
      target[key] = source[key];
    }
  }
}

function firstMetaContent(document: Document, names: string[]): string | undefined {
  for (const name of names) {
    const escaped = name.replace(/"/g, "\\\"");
    const element = document.querySelector(`meta[property="${escaped}"], meta[name="${escaped}"], meta[itemprop="${escaped}"]`);
    const content = element?.getAttribute("content")?.trim();
    if (content) return content;
  }
  return undefined;
}

function jsonLdValue(document: Document, keys: string[]): string | undefined {
  for (const script of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
    const text = script.textContent?.trim();
    if (!text) continue;
    try {
      const parsed = JSON.parse(text) as unknown;
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        if (!node || typeof node !== "object") continue;
        for (const key of keys) {
          const value = (node as Record<string, unknown>)[key];
          if (typeof value === "string" && value.trim()) return value.trim();
          if (value && typeof value === "object" && typeof (value as Record<string, unknown>).name === "string") {
            return String((value as Record<string, unknown>).name).trim();
          }
        }
      }
    } catch {
      // Ignore malformed third-party JSON-LD.
    }
  }
  return undefined;
}

function profileAuthorFromDocument(document: Document, profiles: SiteProfile[]): string | undefined {
  for (const profile of profiles) {
    const metadata = profile.metadata;
    if (!metadata) continue;

    for (const selector of metadata.authorSelectors ?? []) {
      const author = document.querySelector(selector)?.textContent?.replace(/\s+/g, " ").trim();
      if (author) return author;
    }

    const metaNames = [
      ...(metadata.authorMetaNames ?? []).map((value) => ({ attr: "name", value })),
      ...(metadata.authorMetaItemprops ?? []).map((value) => ({ attr: "itemprop", value })),
      ...(metadata.authorMetaProperties ?? []).map((value) => ({ attr: "property", value })),
    ];
    for (const entry of metaNames) {
      const escaped = entry.value.replace(/"/g, "\\\"");
      const author = document.querySelector(`meta[${entry.attr}="${escaped}"]`)?.getAttribute("content")?.trim();
      if (author) return author;
    }
  }
  return undefined;
}

function toMetadata(result: DefuddleParseResult, document: Document, profiles: SiteProfile[]): DinoMetadata {
  return {
    title: result.title || firstMetaContent(document, ["og:title", "twitter:title"]) || document.querySelector("title")?.textContent?.trim() || undefined,
    description: result.description || firstMetaContent(document, ["description", "og:description", "twitter:description"]),
    domain: result.domain || undefined,
    favicon: result.favicon || undefined,
    image: result.image || firstMetaContent(document, ["og:image", "twitter:image"]),
    language: result.language || document.documentElement.getAttribute("lang") || undefined,
    published: result.published || firstMetaContent(document, ["article:published_time", "date", "datePublished", "pubdate", "publishdate"]) || jsonLdValue(document, ["datePublished", "dateCreated"]),
    author: result.author || profileAuthorFromDocument(document, profiles) || firstMetaContent(document, ["author", "article:author", "twitter:creator"]) || jsonLdValue(document, ["author", "creator"]),
    site: result.site || firstMetaContent(document, ["og:site_name", "application-name"]),
    schemaOrgData: result.schemaOrgData,
    wordCount: result.wordCount,
    parseTime: result.parseTime,
  };
}

function appendMetaImages(document: Document, root: Element, profiles: SiteProfile[]): void {
  const properties = profiles.flatMap((profile) => profile.media?.includeMetaImages
    ? (profile.media.imageMetaProperties ?? ["og:image"])
    : []);
  if (properties.length === 0) {
    return;
  }

  const seen = new Set(Array.from(root.querySelectorAll("img")).map((img) => img.getAttribute("src") ?? ""));
  for (const property of properties) {
    const escaped = property.replace(/"/g, "\\\"");
    for (const meta of Array.from(document.querySelectorAll(`meta[property="${escaped}"], meta[name="${escaped}"], meta[itemprop="${escaped}"]`))) {
      const src = meta.getAttribute("content")?.trim();
      if (!src || seen.has(src)) continue;
      const img = document.createElement("img");
      img.setAttribute("src", src);
      img.setAttribute("alt", "");
      root.appendChild(document.createElement("p"));
      root.lastElementChild?.appendChild(img);
      seen.add(src);
    }
  }
}

function appendMetaVideos(document: Document, root: Element, profiles: SiteProfile[]): void {
  const properties = profiles.flatMap((profile) => profile.media?.includeMetaVideos
    ? (profile.media.videoMetaProperties ?? ["og:video"])
    : []);
  if (properties.length === 0) return;

  for (const property of properties) {
    const escaped = property.replace(/"/g, "\\\"");
    for (const meta of Array.from(document.querySelectorAll(`meta[property="${escaped}"], meta[name="${escaped}"], meta[itemprop="${escaped}"]`))) {
      const src = meta.getAttribute("content")?.trim();
      if (!src) continue;
      const video = document.createElement("video");
      video.setAttribute("src", src);
      video.setAttribute("controls", "");
      const p = document.createElement("p");
      p.appendChild(video);
      root.appendChild(p);
    }
  }
}

function serializeProfiledContent(document: Document, content: string, profiles: SiteProfile[], removals: RemovalRecord[]): string {
  const { document: contentDocument } = parseHTML(`<!doctype html><html><body><main data-dino-profile-root="true">${content}</main></body></html>`);
  const root = contentDocument.querySelector('[data-dino-profile-root="true"]') ?? contentDocument.body;
  appendMetaImages(document, root, profiles);
  appendMetaVideos(document, root, profiles);
  applySiteProfiles(root, profiles, removals);
  const serialized = root.innerHTML || root.outerHTML || contentDocument.body.innerHTML;
  return serialized.trim() ? `${serialized.trim()}\n` : "";
}

export class HtmlCleaner {
  constructor(private readonly options: HtmlCleaningOptions = {}) {}

  async parse(rawHtml: string): Promise<HtmlCleaningResult> {
    const activeProfiles = this.options.activeProfiles ?? selectActiveProfiles(this.options.profiles, this.options.baseUrl, rawHtml);
    const postProfiles = [DEFAULT_DINO_PROFILE, ...activeProfiles];
    const removals: RemovalRecord[] = [];

    const html = /<html[\s>]/i.test(rawHtml) ? rawHtml : `<!doctype html><html><body>${rawHtml}</body></html>`;

    const window = parseHTML(html);
    installDefuddleDomGlobals(window);
    const { document } = window;
    const contentSelector = resolveContentSelector(activeProfiles, document as unknown as Document, this.options.contentSelector);
    // Capture image fallback content BEFORE Defuddle modifies the document in place.
    let imageFallback = "";
    if (contentSelector) {
      const contentRoot = document.querySelector(contentSelector) as unknown as Element | null;
      if (contentRoot) {
        revealHiddenImages(contentRoot);
        imageFallback = buildImageFallbackContent(contentRoot);
      }
    }

    const doc = document as Document & { URL?: string };
    if (this.options.baseUrl) {
      doc.URL = this.options.baseUrl;
    }
    if (!(doc as unknown as { styleSheets?: unknown }).styleSheets) {
      (doc as unknown as { styleSheets: unknown[] }).styleSheets = [];
    }

    const parser = new DefuddleClass(doc, {
      url: this.options.baseUrl,
      debug: this.options.debug,
      contentSelector,
      removeSmallImages: this.options.removeSmallImages,
      removeHiddenElements: this.options.removeHiddenElements,
      removeLowScoring: this.options.removeLowScoring,
      removeExactSelectors: this.options.removeExactSelectors,
      removePartialSelectors: this.options.removePartialSelectors,
      removeContentPatterns: this.options.removeContentPatterns,
      standardize: this.options.standardize,
      fetch: this.options.defuddleFetch,
      language: this.options.language,
    });
    const result = parser.parseAsync ? await parser.parseAsync() : parser.parse();

    const metadata = toMetadata(result, document, activeProfiles);
    applyMetadataProfiles(metadata, activeProfiles);

    const rawContent = result.content.replace(/<[^>]*>/g, "").trim() ? result.content : imageFallback;
    const content = serializeProfiledContent(document, rawContent, postProfiles, removals);

    return {
      content,
      contentMarkdown: result.contentMarkdown,
      metadata,
      debug: this.options.debug
        ? {
            contentSelector: result.debug?.contentSelector ?? contentSelector,
            activeProfiles: activeProfiles.map((profile) => profile.name),
            removals: [...(result.debug?.removals ?? []), ...removals],
          }
        : undefined,
    };
  }
}

export async function cleanHtml(rawHtml: string, options: HtmlCleaningOptions = {}): Promise<HtmlCleaningResult> {
  return new HtmlCleaner(options).parse(rawHtml);
}
