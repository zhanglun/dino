# CaptureResult 封面图功能设计

## 背景

`capture()` 是 Dino 的库级 API，返回 `CaptureResult`。当前返回 url、title、markdown、author、publishedAt 和 assets（正文图片二进制）。

封面图数据源已存在：`DinoMetadata.image` 通过 Defuddle 或 `og:image` / `twitter:image` meta 标签提取。但 `capture()` 丢弃了该字段，未下载也未暴露给调用方。

## 目标

在 `CaptureResult` 中同时返回封面图的原始 URL 和下载后的二进制资产。

## 数据模型

`CaptureResult` 新增 `coverImage` 字段：

```ts
interface CaptureResult {
  url: string;
  title: string;
  markdown: string;
  author?: string;
  publishedAt?: string;
  coverImage?: string;      // 封面图原始 URL
  assets: CaptureAsset[];   // 含 assets/cover.ext（如果下载成功）
}
```

封面图资产通过现有 `CaptureAsset` 结构承载，路径为 `assets/cover.{ext}`，与正文图片 `assets/image-NNN.*` 不冲突。如果封面图存在且下载成功，插入 `assets[]` 首位。

## 改动范围

仅改动 `src/capture.ts`，新增一个辅助函数 `downloadCoverImage`。

| 文件 | 改动 | 说明 |
|------|------|------|
| `src/capture.ts` | 新增 `downloadCoverImage()`，修改 `capture()` | 下载封面图、填充新字段 |
| `src/index.ts` | 无 | 已导出 `CaptureResult` 类型 |

不改动：`DinoMetadata`、`processItem()`、CLI 管线、`collectImages()`、`renderFrontmatter()`、`src/output.ts`。

## 实现细节

### `downloadCoverImage` 辅助函数

输入：封面图 URL + `imageFetch`（`produced.imageFetch`，可选的 fetch 函数）+ `pageUrl`（页面 URL，用于 Referer）。
输出：`CaptureAsset` 或 `undefined`。

逻辑：
1. 解析 URL 为绝对 URL（已由 metadata 提供时就是绝对的）。
2. 用 `imageFetch ?? fetch` 下载，携带 `Referer: pageUrl` header。
3. 检查 response.ok 和 content-type 是否以 `image/` 开头。
4. 根据 content-type 或 URL 扩展名确定后缀（内联复制 `collect-images.ts` 中 `extensionFrom` 的相同逻辑，保持单文件改动范围）。
5. 返回 `{ path: "assets/cover.{ext}", data: Uint8Array, contentType }`。

### `capture()` 函数变更

在 `produceContent()` 返回后、返回 `CaptureResult` 前：

1. 读取 `produced.metadata.image`。
2. 如果非空，赋值给 `result.coverImage`。
3. 尝试调用 `downloadCoverImage(imageUrl, produced.imageFetch, produced.resolvedUrl)`：
   - 成功 → `result.assets.unshift(asset)`。
   - 失败 → `console.error` 输出到 stderr，不影响整体结果。

### 路径命名

封面图资产路径固定为 `assets/cover.{ext}`。后缀由以下优先级决定：

1. URL pathname 中的扩展名（如 `.png`、`.jpg`）。
2. Content-Type 映射（svg → `.svg`、png → `.png`、webp → `.webp`、gif → `.gif`）。
3. 兜底 `.jpg`。

### 错误处理

- 封面图下载失败**不中断 capture**。`coverImage` URL 仍返回，assets 中不包含封面图。
- URL 无效/为空 → `coverImage` 为 `undefined`，不尝试下载。
- 失败时 `console.error` 输出到 stderr，与现有 asset fetch 错误行为一致。

## 测试

| 场景 | 验证点 |
|------|--------|
| `metadata.image` 有有效 URL | `coverImage` 返回 URL；assets 包含 `assets/cover.*` |
| `metadata.image` 为空 | `coverImage` 为 `undefined`；assets 无 cover |
| 封面图下载失败（网络错误、404） | `coverImage` 有 URL；assets 无 cover；不抛异常 |
| 封面图 content-type 非图片 | 跳过下载；assets 无 cover |
| 扩展名检测 | 根据不同 content-type / URL 后缀生成正确扩展名 |

测试使用 mock fetch，不依赖真实网络请求。

## 不在本次范围

- 在 YAML frontmatter 中写入封面图字段（可作为后续需求）。
- `processItem()` / CLI 管线中处理封面图（CLI 不使用 `CaptureResult`）。
- 封面图去重（正文图片中可能已包含同一张图）。
