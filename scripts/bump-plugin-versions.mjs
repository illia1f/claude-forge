#!/usr/bin/env node
// Bumps versions for every plugin under plugins/ that changed between two git refs.
// Updates both the plugin's .claude-plugin/plugin.json and its entry in
// .claude-plugin/marketplace.json (plugin.json wins at runtime, so both must stay in sync).
//
// Usage: node scripts/bump-plugin-versions.mjs <baseRef> <headRef> [--dry-run]

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const EMPTY_SHA = /^0+$/;
// git's well-known empty tree object: diffing against it treats every file as added,
// which is exactly right when headRef is the repository's very first commit.
const EMPTY_TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";
// Plain MAJOR.MINOR.PATCH only — prerelease/build suffixes would silently become NaN
// in bump(), so reject them up front instead.
const SEMVER = /^\d+\.\d+\.\d+$/;

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
let [base, head] = args.filter((a) => a !== "--dry-run");
if (!base || !head) {
  fail("usage: bump-plugin-versions.mjs <baseRef> <headRef> [--dry-run]");
}

// Arg-array exec: git never sees a shell, so refs can't inject commands.
const git = (...argv) =>
  execFileSync("git", argv, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }).trim();

// Resolve all paths relative to the repo root so the script works from any cwd.
process.chdir(git("rev-parse", "--show-toplevel"));

const resolveCommit = (ref) => {
  try {
    return git("rev-parse", "--verify", "--quiet", `${ref}^{commit}`);
  } catch {
    return null;
  }
};

head = resolveCommit(head) ?? fail(`headRef does not resolve to a commit: ${head}`);

// First push to a branch reports an all-zero "before" SHA — fall back to the parent
// commit, or to the empty tree when head is the initial commit and has no parent.
// A non-zero base that doesn't resolve (force push whose old head is gone) gets the
// same fallback: a too-narrow range beats a red run.
if (EMPTY_SHA.test(base)) {
  base = resolveCommit(`${head}~1`) ?? EMPTY_TREE;
} else {
  const resolved = resolveCommit(base);
  if (resolved === null) {
    console.warn(`warning: baseRef does not resolve (force push?): ${base}; using ${head}~1`);
  }
  base = resolved ?? resolveCommit(`${head}~1`) ?? EMPTY_TREE;
}

// Version recorded at the base ref, or null when the plugin is new in this range.
// stderr ignored: a miss prints "fatal: path ... does not exist", which is the
// expected answer for a new plugin, not an error worth showing.
const versionAtBase = (name) => {
  let raw;
  try {
    raw = execFileSync(
      "git",
      ["show", `${base}:plugins/${name}/.claude-plugin/plugin.json`],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    );
  } catch {
    return null;
  }
  try {
    return JSON.parse(raw).version ?? "0.0.0";
  } catch (err) {
    fail(`cannot parse ${name} manifest at ${base}: ${err.message}`);
  }
};

// Which plugins changed? Derived from paths — new plugins are picked up automatically.
// -z gives NUL-separated, unquoted paths, so non-ASCII plugin names survive the filter.
const changedPlugins = [
  ...new Set(
    git("diff", "--name-only", "-z", base, head)
      .split("\0")
      .filter((f) => f.startsWith("plugins/"))
      .map((f) => f.split("/")[1])
      .filter(Boolean)
  ),
].filter((name) => existsSync(`plugins/${name}/.claude-plugin/plugin.json`));

if (changedPlugins.length === 0) {
  console.log("No plugin changes detected. Nothing to bump.");
  process.exit(0);
}

/**
 * Decide which semver part to bump for a plugin, based on the full commit
 * messages that touched it in this push.
 *
 * @param {string[]} messages - full commit messages (subject + body)
 * @returns {"major" | "minor" | "patch"}
 */
function decideBumpType(messages) {
  // Conventional Commits -> semver; the highest-ranked commit in the batch wins.
  // Breaking change = "!" after the type, or a BREAKING CHANGE / BREAKING-CHANGE
  // footer token at the start of a line (a mere mention mid-sentence doesn't count).
  const breakingFooter = /^BREAKING[- ]CHANGE:/m;
  if (messages.some((m) => /^\w+(\([^)]*\))?!:/.test(m) || breakingFooter.test(m))) {
    return "major";
  }
  if (messages.some((m) => /^feat(\([^)]*\))?:/.test(m))) {
    return "minor";
  }
  return "patch";
}

function bump(version, type) {
  const [major, minor, patch] = version.split(".").map(Number);
  if (type === "major") return `${major + 1}.0.0`;
  if (type === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

// Read/write JSON preserving 2-space indent + trailing newline (repo convention).
function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    fail(`cannot read ${path}: ${err.message}`);
  }
}
const writeJson = (path, data) =>
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");

const marketplacePath = ".claude-plugin/marketplace.json";
const marketplace = readJson(marketplacePath);
let marketplaceTouched = false;

// plugin.json wins at runtime, so a missing/stale entry is drift, not breakage —
// flag it loudly and keep the entry in lockstep otherwise.
function syncMarketplaceEntry(name, version) {
  const entry = marketplace.plugins?.find((p) => p.name === name);
  if (!entry) {
    console.warn(`warning: ${name} has no entry in ${marketplacePath}; only plugin.json updated`);
    return;
  }
  if (entry.version !== version) {
    entry.version = version;
    marketplaceTouched = true;
  }
}

for (const name of changedPlugins) {
  const manifestPath = `plugins/${name}/.claude-plugin/plugin.json`;
  const manifest = readJson(manifestPath);

  const current = manifest.version ?? "0.0.0";
  if (!SEMVER.test(current)) {
    fail(`${manifestPath}: version "${current}" is not plain MAJOR.MINOR.PATCH`);
  }

  // A human-set version wins. New plugins keep their authored version (creation
  // commits would bump a version nobody installed); a version field edited in this
  // range (manual bump, revert of a bad bump) is a deliberate choice — don't re-bump.
  const baseVersion = versionAtBase(name);
  if (baseVersion === null) {
    console.log(`${name}: new plugin, keeping authored version ${current}`);
    syncMarketplaceEntry(name, current);
    continue;
  }
  if (baseVersion !== current) {
    console.log(`${name}: version set manually ${baseVersion} -> ${current}, not bumping`);
    syncMarketplaceEntry(name, current);
    continue;
  }

  // %B = full message (subject + body) so BREAKING CHANGE footers are visible;
  // %x1e = record separator between commits. When base is the empty tree (initial
  // commit), there is no commit range — head's entire history is the range.
  const logRange = base === EMPTY_TREE ? head : `${base}..${head}`;
  const messages = git("log", "--format=%B%x1e", logRange, "--", `plugins/${name}`)
    .split("\x1e")
    .map((m) => m.trim())
    .filter(Boolean);

  const type = decideBumpType(messages);
  const next = bump(current, type);

  manifest.version = next;
  if (!dryRun) writeJson(manifestPath, manifest);

  syncMarketplaceEntry(name, next);

  console.log(`${name}: ${type} bump ${current} -> ${next}${dryRun ? " (dry run)" : ""}`);
}

if (marketplaceTouched && !dryRun) writeJson(marketplacePath, marketplace);
