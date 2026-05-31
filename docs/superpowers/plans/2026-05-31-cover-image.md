# CaptureResult 封面图功能 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `capture()` 返回的 `CaptureResult` 中添加封面图 URL (`coverImage`) 和下载后的二进制资产。

**Architecture:** 在 `src/capture.ts` 中新增 `downloadCoverImage()` 辅助函数，从 `produced.metadata.image` 读取封面图 URL，下载后以 `assets/cover.{ext}` 命名插入 `assets[]` 首位。仅改一个源文件 + 一个测试文件。

**Tech Stack:** TypeScript ESM, Vitest, Node.js fetch API

**Spec:** `docs/superpowers/specs/2026-05-31-cover-image-design.md`

---

## File Structure

| 文件 | 动作 | 职责 |
|------|------|------|
| `src/capture.ts` | 修改 | 新增 `coverImage` 字段 + `downloadCoverImage()` + `capture()` 集成 |
| `tests/capture.test.ts` | 修改 | 新增封面图相关测试用例 |

不变：`src/index.ts`（已导出 `CaptureResult`）、`src/collect-images.ts`、`src/assets.ts`、`src/pipeline.ts`

---

### Task 1: 编写失败测试

**Files:**
- Modify: `tests/capture.test.ts`

在现有测试文件末尾追加以下测试用例。所有测试使用 mock fetch，不依赖网络。

- [ ] **Step 1: 添加封面图测试用例**

在 `tests/capture.test.ts` 的 `describe("capture", ...)` 块内、最后一个 `it(...)` 之后追加：

```ts
it("returns coverImage URL and downloads cover asset when metadata.image is present", async () => {
  const coverUrl = "https://example.com/cover.jpg";
  const result = await capture("https://example.com/covered", {
    staticFetch: async () => `<!doctype html><html><head><title>Covered</title><meta property="og:image" content="${coverUrl}"></head><body><article>${longParagraph()}</article></body></html>`,
    browserFetch: async () => { throw new Error("browser should not be used"); },
    fetchImage: async (url: string) => {
      if (url === coverUrl) {
        return new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "image/jpeg" } });
      }
      return new Response(new Uint8Array([0]), { headers: { "content-type": "image/png" } });
    },
  });

  expect(result.coverImage).toBe(coverUrl);
  expect(result.assets).toHaveLength(1);
  expect(result.assets[0].path).toBe("assets/cover.jpg");
  expect(Array.from(result.assets[0].data)).toEqual([1, 2, 3]);
});

it("returns coverImage as undefined when metadata.image is absent", async () => {
  const result = await capture("https://example.com/nocover", {
    staticFetch: async () => `<!doctype html><html><head><title>No Cover</title></head><body><article>${longParagraph()}</article></body></html>`,
    browserFetch: async () => { throw new Error("browser should not be used"); },
  });

  expect(result.coverImage).toBeUndefined();
});

it("returns coverImage URL but no cover asset when download fails", async () => {
  const coverUrl = "https://example.com/cover-fail.png";
  const result = await capture("https://example.com/fail", {
    staticFetch: async () => `<!doctype html><html><head><title>Fail</title><meta property="og:image" content="${coverUrl}"></head><body><article>${longParagraph()}</article></body></html>`,
    browserFetch: async () => { throw new Error("browser should not be used"); },
    fetchImage: async () => new Response(null, { status: 404 }),
  });

  expect(result.coverImage).toBe(coverUrl);
  expect(result.assets).toHaveLength(0);
});

it("skips cover asset when content-type is not an image", async () => {
  const coverUrl = "https://example.com/not-image";
  const result = await capture("https://example.com/badct", {
    staticFetch: async () => `<!doctype html><html><head><title>Bad CT</title><meta property="og:image" content="${coverUrl}"></head><body><article>${longParagraph()}</article></body></html>`,
    browserFetch: async () => { throw new Error("browser should not be used"); },
    fetchImage: async () => new Response("not an image", { headers: { "content-type": "text/html" } }),
  });

  expect(result.coverImage).toBe(coverUrl);
  expect(result.assets).toHaveLength(0);
});

it("detects extension from URL when content-type is missing", async () => {
  const coverUrl = "https://cdn.example.com/banner.webp";
  const result = await capture("https://example.com/webp", {
    staticFetch: async () => `<!doctype html><html><head><title>WebP</title><meta property="og:image" content="${coverUrl}"></head><body><article>${longParagraph()}</article></body></html>`,
    browserFetch: async () => { throw new Error("browser should not be used"); },
    fetchImage: async () => new Response(new Uint8Array([4, 5, 6])),
  });

  expect(result.coverImage).toBe(coverUrl);
  expect(result.assets[0].path).toBe("assets/cover.webp");
});

it("places cover asset before body image assets", async () => {
  const coverUrl = "https://example.com/hero.png";
  const result = await capture("https://example.com/both", {
    staticFetch: async () => `<!doctype html><html><head><title>Both</title><meta property="og:image" content="${coverUrl}"></head><body><article>${longParagraph()}<img src="/body.png"></article></body></html>`,
    browserFetch: async () => { throw new Error("browser should not be used"); },
    fetchImage: async (url: string) => {
      if (url === coverUrl) {
        return new Response(new Uint8Array([10, 11]), { headers: { "content-type": "image/png" } });
      }
      return new Response(new Uint8Array([20, 21]), { headers: { "content-type": "image/png" } });
    },
  });

  expect(result.assets).toHaveLength(2);
  expect(result.assets[0].path).toBe("assets/cover.png");
  expect(result.assets[1].path).toBe("assets/image-001.png");
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx vitest run tests/capture.test.ts`
Expected: 新测试全部 FAIL（`coverImage` 属性不存在于 `CaptureResult`，`downloadCoverImage` 不存在）

