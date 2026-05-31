<div align="center">
  <img src="assets/logo.png" alt="Dino logo" width="160" style="display: block; margin: 0 auto;">
  <h1 style="margin-top: 8px; margin-bottom: 8px;">Dino</h1>
  <p><strong>Archive long-form web content as clean Markdown with local assets.</strong></p>
  <p>
    <img alt="Node 24 or newer" src="https://img.shields.io/badge/node-24%2B-339933">
    <img alt="MIT license" src="https://img.shields.io/badge/license-MIT-blue">
  </p>
</div>

> **This project is a personal fork of [Feedloom](https://github.com/ariesfish/feedloom) (MIT License), extended with additional features for personal use. Original copyright belongs to the Feedloom authors. This project is distributed under the same MIT License.**

Dino is a CLI for saving long-form web content as clean Markdown. It accepts article URLs, URL list files, and RSS/Atom feeds, extracts readable content, downloads page images, and writes portable Markdown notes with YAML frontmatter.

## Features

- Save articles as Markdown with local image assets.
- Read URLs directly, from text/Markdown files, or from RSS/Atom feeds.
- Deduplicate URL lists and mark completed Markdown checklist items.
- Use static, browser-rendered, or stealth fetching when pages need JavaScript rendering.
- Apply built-in site rules for common sites such as WeChat, Xiaohongshu, and Zhihu.
- Optionally use local Chrome login state for pages that require your own authenticated browser session.
- Date-prefixed output folders (`YYYY-MM-DD-{title}`) for better chronological organization.

## Requirements

- Node.js >= 24
- npm
- Patchright Chromium for browser-based fetching. `doctor` can install it automatically.

## Development setup

Clone and install dependencies:

```bash
git clone https://github.com/zhanglun/dino.git
cd dino
npm install
```

Run the CLI without building:

```bash
npm run dev -- "https://example.com/article"
```

Check and repair the browser runtime:

```bash
npm run dev -- doctor
```

If the Patchright Chromium executable is missing, `doctor` runs `npx patchright install chromium` automatically.

## Quick start

Archive one article to `clippings/`:

```bash
npm run dev -- "https://example.com/article"
```

Write output somewhere else:

```bash
npm run dev -- --output-dir ./outputs "https://example.com/article"
```

Archive a URL list:

```bash
npm run dev -- urls.md --limit 10
```

`urls.md` can be a plain link list or a Markdown checklist:

```markdown
- [ ] https://example.com/a
- [ ] https://example.com/b
```

Successfully processed items are marked done:

```markdown
- [x] https://example.com/a
```

Archive an RSS/Atom feed:

```bash
npm run dev -- "https://example.com/feed.xml" --source-kind rss-feed --since 2026-01-01
```

Use browser rendering for JavaScript-heavy pages:

```bash
npm run dev -- "https://example.com/article" --fetch-mode browser --wait-ms 4000 --scroll-to-bottom
```

Use stealth mode only when normal static/browser fetching is insufficient:

```bash
npm run dev -- "https://example.com/article" --fetch-mode stealth --solve-cloudflare
```

## Command Reference

### Subcommands

| Command | Description |
| --- | --- |
| `dino <url\|file...>` | Default. Process URLs, URL list files, or RSS feeds. |
| `dino init [--global]` | Create a `.dino.json` config file interactively. `--global` saves to `~/.dino.json`. |
| `dino doctor` | Check runtime dependencies (Patchright Chromium etc.) and auto-install if missing. |

### Input Control

| Option | Description |
| --- | --- |
| `--stdin` | Read text from stdin and extract URLs from it. |
| `--source-kind <kind>` | Input type: `auto`, `html-page`, or `rss-feed`. Default `auto`. |
| `--since <date>` | Only process feed entries on or after `YYYY-MM-DD`. |
| `--limit <n>` | Process at most N URLs. |
| `--start <n>` / `--end <n>` | Slice the deduplicated URL list by 1-based index. |

### Output Control

| Option | Description |
| --- | --- |
| `--output-dir <dir>` | Output directory. Default `clippings`. |
| `--date-prefix` | Prepend `YYYY-MM-DD-` to output folder names. |
| `--site-rules-dir <dir>` | Directory for private TOML site extraction/cleaning rules. |

### Fetch Control

| Option | Description |
| --- | --- |
| `--fetch-mode <mode>` | `auto`, `static`, `browser`, or `stealth`. |
| `--wait-ms <ms>` | Extra wait after page load in browser mode. Default 2500. |
| `--no-network-idle` | Do not wait for browser networkidle before reading HTML. |
| `--wait-selector <sel>` | Wait for a CSS selector after page load. |
| `--wait-selector-state <state>` | `attached`, `detached`, `visible`, or `hidden`. Default `attached`. |
| `--click-selector <sel...>` | Click one or more selectors after page load. |
| `--scroll-to-bottom` | Scroll to the bottom before reading HTML. |

### Browser State

| Option | Description |
| --- | --- |
| `--prefer-browser-state` | Prefer local Chrome login state for browser fetch. |
| `--chrome-user-data-dir <path>` | Chrome user data directory. |
| `--chrome-profile <name>` | Chrome profile directory name. Default `Default`. |
| `--headful` | Show the browser window (for debugging). |

### Network & Proxy

| Option | Description |
| --- | --- |
| `--proxy <server>` | Proxy server address. |
| `--dns-over-https` | Enable Chromium Cloudflare DNS-over-HTTPS. |

### Advanced

| Option | Description |
| --- | --- |
| `--solve-cloudflare` | In stealth mode, handle Cloudflare Turnstile/interstitial challenges. |
| `--disable-resources` | In stealth mode, block images/media/fonts/stylesheets for speed. |
| `--no-real-chrome-defaults` | Disable Scrapling-style real Chrome context defaults. |
| `--no-reuse-browser` | Disable browser context reuse during batch processing. |

## Configuration

Create a `.dino.json` config file interactively:

```bash
npm run dev -- init
```

Supported fields:

```json
{
  "outputDir": "~/Documents/clippings",
  "fetchMode": "auto",
  "waitMs": 2500,
  "proxy": "http://127.0.0.1:8080",
  "siteRulesDir": "./site-rules",
  "datePrefix": true
}
```

Setting `datePrefix: true` prepends `YYYY-MM-DD-` to each output folder name.

## Library Usage

Dino can also be used as a Node.js library:

```ts
import { capture } from "dino";

const result = await capture("https://example.com/article", {
  fetchMode: "static",
});

console.log(result.title);    // "Article Title"
console.log(result.markdown); // Full Markdown content
console.log(result.assets);   // [{ path: "assets/image.jpg", data: Uint8Array, ... }]
```

`capture()` returns a `CaptureResult` without writing to disk:

```ts
interface CaptureResult {
  url: string;            // Final URL (may have been redirected)
  title: string;          // Article title
  markdown: string;       // Converted Markdown
  author?: string;        // Author
  publishedAt?: string;   // Publication date
  assets: CaptureAsset[]; // Image binary data
}

interface CaptureAsset {
  path: string;           // Suggested relative path
  data: Uint8Array;       // Image binary
  contentType?: string;   // MIME type
}
```

`CaptureOptions` fields:

| Field | Type | Description |
| --- | --- | --- |
| `fetchMode` | `"auto" \| "static" \| "browser" \| "stealth"` | Fetch mode. Default `auto`. |

## Output

Notes are written to `clippings/` by default. Each article gets its own folder:

```
clippings/
  2026-04-29-Article Title/
    content.md
    assets/
      image.jpg
```

Generated Markdown looks like:

```markdown
---
source: "https://example.com/article"
title: "Article Title"
author: "Author Name"
created: "2026-04-29"
---

# Article Title

Article content...
```

## Fetch modes

| Mode | Use when |
| --- | --- |
| `auto` | Default. Try static fetch first, then browser/stealth fallback when content is insufficient. |
| `static` | The page is server-rendered and does not require JavaScript. |
| `browser` | The page needs JavaScript rendering, waiting, clicking, or scrolling. |
| `stealth` | Browser mode fails because the site has stronger bot detection. |

## Site rules

Dino ships built-in TOML site rules for common dynamic or structured sites. You can also keep private rules outside the package and pass them at runtime:

```bash
npm run dev -- "https://example.com/article" --site-rules-dir ./site-rules
```

## Acknowledgements

Dino is a fork of [Feedloom](https://github.com/ariesfish/feedloom), extended with additional features. It is also inspired by:

- [Defuddle](https://github.com/kepano/defuddle), for readable content extraction ideas.
- [Patchright](https://github.com/Kaliiiiiiiiii-Vinyzu/patchright), for browser automation and realistic page access.
- [Scrapling](https://github.com/D4Vinci/Scrapling), for resilient scraping fallback ideas.

## License

MIT License
