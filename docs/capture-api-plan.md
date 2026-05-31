# Dino 库入口 `capture()` 实现计划

> **致执行者：** 逐任务实现，每步用 checkbox（`- [ ]`）追踪。**铁律：dino 现有 59 个测试必须始终全绿**，任何一步导致回归即停下修复。

**目标：** 给 dino 增加一个中立的库入口 `import { capture } from "dino"`，给定 URL 返回一份不落盘的内容数据（markdown + 图片二进制），不改变现有 CLI 与 `processItem` 的任何行为。

**定位：** dino 是独立的 Capture Engine。`capture()` 产出 dino 视角下「一篇网页的干净数据」，不含任何下游（amber/R2/占位符）概念。任何消费者都能用。

**改造范围（只扩展，不重构现有路径）：**
1. 抽 `produceContent`：复用 `processItem` 前半段纯数据生产（fetch→clean→title→created），不含落盘。
2. 新增 `collectImages`：内存版图片本地化（仅 `<img>`），下载到内存而非写盘。
3. 新增并导出 `capture()` + `package.json` 的 `exports`。

**不做：** 不改 `localizeImages`（svg/video 分支测试不足，重构风险 > 收益）；不改 CLI；不处理批量/RSS（留 CLI 层）；v1 `capture()` 只收集 `<img>`。

**参考：** [架构与流程](./architecture.md)

---

## CaptureResult 契约（中立，无下游概念）

```ts
export interface CaptureResult {
  url: string;          // 抓取后的最终 URL（重定向后）
  title: string;
  markdown: string;     // 图片引用为 assets 项的 path，如 ![](assets/image-001.png)
  author?: string;
  publishedAt?: string; // ISO 8601，可能没有
  assets: CaptureAsset[];
}

export interface CaptureAsset {
  path: string;         // markdown 中的引用路径，如 "assets/image-001.png"
  data: Uint8Array;     // 图片二进制（运行时可能是 Buffer）
  contentType?: string; // 如 "image/png"，可能没有
}

export interface CaptureOptions {
  fetchMode?: "auto" | "static" | "browser" | "stealth"; // 默认 auto
}
```

---

## 基线：确认安全网

- [ ] **步骤 0：确认现有测试全绿、工作树干净**

执行：`cd /Users/zhanglun/Documents/mine/dino && git status --short && npx vitest run`
预期：工作树干净；`Test Files 10 passed`、`Tests 59 passed`。
若非全绿，先停下查清，不要在红的基线上改。

---

## 任务 1：抽出 `produceContent`（纯数据生产，行为不变）

把 `processItem` 中「fetch → cleanHtml → requireText 检查 → 定 title → 定 created」这段纯数据生产抽成独立函数。`cleanupExistingNote`（落盘副作用）**保留在 `processItem` 内，不进 `produceContent`**。

**文件：**
- 修改：`src/pipeline.ts`

- [ ] **步骤 1：在 `pipeline.ts` 新增 `ProducedContent` 类型与 `produceContent` 函数**

在 `processItem` 之前插入：

```ts
export interface ProducedContent {
  resolvedUrl: string;
  title: string;
  created: string;
  cleanedHtml: string;
  metadata: import("./cleaning/types.js").DinoMetadata;
  imageFetch?: typeof fetch;
}

/** 纯数据生产：抓取 + 清洗 + 元数据 + 标题/created。无落盘副作用。 */
async function produceContent(item: UrlItem, options: ProcessItemOptions): Promise<ProducedContent> {
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
```

- [ ] **步骤 2：改写 `processItem` 复用 `produceContent`，其余逐字节保留**

将 `processItem` 函数体替换为：

```ts
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
```

> 注意：逐字节对照原实现，确保 `cleanupExistingNote` → `localizeImages` → `htmlToMarkdown` + 三个文本清理 → `writeMarkdownNote` 的调用参数与顺序完全不变。`noteBase` 由 `sanitizeFilename(title)`（datePrefix 时加日期前缀）推导，与原逻辑一致。本步只是把「fetch→clean→title→created」搬进 `produceContent`，落盘段保持原样。

- [ ] **步骤 3：跑全量测试，确认零回归**

执行：`npx vitest run`
预期：`Tests 59 passed`。**若有任何失败，说明重构改变了行为，回退本步重做。**

- [ ] **步骤 4：提交**

```bash
git add -A
git commit -m "refactor(pipeline): extract produceContent for reuse by library API"
```

---

## 任务 2：`collectImages`（内存版图片本地化，仅 img）

新增一个不落盘的图片收集函数：遍历 `<img>`，下载到内存，改写正文中的图片引用为 `assets/image-NNN.ext`，返回改写后的 HTML 与图片二进制数组。镜像 `localizeImages` 的 img 命名/去重逻辑，但不碰磁盘、不碰 `localizeImages` 本体。

