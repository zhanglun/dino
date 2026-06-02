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

  it("extracts inline SVG as asset and replaces with img", async () => {
    const result = await collectImages(
      '<p><svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg></p>',
      { baseUrl: "https://example.com/post" },
    );

    expect(result.assets).toHaveLength(1);
    expect(result.assets[0].path).toBe("assets/image-001.svg");
    expect(result.assets[0].contentType).toBe("image/svg+xml");
    expect(result.html).toContain('src="assets/image-001.svg"');
    expect(result.html).not.toContain("<svg");
  });

  it("processes SVG and image together, sharing index counter", async () => {
    const result = await collectImages(
      '<p><svg xmlns="http://www.w3.org/2000/svg"><rect/></svg><img src="/photo.png"></p>',
      {
        baseUrl: "https://example.com/post",
        fetchImage: async () =>
          new Response(new Uint8Array([1, 2]), { headers: { "content-type": "image/png" } }),
      },
    );

    expect(result.assets).toHaveLength(2);
    expect(result.assets[0].path).toBe("assets/image-001.svg");
    expect(result.assets[1].path).toBe("assets/image-002.png");
  });

  it("replaces mjx-container wrapping SVG, not just the SVG itself", async () => {
    const result = await collectImages(
      '<p><mjx-container><svg xmlns="http://www.w3.org/2000/svg"><circle r="5"/></svg></mjx-container></p>',
      { baseUrl: "https://example.com/post" },
    );

    expect(result.assets).toHaveLength(1);
    expect(result.html).not.toContain("mjx-container");
    expect(result.html).not.toContain("<svg");
    expect(result.html).toContain('src="assets/image-001.svg"');
  });

  it("injects xmlns namespace into SVG that lacks it", async () => {
    const result = await collectImages(
      '<p><svg><circle r="5"/></svg></p>',
      { baseUrl: "https://example.com/post" },
    );

    expect(result.assets).toHaveLength(1);
    const svgText = new TextDecoder().decode(result.assets[0].data);
    expect(svgText).toContain('xmlns="http://www.w3.org/2000/svg"');
  });
});
