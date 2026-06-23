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

  it("returns coverImage URL and downloads cover asset when metadata.image is present", async () => {
    const coverUrl = "https://example.com/cover.jpg";
    const result = await capture("https://example.com/covered", {
      staticFetch: async () => `<!doctype html><html><head><title>Covered</title><meta property="og:image" content="${coverUrl}"></head><body><article>${longParagraph()}</article></body></html>`,
      browserFetch: async () => { throw new Error("browser should not be used"); },
      fetchImage: async (url) => {
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
      fetchImage: async (url) => {
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
});
