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
