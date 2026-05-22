#!/usr/bin/env node

import { readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

import { Command } from "commander";

import { loadSiteProfiles } from "./cleaning/profiles.js";
import { globalConfigPath, loadConfig, localConfigPath, saveConfig, type DinoConfig } from "./config.js";
import { formatDoctorResult, runDoctor } from "./doctor.js";
import { BatchFetchSessions } from "./fetch/batch.js";
import { parseInputs, sliceItems } from "./input/inputs.js";
import { expandSourceItems, parseSinceDate, type SourceKind } from "./input/sources.js";
import { ConflictCancelledError, type ConflictResolution } from "./output.js";
import { processItem } from "./pipeline.js";
import { ProgressTracker } from "./tracking.js";

async function promptConflict(conflictDir: string): Promise<ConflictResolution> {
  if (!process.stdin.isTTY) {
    console.error(`Conflict: ${conflictDir} already exists — skipping (non-interactive)`);
    return "cancel";
  }
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  try {
    const answer = await rl.question(`\nConflict: ${conflictDir} already exists\n[o] Overwrite  [a] Add as new  [c] Cancel > `);
    const choice = answer.trim().toLowerCase();
    if (choice === "o" || choice === "overwrite") return "overwrite";
    if (choice === "a" || choice === "add") return "add";
    return "cancel";
  } finally {
    rl.close();
  }
}

const require = createRequire(import.meta.url);
const packageJson = require("../package.json") as { version?: string };

const program = new Command();

async function siteRulePathsFromDir(dir: string): Promise<string[]> {
  const names = await readdir(dir);
  return names.filter((name) => name.endsWith(".toml")).sort().map((name) => join(dir, name));
}

function builtinSiteRulesDir(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "site-rules");
}

function expandTilde(p: string): string {
  if (p === "~") return homedir();
  if (p.startsWith("~/") || p.startsWith("~\\")) return join(homedir(), p.slice(2));
  return p;
}

function positiveIntOption(value: unknown, fallback: number): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed)) {
    throw new Error(`Expected integer option, got ${String(value)}`);
  }
  return parsed;
}

program
  .name("dino")
  .description("Archive long-form web content as clean Markdown with local assets")
  .version(packageJson.version ?? "0.0.0")
  .helpCommand("help [command]", "Display help for dino or a specific command");

program
  .command("doctor")
  .description("Check dino runtime dependencies")
  .action(async () => {
    const result = await runDoctor();
    console.error(formatDoctorResult(result));
    process.exitCode = result.ok ? 0 : 1;
  });

program
  .command("init")
  .description("Create a .dino.json config file interactively")
  .option("--global", "Save to ~/.dino.json instead of ./.dino.json", false)
  .action(async (opts: { global: boolean }) => {
    const rl = createInterface({ input: process.stdin, output: process.stderr });
    const ask = async (question: string, fallback: string): Promise<string> => {
      const answer = await rl.question(`${question} [${fallback}]: `);
      return answer.trim() || fallback;
    };

    try {
      console.error("Dino config setup (press Enter to keep default)\n");
      const config: DinoConfig = {};

      const outputDir = await ask("Output directory", "clippings");
      if (outputDir !== "clippings") config.outputDir = outputDir;

      const fetchMode = await ask("Fetch mode (auto/static/browser/stealth)", "auto");
      if (fetchMode !== "auto" && ["static", "browser", "stealth"].includes(fetchMode)) {
        config.fetchMode = fetchMode as DinoConfig["fetchMode"];
      }

      const waitMsStr = await ask("Browser wait time (ms)", "2500");
      const waitMs = Number(waitMsStr);
      if (Number.isInteger(waitMs) && waitMs !== 2500) config.waitMs = waitMs;

      const proxy = await ask("Proxy server (leave blank for none)", "");
      if (proxy) config.proxy = proxy;

      const siteRulesDir = await ask("Custom site rules directory (leave blank for none)", "");
      if (siteRulesDir) config.siteRulesDir = siteRulesDir;

      const configPath = opts.global ? globalConfigPath() : localConfigPath();
      await saveConfig(config, configPath);
      console.error(`\nSaved config to ${configPath}`);
      console.error(JSON.stringify(config, null, 2));
    } finally {
      rl.close();
    }
  });

