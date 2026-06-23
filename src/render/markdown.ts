import { parseHTML } from "linkedom";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

function normalizeTablesViaLinkedom(html: string): string {
  const { document } = parseHTML(`<!doctype html><html><body>${html}</body></html>`);
  // Re-serialize all tables through linkedom to get a clean structure
  // that Node.js DOMParser (used by turndown) can handle without crashing.
  // Also normalize headerless tables so turndown-plugin-gfm can convert them:
  // the GFM table rule only fires when the first row is <th>. Tables that
  // arrive as pure <td> are otherwise left as raw HTML in the markdown output
  // (and render as escaped strings when the consumer disables inline HTML).
  for (const table of Array.from(document.querySelectorAll("table"))) {
    const el = table as unknown as Element;
    const hasHeader = el.querySelector("thead, th") !== null;
    const rows = Array.from(el.querySelectorAll("tr")) as unknown as Element[];
    if (!hasHeader && rows.length === 1) {
      // A single row without a header is a layout table (e.g. WeChat numbering
      // blocks / stat cards), not tabular data. Flatten to a paragraph so the
      // content reads naturally instead of rendering as a header-only table.
      const cells = (el.querySelectorAll("td, th") as unknown as Element[])
        .map((c) => (c.textContent ?? "").replace(/\s+/g, " ").trim())
        .filter((t) => t.length > 0);
      const p = document.createElement("p");
      p.textContent = cells.join("\u2003");
      el.replaceWith(p);
      continue;
    }
    if (!hasHeader) {
      // Multi-row headerless table: promote the first row's <td> to <th> so
      // the GFM rule treats it as the header row.
      const firstRow = rows[0];
      if (firstRow) {
        for (const cell of Array.from(firstRow.querySelectorAll("td")) as unknown as Element[]) {
          cell.outerHTML = `<th>${cell.innerHTML}</th>`;
        }
      }
    }
    // Re-serialize through a clone to drop layout attributes/styles that can
    // confuse turndown's DOMParser.
    const clone = document.createElement("table");
    clone.innerHTML = el.innerHTML;
    el.replaceWith(clone);
  }
  // Remove any td/th/tr that ended up outside a table after the above pass
  for (const orphan of Array.from(document.querySelectorAll("td, th, tr"))) {
    const el = orphan as unknown as Element;
    if (!el.closest("table")) {
      const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
      if (text) {
        const p = document.createElement("p");
        p.textContent = text;
        el.replaceWith(p);
      } else {
        el.remove();
      }
    }
  }
  return document.body.innerHTML;
}

function normalizeImageReferences(markdown: string): string {
  return markdown.replace(/!\[([^\]]*)\]\(<([^>]+)>\)(?:\{[^}]*\})?/g, (_match, alt: string, url: string) => {
    return `![${alt}](${url})`;
  });
}

function cleanupMarkdown(markdown: string): string {
  return normalizeImageReferences(markdown)
    .replace(/^\s*content_copy\s*$/gim, "")
    .replace(/^●●●\n\n```\n([\s\S]*?)\n```\n\n└$/gm, (_match, code: string) => `\`\`\`\n●●●\n\n${code}\n\n└\n\`\`\``)
    .replace(/\[\s*\]\((?:#|javascript:void\(0\)|javascript:;)\)/gi, "")
    .replace(/(^|[^\\])\$(?=\d)/g, "$1\\$")
    .replace(/\n\s*\n\s*([-*+]\s)/g, "\n$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function htmlFragmentText(fragment: string): string {
  const { document } = parseHTML(`<!doctype html><html><body>${fragment}</body></html>`);
  document.querySelectorAll("br").forEach((br) => br.replaceWith(document.createTextNode("\n")));
  return document.body.textContent ?? "";
}

function fencedCodeHtml(text: string): string {
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<pre><code>${escaped}</code></pre>`;
}

function normalizeTableCellHtml(html: string): string {
  return html
    .replace(/<(t[hd])\b([^>]*)>\s*<section\b[^>]*>([\s\S]*?)<\/section>\s*<\/t[hd]>/gi, "<$1$2>$3</$1>")
    .replace(/Input（<span\b[^>]*class=["']math inline["'][^>]*>\s*\/\s*<em>M<\/em>\s*<em>t<\/em>\s*<em>o<\/em>\s*<em>k<\/em>\s*<em>e<\/em>\s*<em>n<\/em>\s*<em>s<\/em>\s*）\s*\|\s*<em>O<\/em>\s*<em>u<\/em>\s*<em>t<\/em>\s*<em>p<\/em>\s*<em>u<\/em>\s*<em>t<\/em>\s*（<\/span>\s*\/M\s*tokens）/gi, "Input（/M tokens）</th><th style=\"text-align: right;\">Output（/M tokens）")
    .replace(/<th\b[^>]*>\s*<\/th>/gi, "");
}

function normalizeBlockCodeHtml(html: string): string {
  return html.replace(/<code\b[^>]*>(((?:(?!<\/code>)[\s\S])*<br\b(?:(?!<\/code>)[\s\S])*))<\/code>/gi, (_match, codeInnerHtml: string) => {
    return fencedCodeHtml(htmlFragmentText(codeInnerHtml).replace(/\n$/, ""));
  });
}

export function htmlToMarkdown(html: string): string {
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  turndown.use(gfm);
  turndown.addRule("dropEmptyLinks", {
    filter: (node) => node.nodeName === "A" && !node.textContent?.trim(),
    replacement: () => "",
  });
  turndown.addRule("blockCodeElement", {
    filter: (node) => node.nodeName === "CODE" && node.parentNode?.nodeName !== "PRE" && Boolean(node.querySelector?.("br")),
    replacement: (_content, node) => {
      return `\n\n\`\`\`\n${node.textContent?.replace(/\n$/, "") ?? ""}\n\`\`\`\n\n`;
    },
  });
  turndown.addRule("preserveCodeLanguage", {
    filter: (node) => node.nodeName === "PRE" && node.firstChild?.nodeName === "CODE",
    replacement: (_content, node) => {
      const code = node.firstChild as HTMLElement;
      const className = code.getAttribute("class") ?? "";
      const language = className.match(/language-([\w-]+)/)?.[1] ?? "";
      return `\n\n\`\`\`${language}\n${code.textContent?.replace(/\n$/, "") ?? ""}\n\`\`\`\n\n`;
    },
  });
  const normalized = normalizeTablesViaLinkedom(normalizeBlockCodeHtml(normalizeTableCellHtml(html)));
  try {
    return `${cleanupMarkdown(turndown.turndown(normalized))}\n`;
  } catch {
    // Turndown's GFM table plugin crashed on complex table HTML — strip tables and retry
    const { document } = parseHTML(`<!doctype html><html><body>${normalized}</body></html>`);
    for (const table of Array.from(document.querySelectorAll("table"))) {
      const el = table as unknown as Element;
      const div = document.createElement("div");
      div.textContent = (el.textContent ?? "").replace(/\s+/g, " ").trim();
      el.replaceWith(div);
    }
    const fallback = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-" });
    return `${cleanupMarkdown(fallback.turndown(document.body.innerHTML))}\n`;
  }
}
