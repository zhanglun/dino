import { describe, expect, it } from "vitest";

import { htmlToMarkdown } from "../../src/render/markdown.js";

describe("htmlToMarkdown — tables", () => {
  it("converts a headerless multi-row table to a GFM pipe table", () => {
    const html = `<table><tbody><tr><td>序号</td><td>标题</td></tr><tr><td>1</td><td>破题</td></tr></tbody></table>`;
    const md = htmlToMarkdown(html);
    expect(md).toContain("| 序号 | 标题 |");
    expect(md).toContain("| --- | --- |");
    expect(md).toContain("| 1 | 破题 |");
    expect(md).not.toContain("<table");
  });

  it("flattens a single-row headerless table to a paragraph", () => {
    // WeChat uses layout tables like this for numbering blocks / stat cards.
    const html = `<table><tbody><tr><td>1</td><td>破题：一个反直觉的事实</td></tr></tbody></table>`;
    const md = htmlToMarkdown(html);
    expect(md).not.toContain("<table");
    expect(md).toContain("1");
    expect(md).toContain("破题：一个反直觉的事实");
    // Should not emit a pipe-table separator line.
    expect(md).not.toMatch(/\| ---/);
  });

  it("leaves a table with an explicit header unchanged in shape", () => {
    const html = `<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>`;
    const md = htmlToMarkdown(html);
    expect(md).toContain("| A | B |");
    expect(md).toContain("| --- | --- |");
    expect(md).toContain("| 1 | 2 |");
  });

  it("strips inline styles when flattening a real WeChat layout table", () => {
    const html =
      `<table><tbody style="visibility: visible;"><tr style="visibility: visible;">` +
      `<td data-colwidth="77" style="vertical-align: middle; padding-right: 12px;"><span leaf="">1</span></td>` +
      `<td style="vertical-align: middle;"><span style="font-weight: 700;"><span leaf="">破题：一个反直觉的事实</span></span></td>` +
      `</tr></tbody></table>`;
    const md = htmlToMarkdown(html);
    expect(md).not.toContain("<table");
    expect(md).toContain("破题：一个反直觉的事实");
  });
});
