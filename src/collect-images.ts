import { extname } from "node:path";
import { parseHTML } from "linkedom";

export interface CollectedAsset {
  path: string;
  data: Uint8Array;
  contentType?: string;
}

export interface CollectImagesResult {
  html: string;
  assets: CollectedAsset[];
}

export interface CollectImagesOptions {
  baseUrl: string;
  fetchImage?: typeof fetch;
}

function extensionFrom(contentType: string | null, url: string): string {
  const pathExt = extname(new URL(url).pathname).replace(/[^.a-z0-9]/gi, "");
  if (pathExt && pathExt.length <= 8) return pathExt;
  if (contentType?.includes("svg")) return ".svg";
  if (contentType?.includes("png")) return ".png";
  if (contentType?.includes("webp")) return ".webp";
  if (contentType?.includes("gif")) return ".gif";
  return ".jpg";
}

function imageSource(img: Element): string | null {
  const direct = img.getAttribute("data-original") || img.getAttribute("data-src") || img.getAttribute("src");
  if (direct) return direct;
  const srcset = img.getAttribute("data-srcset") || img.getAttribute("srcset");
  const first = srcset?.split(",").map((part) => part.trim().split(/\s+/)[0]).find(Boolean);
  return first || null;
}

function svgImageAlt(svg: Element): string {
  return svg.getAttribute("aria-label")?.trim()
    || svg.getAttribute("alt")?.trim()
    || svg.querySelector("title")?.textContent?.trim()
    || "formula";
}

function ensureSvgNamespace(svg: Element): string {
  const html = svg.outerHTML;
  return /\sxmlns=/.test(html) ? html : html.replace(/^<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
}

export async function collectImages(
  html: string,
  options: CollectImagesOptions,
): Promise<CollectImagesResult> {
  const { document } = parseHTML(`<!doctype html><html><body>${html}</body></html>`);
  const images = Array.from(document.querySelectorAll("img"));
  const inlineSvgs = Array.from(document.querySelectorAll("svg"));
  const videos = Array.from(document.querySelectorAll("video")) as unknown as Element[];
  if (images.length === 0 && inlineSvgs.length === 0 && videos.length === 0) return { html, assets: [] };

  const fetchImage = options.fetchImage ?? ((url: string) => fetch(url, { headers: { Referer: options.baseUrl } }));
  const seen = new Map<string, string>();
  const assets: CollectedAsset[] = [];
  let index = 1;

  for (const svg of inlineSvgs) {
    if (!(svg as unknown as { isConnected?: boolean }).isConnected) continue;
    const filename = `image-${String(index).padStart(3, "0")}.svg`;
    index += 1;
    const data = new TextEncoder().encode(ensureSvgNamespace(svg));
    const rel = `assets/${filename}`;
    assets.push({ path: rel, data, contentType: "image/svg+xml" });
    const img = document.createElement("img");
    img.setAttribute("src", rel);
    img.setAttribute("alt", svgImageAlt(svg));
    const mathContainer = svg.parentElement?.tagName.toLowerCase() === "mjx-container" ? svg.parentElement : null;
    if (mathContainer) {
      mathContainer.replaceWith(img);
    } else {
      svg.replaceWith(img);
    }
  }

  for (const img of images) {
    const raw = imageSource(img);
    if (!raw || raw.startsWith("data:") || raw.startsWith("blob:")) continue;
    let absolute: string;
    try {
      absolute = new URL(raw, options.baseUrl).toString();
    } catch {
      continue;
    }
    let rel = seen.get(absolute);
    if (!rel) {
      let response: Response;
      try {
        response = await fetchImage(absolute);
      } catch (err) {
        console.error(`Asset fetch error: ${absolute.slice(0, 80)} — ${(err as Error).message}`);
        continue;
      }
      if (!response.ok) {
        console.error(`Asset fetch ${response.status}: ${absolute.slice(0, 80)}`);
        continue;
      }
      const contentType = response.headers.get("content-type");
      if (contentType && !contentType.toLowerCase().startsWith("image/")) {
        console.error(`Asset skipped (content-type: ${contentType}): ${absolute.slice(0, 80)}`);
        continue;
      }
      const ext = extensionFrom(contentType, absolute);
      const filename = `image-${String(index).padStart(3, "0")}${ext}`;
      index += 1;
      const data = new Uint8Array(await response.arrayBuffer());
      rel = `assets/${filename}`;
      seen.set(absolute, rel);
      assets.push({ path: rel, data, contentType: contentType ?? undefined });
    }
    img.setAttribute("src", rel);
    const alt = img.getAttribute("alt")?.trim().toLowerCase();
    if (alt === "image" || alt === "图像" || alt === "图片") {
      img.setAttribute("alt", "");
    }
    img.removeAttribute("srcset");
    img.removeAttribute("data-srcset");
    img.removeAttribute("data-original");
    img.removeAttribute("data-src");
  }

  return { html: document.body.innerHTML, assets };
}