**文件：**
- 创建：`src/collect-images.ts`
- 创建：`tests/collect-images.test.ts`

- [ ] **步骤 1：编写失败的测试 `tests/collect-images.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { collectImages } from "../src/collect-images.js";

describe("collectImages", () => {
  it("downloads images once, rewrites src to assets path, returns bytes", async () => {
    let calls = 0;
    const result = await collectImages(
      '<p><img src="/demo.png"><img src="https://example.com/demo.png"></p>',
      {
        baseUrl: "https://example.com/post",
        fetchImage: async () => {
          calls += 1;
          return new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "image/png" } });
        },
      },
    );

    expect(calls).toBe(1); // 同一绝对 URL 去重
    expect(result.html).toContain('src="assets/image-001.png"');
    expect(result.assets).toHaveLength(1);
    expect(result.assets[0].path).toBe("assets/image-001.png");
    expect(result.assets[0].contentType).toBe("image/png");
    expect(Array.from(result.assets[0].data)).toEqual([1, 2, 3]);
  });

  it("uses lazy attributes and skips non-image responses", async () => {
    const result = await collectImages(
      '<p><img data-src="/lazy.webp" srcset="/old.png 1x"><img src="/not-image"></p>',
      {
        baseUrl: "https://example.com/post",
        fetchImage: async (input) => {
          if (String(input).endsWith("/not-image")) {
            return new Response("nope", { headers: { "content-type": "text/plain" } });
          }
          return new Response(new Uint8Array([4, 5, 6]), { headers: { "content-type": "image/webp" } });
        },
      },
    );

    expect(result.html).toContain('src="assets/image-001.webp"');
    expect(result.html).not.toContain("data-src");
    expect(result.html).not.toContain("srcset");
    expect(result.assets).toHaveLength(1);
    expect(result.assets[0].path).toBe("assets/image-001.webp");
  });

  it("keeps the original remote src when download fails, with no asset collected", async () => {
    const result = await collectImages(
      '<p><img src="https://cdn.example.com/unreachable.jpg"></p>',
      {
        baseUrl: "https://example.com/post",
        fetchImage: async () => { throw new TypeError("fetch failed"); },
      },
    );

    expect(result.html).toContain('src="https://cdn.example.com/unreachable.jpg"');
    expect(result.assets).toHaveLength(0);
  });

  it("returns html unchanged and no assets when there are no images", async () => {
    const result = await collectImages("<p>plain</p>", { baseUrl: "https://example.com/post" });
    expect(result.html).toBe("<p>plain</p>");
    expect(result.assets).toHaveLength(0);
  });
});
```

- [ ] **步骤 2：运行测试，确认失败**

执行：`npx vitest run tests/collect-images.test.ts`
预期：失败 —— 找不到模块 `../src/collect-images.js`。

- [ ] **步骤 3：实现 `src/collect-images.ts`**

```ts
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

// 与 assets.ts 的 extensionFrom 平行；未来应提取共享（见 docs/architecture.md 技术债）。
function extensionFrom(contentType: string | null, url: string): string {
  const pathExt = extname(new URL(url).pathname).replace(/[^.a-z0-9]/gi, "");
  if (pathExt && pathExt.length <= 8) return pathExt;
  if (contentType?.includes("svg")) return ".svg";
  if (contentType?.includes("png")) return ".png";
  if (contentType?.includes("webp")) return ".webp";
  if (contentType?.includes("gif")) return ".gif";
  return ".jpg";
}

// 与 assets.ts 的 imageSource 平行。
function imageSource(img: Element): string | null {
  const direct = img.getAttribute("data-original") || img.getAttribute("data-src") || img.getAttribute("src");
  if (direct) return direct;
  const srcset = img.getAttribute("data-srcset") || img.getAttribute("srcset");
  const first = srcset?.split(",").map((part) => part.trim().split(/\s+/)[0]).find(Boolean);
  return first || null;
}

/**
 * 内存版图片本地化（仅 <img>）。下载到内存而非磁盘，改写 src 为 assets/image-NNN.ext。
 * 注意：与 assets.ts 的 localizeImages 的 img 分支逻辑平行，未来应提取共享核心。
 * v1 不处理 svg / video（见 docs/architecture.md）。
 */
export async function collectImages(
  html: string,
  options: CollectImagesOptions,
): Promise<CollectImagesResult> {
  const { document } = parseHTML(`<!doctype html><html><body>${html}</body></html>`);
  const images = Array.from(document.querySelectorAll("img"));
  if (images.length === 0) return { html, assets: [] };

  const fetchImage = options.fetchImage ?? ((url: string) => fetch(url, { headers: { Referer: options.baseUrl } }));
  const seen = new Map<string, string>();
  const assets: CollectedAsset[] = [];
  let index = 1;

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
```