---

### Task 2: 实现 downloadCoverImage 辅助函数

**Files:**
- Modify: `src/capture.ts`

- [ ] **Step 1: 在 capture.ts 中添加 extensionFrom 内联辅助函数**

在现有 `import` 块之后、`CaptureAsset` 接口之前，添加 `extname` 导入和 `extensionFrom` 函数：

在文件顶部 import 区追加：
```ts
import { extname } from "node:path";
```

在 `CaptureAsset` 接口之前添加：
```ts
/** 扩展名检测 — 与 collect-images.ts / assets.ts 的同名函数逻辑平行。 */
function extensionFrom(contentType: string | null, url: string): string {
  const pathExt = extname(new URL(url).pathname).replace(/[^.a-z0-9]/gi, "");
  if (pathExt && pathExt.length <= 8) return pathExt;
  if (contentType?.includes("svg")) return ".svg";
  if (contentType?.includes("png")) return ".png";
  if (contentType?.includes("webp")) return ".webp";
  if (contentType?.includes("gif")) return ".gif";
  return ".jpg";
}
```

- [ ] **Step 2: 添加 downloadCoverImage 函数**

在 `CaptureOptions` 接口之后、`capture()` 函数之前添加：

```ts
/**
 * 下载封面图到内存。失败时返回 undefined 并向 stderr 输出错误。
 * @param imageUrl 封面图绝对 URL
 * @param imageFetch 可选的 fetch 函数（优先使用 produceContent 注入的）
 * @param pageUrl 页面 URL，用作 Referer
 */
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
```

- [ ] **Step 3: 运行 typecheck 确认无类型错误**

Run: `npx tsc --noEmit`
Expected: PASS（函数尚未被调用，但类型应正确）

---

### Task 3: 集成到 CaptureResult 和 capture()

**Files:**
- Modify: `src/capture.ts`

- [ ] **Step 1: 在 CaptureResult 接口添加 coverImage 字段**

在 `publishedAt?: string;` 之后、`assets: CaptureAsset[];` 之前添加：

```ts
  coverImage?: string;      // 封面图原始 URL
```

完整的 `CaptureResult` 接口应为：
```ts
export interface CaptureResult {
  url: string;
  title: string;
  markdown: string;
  author?: string;
  publishedAt?: string;
  coverImage?: string;      // 封面图原始 URL
  assets: CaptureAsset[];   // 含 assets/cover.ext（如果下载成功）
}
```

- [ ] **Step 2: 修改 capture() 函数，添加封面图逻辑**

将 `capture()` 函数体中 `const collected = ...` 到 `return {...}` 之间的代码替换为：

```ts
  const collected = await collectImages(produced.cleanedHtml, {
    baseUrl: produced.resolvedUrl,
    fetchImage: produced.imageFetch,
  });
  const markdown = demoteTopLevelHeadings(
    stripLeadingDateLine(
      stripDuplicateLeadingHeading(htmlToMarkdown(collected.html), produced.title),
    ),
  );

  // 封面图处理
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
```

- [ ] **Step 3: 运行 typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: 运行全部测试**

Run: `npx vitest run tests/capture.test.ts`
Expected: 所有测试 PASS

---

### Task 4: 全量验证

- [ ] **Step 1: 运行完整测试套件**

Run: `npm test`
Expected: 所有测试 PASS（无回归）

- [ ] **Step 2: 运行 typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: 运行 build**

Run: `npm run build`
Expected: 构建成功，无错误