program
  .option("--output-dir <dir>", "Output directory for markdown notes")
  .option("--source-kind <kind>", "auto, html-page, or rss-feed", "auto")
  .option("--since <date>", "Only keep feed entries on or after YYYY-MM-DD", "")
  .option("--limit <n>", "Process only first N deduplicated URLs", "0")
  .option("--start <n>", "Start from 1-based index after deduplication", "1")
  .option("--end <n>", "End at 1-based index after deduplication", "0")
  .option("--prefer-browser-state", "Try copied local Chrome profile before regular browser fallback", false)
  .option("--chrome-user-data-dir <path>", "Chrome user data directory used with --prefer-browser-state", "")
  .option("--chrome-profile <name>", "Chrome profile directory name", "Default")
  .option("--fetch-mode <mode>", "auto, static, browser, or stealth")
  .option("--no-network-idle", "Do not wait for browser networkidle before reading HTML")
  .option("--wait-ms <ms>", "Extra browser wait after load")
  .option("--solve-cloudflare", "In stealth mode, attempt Cloudflare Turnstile/interstitial challenge handling", false)
  .option("--disable-resources", "In stealth mode, block images/media/fonts/stylesheets for speed", false)
  .option("--proxy <server>", "Proxy server for browser/stealth fetch, e.g. http://127.0.0.1:8080")
  .option("--dns-over-https", "Use Chromium Cloudflare DNS-over-HTTPS flag for browser/stealth fetch", false)
  .option("--wait-selector <selector>", "Wait for a CSS selector after page load", "")
  .option("--wait-selector-state <state>", "attached, detached, visible, or hidden", "attached")
  .option("--click-selector <selector...>", "Click one or more selectors after page load", [])
  .option("--scroll-to-bottom", "Scroll to the bottom before reading HTML", false)
  .option("--headful", "Run browser/browser-state fetches with a visible Chrome window", false)
  .option("--site-rules-dir <dir>", "Optional directory of private TOML site extraction/cleaning rules")
  .option("--no-real-chrome-defaults", "Disable Scrapling-inspired real Chrome context defaults")
  .option("--no-reuse-browser", "Disable batch browser/stealth context reuse")
  .option("--date-prefix", "Prefix note folder name with YYYY-MM-DD from article date")
  .option("--stdin", "Read text from stdin and extract URLs from it", false)
  .argument("[inputs...]", "URLs or files containing URLs")
  .action(async (rawInputs: string[], options: Record<string, unknown>) => {
    let inputs = rawInputs;

    if (options.stdin) {
      const chunks: string[] = [];
      for await (const chunk of process.stdin) {
        chunks.push(typeof chunk === "string" ? chunk : chunk.toString());
      }
      const text = chunks.join("");
      if (text.trim()) {
        inputs = [text];
      }
    }

    if (inputs.length === 0) {
      program.help({ error: true });
    }

    try {
      const { config, source: configSource } = await loadConfig();
      if (configSource) {
        console.error(`Config: ${configSource}`);
      }

      const sourceKind = String(options.sourceKind ?? "auto") as SourceKind;
      if (!["auto", "html-page", "rss-feed"].includes(sourceKind)) {
        throw new Error("--source-kind must be auto, html-page, or rss-feed");
      }
      const fetchMode = String(options.fetchMode ?? config.fetchMode ?? "auto") as "auto" | "static" | "browser" | "stealth";
      if (!["auto", "static", "browser", "stealth"].includes(fetchMode)) {
        throw new Error("--fetch-mode must be auto, static, browser, or stealth");
      }
      const waitMs = positiveIntOption(options.waitMs ?? config.waitMs, 2500);
      const waitSelectorState = String(options.waitSelectorState ?? "attached") as "attached" | "detached" | "visible" | "hidden";
      if (!["attached", "detached", "visible", "hidden"].includes(waitSelectorState)) {
        throw new Error("--wait-selector-state must be attached, detached, visible, or hidden");
      }
      const { items, checkboxFiles } = await parseInputs(inputs);
      const since = options.since ? parseSinceDate(String(options.since)) : undefined;
      const expanded = await expandSourceItems(items, sourceKind, since);
      const selected = sliceItems(
        expanded,
        positiveIntOption(options.start, 1),
        positiveIntOption(options.end, 0),
        positiveIntOption(options.limit, 0),
      );
      const siteRulesDir = expandTilde(String(options.siteRulesDir ?? config.siteRulesDir ?? ""));
      const builtinRulePaths = await siteRulePathsFromDir(builtinSiteRulesDir());
      const customRulePaths = siteRulesDir ? await siteRulePathsFromDir(resolve(siteRulesDir)) : [];
      const profiles = await loadSiteProfiles([...builtinRulePaths, ...customRulePaths]);
      const outputDir = expandTilde(String(options.outputDir ?? config.outputDir ?? "clippings"));
      let failures = 0;
      const tracker = new ProgressTracker(selected, outputDir);
      if (tracker.path) {
        console.error(`Progress: ${tracker.path}`);
      }

      const browserOptions = {
        waitMs,
        networkIdle: Boolean(options.networkIdle),
        proxy: String(options.proxy ?? config.proxy ?? "") || undefined,
        dnsOverHttps: Boolean(options.dnsOverHttps),
        waitSelector: String(options.waitSelector || "") || undefined,
        waitSelectorState,
        clickSelectors: Array.isArray(options.clickSelector) ? options.clickSelector.map(String) : [],
        scrollToBottom: Boolean(options.scrollToBottom),
        headless: !Boolean(options.headful),
        realChromeDefaults: options.realChromeDefaults !== false,
      };
      const browserStateDefaults = {
        userDataDir: String(options.chromeUserDataDir || ""),
        profile: String(options.chromeProfile || "Default"),
      };
      const sessions = options.reuseBrowser === false ? null : new BatchFetchSessions({
        browser: browserOptions,
        stealth: {
          ...browserOptions,
          solveCloudflare: Boolean(options.solveCloudflare),
          disableResources: Boolean(options.disableResources),
        },
      });

      try {
        for (const item of selected) {
          tracker.start(item.url);
          try {
            const result = await processItem(item, {
              outputDir,
              profiles,
              browserState: options.preferBrowserState ? { ...browserStateDefaults, ...browserOptions } : null,
              browserStateDefaults,
              fetchMode,
              ...browserOptions,
              solveCloudflare: Boolean(options.solveCloudflare),
              disableResources: Boolean(options.disableResources),
              browserFetch: sessions ? (targetUrl: string) => sessions.browserFetch(targetUrl) : undefined,
              stealthFetch: sessions ? (targetUrl: string) => sessions.stealthFetch(targetUrl) : undefined,
              onConflict: promptConflict,
              datePrefix: Boolean(options.datePrefix) || Boolean(config.datePrefix),
            });
            console.error(`Wrote ${result.outputPath}`);
            tracker.done(item.url, result.outputPath);
            const checkbox = item.sourcePath ? checkboxFiles.get(item.sourcePath) : undefined;
            checkbox?.markDone(item.lineNo, item.url);
          } catch (error) {
            if (error instanceof ConflictCancelledError) {
              console.error(`Skipped ${item.url}`);
              tracker.fail(item.url, "skipped");
            } else {
              failures += 1;
              const message = (error as Error).message || String(error);
              tracker.fail(item.url, message);
              console.error(`Failed ${item.url}: ${message}`);
            }
          }
        }
      } finally {
        await sessions?.close();
      }

      await Promise.all([...checkboxFiles.values()].map((checkbox) => checkbox.save()));
      process.exitCode = failures > 0 ? 1 : 0;
    } catch (error) {
      console.error((error as Error).message || String(error));
      process.exitCode = 2;
    }
  });

program.parseAsync();