- [ ] **步骤 4：运行测试，确认通过**

执行：`npx vitest run tests/collect-images.test.ts`
预期：4 个测试通过。

- [ ] **步骤 5：跑全量测试，确认未影响现有功能**

执行：`npx vitest run`
预期：`Tests 63 passed`（原 59 + 新 4）。

- [ ] **步骤 6：提交**

```bash
git add -A
git commit -m "feat(assets): add in-memory collectImages (img only) for library API"
```

---

## 任务 3：`capture()` 库函数 + 导出

组装 `capture()`：`produceContent` → `collectImages`（内存）→ `htmlToMarkdown` + 文本清理 → `CaptureResult`。导出类型与函数。

**文件：**
- 创建：`src/capture.ts`
- 创建：`tests/capture.test.ts`
- 修改：`src/pipeline.ts`（导出 `produceContent`，供 capture 复用）

- [ ] **步骤 1：在 `pipeline.ts` 把 `produceContent` 与 `ProducedContent` 改为导出**

将任务 1 中 `async function produceContent` 改为 `export async function produceContent`，`interface ProducedContent` 改为 `export interface ProducedContent`。

执行：`npx vitest run`
预期：仍 `Tests 63 passed`（仅加 export，不改逻辑）。

- [ ] **步骤 2：编写失败的测试 `tests/capture.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { capture } from "../src/capture.js";

function longParagraph(): string {
  return `<p>${"This is meaningful article text, ".repeat(80)}</p>`;
}

describe("capture", () => {
  it("returns markdown + metadata without touching disk", async () => {
    const result = await capture("https://example.com/demo", {
      staticFetch: async () => `<!doctype html><html><head><title>Demo Article</title><meta name="author" content="Ada"></head><body><article><h1>Demo Article</h1>${longParagraph()}</article></body></html>`,
      browserFetch: async () => { throw new Error("browser should not be used"); },
    });

    expect(result.title).toBe("Demo Article");
    expect(result.author).toBe("Ada");
    expect(result.url).toBe("https://example.com/demo");
    expect(result.markdown).toContain("meaningful article text");
    expect(result.assets).toEqual([]);
  });

  it("collects images into memory and rewrites markdown to assets path", async () => {
    const result = await capture("https://example.com/withimg", {
      staticFetch: async () => `<!doctype html><html><head><title>Img Post</title></head><body><article>${longParagraph()}<img src="/photo.png"></article></body></html>`,
      browserFetch: async () => { throw new Error("browser should not be used"); },
      fetchImage: async () => new Response(new Uint8Array([7, 8, 9]), { headers: { "content-type": "image/png" } }),
    });

    expect(result.markdown).toContain("assets/image-001.png");
    expect(result.assets).toHaveLength(1);
    expect(result.assets[0].path).toBe("assets/image-001.png");
    expect(Array.from(result.assets[0].data)).toEqual([7, 8, 9]);
  });
});
```

> 说明：`capture` 的 options 透传 `staticFetch`/`browserFetch`/`fetchImage` 等给底层（与 `processItem` 同样的可注入点），因此测试无需网络。

- [ ] **步骤 3：运行测试，确认失败**

执行：`npx vitest run tests/capture.test.ts`
预期：失败 —— 找不到模块 `../src/capture.js`。

- [ ] **步骤 4：实现 `src/capture.ts`**

```ts
import { collectImages } from "./collect-images.js";
import { makeUrlItem } from "./models.js";
import { produceContent, type ProcessItemOptions } from "./pipeline.js";
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
  const markdown = htmlToMarkdown(collected.html);
  return {
    url: produced.resolvedUrl,
    title: produced.title,
    markdown,
    author: produced.metadata.author,
    publishedAt: produced.metadata.published,
    assets: collected.assets.map((a) => ({ path: a.path, data: a.data, contentType: a.contentType })),
  };
}
```

> 说明：`produceContent` 的入参类型是 `ProcessItemOptions`（含 `outputDir`）。`capture` 不落盘，但 `produceContent` 不读 `outputDir`（落盘发生在它之外），故传 `outputDir: ""` 安全。`markdown` 这里只做 `htmlToMarkdown`，未套用 `processItem` 里的 `demoteTopLevelHeadings/stripLeadingDateLine/stripDuplicateLeadingHeading` 文本清理——见步骤 5 决策点。

- [ ] **步骤 5：决定是否套用文本清理（与 processItem 对齐）**

`processItem` 对 markdown 额外做了 `demoteTopLevelHeadings(stripLeadingDateLine(stripDuplicateLeadingHeading(...)))`。为使 `capture()` 产出与 dino 落盘文件的正文一致，应同样套用。修改 `capture.ts` 的 markdown 行为：

```ts
import { demoteTopLevelHeadings, stripDuplicateLeadingHeading, stripLeadingDateLine } from "./pipeline.js";
// ...
const markdown = demoteTopLevelHeadings(stripLeadingDateLine(stripDuplicateLeadingHeading(htmlToMarkdown(collected.html), produced.title)));
```

为此需在 `pipeline.ts` 把这三个函数改为 `export function`。然后跑全量测试确认现有行为不变。

执行：`npx vitest run`
预期：仍全绿（仅加 export）。

- [ ] **步骤 6：运行 capture 测试，确认通过**

执行：`npx vitest run tests/capture.test.ts`
预期：2 个测试通过。

- [ ] **步骤 7：跑全量测试**

执行：`npx vitest run`
预期：`Tests 65 passed`（63 + 2）。

- [ ] **步骤 8：提交**

```bash
git add -A
git commit -m "feat: add capture() library function returning in-memory content data"
```

---

## 任务 4：导出库入口（package.json exports）

让 `import { capture } from "dino"` 可用，同时不破坏 CLI 的 `bin`。

**文件：**
- 创建：`src/index.ts`
- 修改：`package.json`

- [ ] **步骤 1：创建 `src/index.ts`（库 barrel）**

```ts
export { capture } from "./capture.js";
export type { CaptureAsset, CaptureOptions, CaptureResult } from "./capture.js";
```

- [ ] **步骤 2：在 `package.json` 增加 `exports` 与 `module`，保留 `bin`**

在 `package.json` 中加入（与现有字段并列；`bin` 保持不变）：

```json
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
```

并把 `"files"` 数组确保包含 `dist`（已包含）。`build` 脚本需把 `src/index.ts` 一并打包——更新：

```json
    "build": "tsup src/cli.ts src/index.ts --format esm --dts --clean && rm -rf dist/site-rules && cp -R src/site-rules dist/site-rules",
```

> dino 现状构建工具是 **tsup**（实测 package.json）。本次改造**沿用 tsup，不切换构建工具**（换工具是无关变更、徒增风险）。改动仅是把 `src/index.ts` 加为第二个入口。

- [ ] **步骤 3：构建并验证库入口可被解析**

执行：`npm run build && node -e "import('./dist/index.js').then(m=>console.log('exports:', Object.keys(m)))"`
预期：输出包含 `capture`。

- [ ] **步骤 4：跑全量测试，确认 CLI 与现有行为未受影响**

执行：`npx vitest run`
预期：`Tests 65 passed`。

- [ ] **步骤 5：提交**

```bash
git add -A
git commit -m "feat: expose capture() as dino library entry via package exports"
```

---

## 任务 5：真实 URL 端到端验证

- [ ] **步骤 1：用真实页面跑 `capture()`，确认返回真实数据**

创建临时脚本 `try-capture.mts`（放项目根，跑完即删；dino 无 scripts/ 目录，tsconfig 也不含它，故不放 scripts/）：

```ts
import { capture } from "./src/capture.js";

const url = process.argv[2] ?? "https://en.wikipedia.org/wiki/Markdown";
const res = await capture(url, { fetchMode: "static" });
console.log("url:", res.url);
console.log("title:", res.title);
console.log("author:", res.author);
console.log("publishedAt:", res.publishedAt);
console.log("markdown length:", res.markdown.length);
console.log("assets:", res.assets.map((a) => `${a.path} (${a.contentType}, ${a.data.length}B)`));
console.log("markdown head:\n", res.markdown.slice(0, 300));
```

执行：`npx tsx try-capture.mts "https://en.wikipedia.org/wiki/Markdown"`
预期：打印出 title=Markdown、若干 assets、markdown 正文开头；assets 的 path 与 markdown 中的 `assets/image-NNN` 引用一致。

- [ ] **步骤 2：清理临时脚本**

```bash
rm try-capture.mts
```

- [ ] **步骤 3：（可选）更新 README 增加库用法片段**

在 dino README 增加：

````markdown
## 作为库使用

```ts
import { capture } from "dino";

const result = await capture("https://example.com/article");
// result.markdown / result.assets[{ path, data, contentType }]
```
````

- [ ] **步骤 4：提交**

```bash
git add -A
git commit -m "docs: document capture() library usage"
```

---

## 验收

- [ ] `import { capture } from "dino"` 可用，返回 `CaptureResult`。
- [ ] `capture()` 不写任何文件（全内存）。
- [ ] dino 现有 CLI 与 `processItem` 行为不变（65 测试全绿，原 59 个无回归）。
- [ ] 真实 URL 跑通：markdown 中的图片引用与 `assets[].path` 一致。
- [ ] dino 保持中立：`CaptureResult` 不含任何 amber/R2/占位符概念。
